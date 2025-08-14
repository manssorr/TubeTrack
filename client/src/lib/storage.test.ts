import { describe, it, expect, beforeEach, vi } from "vitest";
import { storage, storageHelpers, StorageError } from "./storage";
import { APP_STATE_VERSION, LOCAL_STORAGE_KEY } from "@tubetrack/shared";

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

// Mock console methods
vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

describe("Storage System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset cached state
    (storage as any).cachedState = null;
    // Clear actual localStorage
    storage.clearStorage();
  });

  describe("Initial State", () => {
    it("should create initial state when localStorage is empty", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const state = storage.getState();

      expect(state).toEqual({
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
      });
    });

    it("should load existing valid state", () => {
      const existingState = {
        version: APP_STATE_VERSION,
        playlists: {
          "test-id": {
            id: "test-id",
            title: "Test Playlist",
            importedAt: "2023-01-01",
            channelTitle: "",
            itemCount: 5,
          },
        },
        videos: {},
        progress: {},
        notes: {},
        settings: {
          theme: "dark",
          playerRate: 1.5,
          playerMode: "theater",
          keyboardShortcuts: false,
        },
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingState));

      const state = storage.getState();

      expect(state.settings.theme).toBe("dark");
      expect(state.settings.playerRate).toBe(1.5);
      expect(state.playlists["test-id"]).toBeDefined();
    });
  });

  describe("Migration", () => {
    it("should migrate from version 0 to current version", () => {
      const oldState = {
        // No version field
        playlists: {},
        videos: {},
        progress: {},
        notes: {},
        settings: {
          theme: "light",
          playerRate: 2,
        },
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(oldState));

      const state = storage.getState();

      expect(state.version).toBe(APP_STATE_VERSION);
      expect(state.settings.theme).toBe("light");
      expect(state.settings.playerRate).toBe(2);
      expect(state.settings.keyboardShortcuts).toBe(true); // Default value
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_KEY,
        expect.stringContaining(`"version":${APP_STATE_VERSION}`)
      );
    });

    it("should handle invalid state gracefully", () => {
      mockLocalStorage.getItem.mockReturnValue("invalid json");

      const state = storage.getState();

      expect(state.version).toBe(APP_STATE_VERSION);
      expect(state.playlists).toEqual({});
      // The console methods are called, but they may be called from different parts of the code
      expect(mockLocalStorage.setItem).toHaveBeenCalled(); // Fresh state should be saved
    });
  });

  describe("State Updates", () => {
    it("should update state correctly", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      storage.setState({
        playlists: {
          test: {
            id: "test",
            title: "Test",
            importedAt: "2023-01-01",
            channelTitle: "",
            itemCount: 0,
          },
        },
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_KEY,
        expect.stringContaining('"test"')
      );
    });

    it("should update specific fields", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      storage.update("settings", settings => ({
        ...settings,
        theme: "dark",
      }));

      const state = storage.getState();
      expect(state.settings.theme).toBe("dark");
    });

    it("should clear storage", () => {
      storage.clearStorage();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(LOCAL_STORAGE_KEY);
    });
  });

  describe("Storage Helpers", () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(null);
    });

    it("should add playlist correctly", () => {
      const playlist = {
        id: "test-playlist",
        title: "Test Playlist",
        channelTitle: "Test Channel",
        itemCount: 10,
        importedAt: "2023-01-01T00:00:00.000Z",
      };

      storageHelpers.addPlaylist(playlist);

      const state = storage.getState();
      expect(state.playlists["test-playlist"]).toEqual(playlist);
    });

    it("should remove playlist and related data", () => {
      // First add some data
      storageHelpers.addPlaylist({
        id: "playlist-1",
        title: "Playlist 1",
        channelTitle: "",
        itemCount: 2,
        importedAt: "2023-01-01T00:00:00.000Z",
      });

      storageHelpers.addVideos([
        {
          id: "video-1",
          playlistId: "playlist-1",
          title: "Video 1",
          channelTitle: "",
          durationSec: 300,
          position: 0,
          thumbnails: {},
        },
        {
          id: "video-2",
          playlistId: "other-playlist",
          title: "Video 2",
          channelTitle: "",
          durationSec: 400,
          position: 0,
          thumbnails: {},
        },
      ]);

      // Remove playlist
      storageHelpers.removePlaylist("playlist-1");

      const state = storage.getState();
      expect(state.playlists["playlist-1"]).toBeUndefined();
      expect(state.videos["video-1"]).toBeUndefined(); // Should be removed
      expect(state.videos["video-2"]).toBeDefined(); // Should remain
    });

    it("should calculate playlist statistics", () => {
      // Add playlist and videos
      storageHelpers.addPlaylist({
        id: "stats-playlist",
        title: "Stats Playlist",
        channelTitle: "",
        itemCount: 2,
        importedAt: "2023-01-01T00:00:00.000Z",
      });

      storageHelpers.addVideos([
        {
          id: "video-1",
          playlistId: "stats-playlist",
          title: "Video 1",
          channelTitle: "",
          durationSec: 300, // 5 minutes
          position: 0,
          thumbnails: {},
        },
        {
          id: "video-2",
          playlistId: "stats-playlist",
          title: "Video 2",
          channelTitle: "",
          durationSec: 600, // 10 minutes
          position: 1,
          thumbnails: {},
        },
      ]);

      // Add progress
      storageHelpers.updateProgress("video-1", {
        videoId: "video-1",
        watchedSeconds: 270, // 4.5 minutes
        lastPositionSeconds: 270,
        completion: 0.9,
        lastWatchedAt: "2023-01-01T00:00:00.000Z",
      });

      storageHelpers.updateProgress("video-2", {
        videoId: "video-2",
        watchedSeconds: 300, // 5 minutes
        lastPositionSeconds: 300,
        completion: 0.5,
        lastWatchedAt: "2023-01-01T00:00:00.000Z",
      });

      const stats = storageHelpers.getPlaylistStats("stats-playlist");

      expect(stats).toEqual({
        totalVideos: 2,
        completedVideos: 1, // Only video-1 has completion >= 0.9
        totalDuration: 900, // 5 + 10 minutes
        watchedTime: 570, // 4.5 + 5 minutes
      });
    });
  });

  describe("Error Handling", () => {
    it("should throw StorageError on save failure", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      expect(() => {
        storage.setState({ playlists: {} });
      }).toThrow(StorageError);
    });
  });
});
