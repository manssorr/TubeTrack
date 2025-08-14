import { useState, useEffect, useCallback } from "react";
import { storage, StorageError } from "../lib/storage";
import { TAppState } from "../types";

// Custom hook for reactive local storage
export function useLocalStorage() {
  const [state, setState] = useState<TAppState>(() => storage.getState());
  const [error, setError] = useState<StorageError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Update local state when storage changes
  const refreshState = useCallback(() => {
    try {
      const newState = storage.getState();
      setState(newState);
      setError(null);
    } catch (err) {
      setError(err instanceof StorageError ? err : new StorageError(String(err)));
    }
  }, []);

  // Subscribe to storage changes (for when multiple components update storage)
  useEffect(() => {
    // Listen to storage events for cross-tab synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "tubetrack:state") {
        refreshState();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshState]);

  // Wrapped storage methods that update react state
  const updateState = useCallback(
    (partialState: Partial<TAppState>) => {
      try {
        setIsLoading(true);
        storage.setState(partialState);
        refreshState();
      } catch (err) {
        setError(err instanceof StorageError ? err : new StorageError(String(err)));
      } finally {
        setIsLoading(false);
      }
    },
    [refreshState]
  );

  const updateField = useCallback(
    <K extends keyof TAppState>(key: K, updater: (current: TAppState[K]) => TAppState[K]) => {
      try {
        setIsLoading(true);
        storage.update(key, updater);
        refreshState();
      } catch (err) {
        setError(err instanceof StorageError ? err : new StorageError(String(err)));
      } finally {
        setIsLoading(false);
      }
    },
    [refreshState]
  );

  const clearData = useCallback(() => {
    try {
      setIsLoading(true);
      storage.clearStorage();
      refreshState();
    } catch (err) {
      setError(err instanceof StorageError ? err : new StorageError(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [refreshState]);

  return {
    state,
    updateState,
    updateField,
    clearData,
    refreshState,
    isLoading,
    error,
  };
}

// Specialized hooks for common use cases
export function useSettings() {
  const { state, updateField } = useLocalStorage();

  const updateSettings = useCallback(
    (updater: (settings: TAppState["settings"]) => TAppState["settings"]) => {
      updateField("settings", updater);
    },
    [updateField]
  );

  return {
    settings: state.settings,
    updateSettings,
  };
}

export function usePlaylists() {
  const { state, updateField } = useLocalStorage();

  const addPlaylist = useCallback(
    (playlist: TAppState["playlists"][string]) => {
      updateField("playlists", playlists => ({
        ...playlists,
        [playlist.id]: playlist,
      }));
    },
    [updateField]
  );

  const removePlaylist = useCallback(
    (playlistId: string) => {
      updateField("playlists", playlists => {
        const { [playlistId]: removed, ...rest } = playlists;
        return rest;
      });

      // Also remove related videos and progress
      updateField("videos", videos => {
        const filtered: typeof videos = {};
        Object.values(videos).forEach(video => {
          if (video.playlistId !== playlistId) {
            filtered[video.id] = video;
          }
        });
        return filtered;
      });

      updateField("progress", progress => {
        const filtered: typeof progress = {};
        Object.entries(progress).forEach(([videoId, prog]) => {
          if (state.videos[videoId]?.playlistId !== playlistId) {
            filtered[videoId] = prog;
          }
        });
        return filtered;
      });
    },
    [updateField, state.videos]
  );

  return {
    playlists: state.playlists,
    addPlaylist,
    removePlaylist,
  };
}

export function useVideos() {
  const { state, updateField } = useLocalStorage();

  const addVideos = useCallback(
    (videos: TAppState["videos"][string][]) => {
      updateField("videos", currentVideos => {
        const newVideos = { ...currentVideos };
        videos.forEach(video => {
          newVideos[video.id] = video;
        });
        return newVideos;
      });
    },
    [updateField]
  );

  const getVideosByPlaylist = useCallback(
    (playlistId: string) => {
      return Object.values(state.videos)
        .filter(video => video.playlistId === playlistId)
        .sort((a, b) => a.position - b.position);
    },
    [state.videos]
  );

  return {
    videos: state.videos,
    addVideos,
    getVideosByPlaylist,
  };
}

export function useProgress() {
  const { state, updateField } = useLocalStorage();

  const updateProgress = useCallback(
    (videoId: string, progress: TAppState["progress"][string]) => {
      updateField("progress", currentProgress => ({
        ...currentProgress,
        [videoId]: progress,
      }));
    },
    [updateField]
  );

  const getVideoProgress = useCallback(
    (videoId: string) => {
      return (
        state.progress[videoId] || {
          videoId,
          watchedSeconds: 0,
          lastPositionSeconds: 0,
          completion: 0,
          lastWatchedAt: new Date().toISOString(),
        }
      );
    },
    [state.progress]
  );

  return {
    progress: state.progress,
    updateProgress,
    getVideoProgress,
  };
}

export function useNotes() {
  const { state, updateField } = useLocalStorage();

  const addOrUpdateNote = useCallback(
    (note: TAppState["notes"][string]) => {
      updateField("notes", notes => ({
        ...notes,
        [note.id]: note,
      }));
    },
    [updateField]
  );

  const removeNote = useCallback(
    (noteId: string) => {
      updateField("notes", notes => {
        const { [noteId]: removed, ...rest } = notes;
        return rest;
      });
    },
    [updateField]
  );

  const getNotesByVideo = useCallback(
    (videoId: string) => {
      return Object.values(state.notes)
        .filter(note => note.videoId === videoId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    },
    [state.notes]
  );

  return {
    notes: state.notes,
    addOrUpdateNote,
    removeNote,
    getNotesByVideo,
  };
}
