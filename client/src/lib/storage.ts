import {
  AppState,
  TAppState,
  TSettings,
  APP_STATE_VERSION,
  LOCAL_STORAGE_KEY,
} from "@tubetrack/shared";

// Storage error class
export class StorageError extends Error {
  constructor(
    message: string,
    public cause?: Error
  ) {
    super(message);
    this.name = "StorageError";
  }
}

// Migration function type
type MigrationFunction = (oldState: any) => TAppState;

// Migration registry - add new migrations as versions increase
const migrations: Record<number, MigrationFunction> = {
  1: (oldState: any): TAppState => {
    // Migration from version 0 (or no version) to version 1
    return {
      version: 1,
      playlists: oldState?.playlists || {},
      videos: oldState?.videos || {},
      progress: oldState?.progress || {},
      notes: oldState?.notes || {},
      settings: {
        theme: oldState?.settings?.theme || "system",
        playerRate: oldState?.settings?.playerRate || 1,
        playerMode: oldState?.settings?.playerMode || "default",
        keyboardShortcuts: oldState?.settings?.keyboardShortcuts ?? true,
      },
    };
  },
  // Add future migrations here as needed
  // 2: (oldState: any) => { /* migration from v1 to v2 */ }
};

// Create initial empty state
function createInitialState(): TAppState {
  return {
    version: APP_STATE_VERSION,
    playlists: {},
    videos: {},
    progress: {},
    notes: {},
    settings: {
      theme: "system",
      playerRate: 1,
      playerMode: "default",
      keyboardShortcuts: true,
    },
  };
}

// Load and migrate state from localStorage
function loadState(): TAppState {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      return createInitialState();
    }

    const parsed = JSON.parse(stored);
    let currentState = parsed;

    // Check if migration is needed
    const storedVersion = parsed.version || 0;
    if (storedVersion < APP_STATE_VERSION) {
      // Run migrations step by step
      for (let version = storedVersion + 1; version <= APP_STATE_VERSION; version++) {
        const migration = migrations[version];
        if (migration) {
          console.log(`🔄 Migrating storage from version ${version - 1} to ${version}`);
          currentState = migration(currentState);
        }
      }

      // Save migrated state
      saveState(currentState);
      console.log(`✅ Storage migrated successfully to version ${APP_STATE_VERSION}`);
    }

    // Validate the final state
    const validatedState = AppState.parse(currentState);
    return validatedState;
  } catch (error) {
    console.error("❌ Failed to load or migrate storage:", error);

    // Create fresh state and notify user
    const freshState = createInitialState();
    saveState(freshState);

    // You might want to show a toast notification here
    console.warn("🔄 Local data reset due to schema change");

    return freshState;
  }
}

// Save state to localStorage
function saveState(state: TAppState): void {
  try {
    // Validate state before saving
    const validatedState = AppState.parse(state);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(validatedState));
  } catch (error) {
    throw new StorageError("Failed to save state to localStorage", error as Error);
  }
}

// Storage interface
interface StorageInterface {
  getState(): TAppState;
  setState(state: Partial<TAppState>): void;
  update<K extends keyof TAppState>(key: K, updater: (current: TAppState[K]) => TAppState[K]): void;
  clearStorage(): void;
}

// Create storage instance with caching
let cachedState: TAppState | null = null;

export const storage: StorageInterface = {
  getState(): TAppState {
    if (!cachedState) {
      cachedState = loadState();
    }
    return cachedState;
  },

  setState(partialState: Partial<TAppState>): void {
    const currentState = this.getState();
    const newState = { ...currentState, ...partialState };

    saveState(newState);
    cachedState = newState;

    // Trigger storage event for other tabs and force refresh
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: LOCAL_STORAGE_KEY,
        newValue: JSON.stringify(newState),
        oldValue: JSON.stringify(currentState),
      })
    );
  },

  update<K extends keyof TAppState>(
    key: K,
    updater: (current: TAppState[K]) => TAppState[K]
  ): void {
    const currentState = this.getState();
    const updatedValue = updater(currentState[key]);
    const newState = { ...currentState, [key]: updatedValue };

    saveState(newState);
    cachedState = newState;

    // Trigger storage event for other tabs and force refresh
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: LOCAL_STORAGE_KEY,
        newValue: JSON.stringify(newState),
        oldValue: JSON.stringify(currentState),
      })
    );
  },

  clearStorage(): void {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    cachedState = null;
  },
};

// Debounced save utility for frequent updates (like notes)
let saveTimeout: NodeJS.Timeout | null = null;

export function withPersist<T extends any[], R>(
  fn: (...args: T) => R,
  debounceMs: number = 500
): (...args: T) => R {
  return (...args: T): R => {
    const result = fn(...args);

    // Debounce the save
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(() => {
      // Force a save by accessing the current state
      if (cachedState) {
        saveState(cachedState);
      }
    }, debounceMs);

    return result;
  };
}

// Helper functions for common operations
export const storageHelpers = {
  // Settings helpers
  updateSettings(updater: (settings: TSettings) => TSettings): void {
    storage.update("settings", updater);
  },

  // Playlist helpers
  addPlaylist(playlist: TAppState["playlists"][string]): void {
    storage.update("playlists", playlists => ({
      ...playlists,
      [playlist.id]: playlist,
    }));
  },

  removePlaylist(playlistId: string): void {
    storage.update("playlists", playlists => {
      const { [playlistId]: removed, ...rest } = playlists;
      return rest;
    });

    // Also remove related videos
    storage.update("videos", videos => {
      const filtered: typeof videos = {};
      Object.values(videos).forEach(video => {
        if (video.playlistId !== playlistId) {
          filtered[video.id] = video;
        }
      });
      return filtered;
    });
  },

  // Video helpers
  addVideos(videos: TAppState["videos"][string][]): void {
    storage.update("videos", currentVideos => {
      const newVideos = { ...currentVideos };
      videos.forEach(video => {
        newVideos[video.id] = video;
      });
      return newVideos;
    });
  },

  // Progress helpers
  updateProgress(videoId: string, progress: TAppState["progress"][string]): void {
    storage.update("progress", currentProgress => ({
      ...currentProgress,
      [videoId]: progress,
    }));
  },

  // Notes helpers
  addOrUpdateNote(note: TAppState["notes"][string]): void {
    storage.update("notes", notes => ({
      ...notes,
      [note.id]: note,
    }));
  },

  removeNote(noteId: string): void {
    storage.update("notes", notes => {
      const { [noteId]: removed, ...rest } = notes;
      return rest;
    });
  },

  // Statistics helpers
  getPlaylistStats(playlistId: string): {
    totalVideos: number;
    completedVideos: number;
    totalDuration: number;
    watchedTime: number;
  } {
    const state = storage.getState();
    const videos = Object.values(state.videos).filter(v => v.playlistId === playlistId);
    const progress = state.progress;

    const totalVideos = videos.length;
    const completedVideos = videos.filter(v => (progress[v.id]?.completion ?? 0) >= 0.9).length;
    const totalDuration = videos.reduce((sum, v) => sum + v.durationSec, 0);
    const watchedTime = videos.reduce((sum, v) => sum + (progress[v.id]?.watchedSeconds || 0), 0);

    return { totalVideos, completedVideos, totalDuration, watchedTime };
  },
};

// Export types
export type { StorageInterface };
