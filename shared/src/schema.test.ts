import { describe, it, expect } from "vitest";
import {
  Playlist,
  Video,
  Progress,
  Note,
  Settings,
  AppState,
  validatePlaylistId,
  validateVideoId,
  extractPlaylistId,
  formatDuration,
  parseTimestamp,
  APP_STATE_VERSION,
} from "./schema.js";

describe("Schema Validation", () => {
  describe("Playlist schema", () => {
    it("should validate a valid playlist", () => {
      const validPlaylist = {
        id: "PLrjkjhGRN8vdZxj7VfGlkc9e8GE4HGaIg",
        title: "Learn JavaScript",
        channelTitle: "Tech Channel",
        itemCount: 25,
        importedAt: new Date().toISOString(),
      };

      expect(() => Playlist.parse(validPlaylist)).not.toThrow();
    });

    it("should apply defaults for optional fields", () => {
      const playlist = {
        id: "PLrjkjhGRN8vdZxj7VfGlkc9e8GE4HGaIg",
        title: "Learn JavaScript",
        importedAt: new Date().toISOString(),
      };

      const parsed = Playlist.parse(playlist);
      expect(parsed.channelTitle).toBe("");
      expect(parsed.itemCount).toBe(0);
    });
  });

  describe("Video schema", () => {
    it("should validate a valid video", () => {
      const validVideo = {
        id: "dQw4w9WgXcQ",
        playlistId: "PLrjkjhGRN8vdZxj7VfGlkc9e8GE4HGaIg",
        title: "Never Gonna Give You Up",
        channelTitle: "Rick Astley",
        durationSec: 212,
        position: 0,
      };

      expect(() => Video.parse(validVideo)).not.toThrow();
    });
  });

  describe("Progress schema", () => {
    it("should validate progress data", () => {
      const validProgress = {
        videoId: "dQw4w9WgXcQ",
        watchedSeconds: 120.5,
        lastPositionSeconds: 150.2,
        completion: 0.75,
        lastWatchedAt: new Date().toISOString(),
      };

      expect(() => Progress.parse(validProgress)).not.toThrow();
    });

    it("should reject invalid completion values", () => {
      const invalidProgress = {
        videoId: "dQw4w9WgXcQ",
        watchedSeconds: 120,
        lastPositionSeconds: 150,
        completion: 1.5, // Invalid: > 1
        lastWatchedAt: new Date().toISOString(),
      };

      expect(() => Progress.parse(invalidProgress)).toThrow();
    });
  });

  describe("Note schema", () => {
    it("should validate a note with timestamps", () => {
      const validNote = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        videoId: "dQw4w9WgXcQ",
        content: "Great explanation at [2:30]",
        timestamps: [{ seconds: 150, label: "Key concept" }],
        tags: ["javascript", "tutorial"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(() => Note.parse(validNote)).not.toThrow();
    });
  });

  describe("Settings schema", () => {
    it("should apply default values", () => {
      const settings = Settings.parse({});

      expect(settings.theme).toBe("system");
      expect(settings.playerRate).toBe(1);
      expect(settings.playerMode).toBe("default");
      expect(settings.keyboardShortcuts).toBe(true);
    });

    it("should validate player rate bounds", () => {
      expect(() => Settings.parse({ playerRate: 0.1 })).toThrow(); // Too low
      expect(() => Settings.parse({ playerRate: 3.0 })).toThrow(); // Too high
      expect(() => Settings.parse({ playerRate: 1.5 })).not.toThrow(); // Valid
    });
  });

  describe("AppState schema", () => {
    it("should validate complete app state", () => {
      const validAppState = {
        version: APP_STATE_VERSION,
        playlists: {},
        videos: {},
        progress: {},
        notes: {},
        settings: {
          theme: "dark" as const,
          playerRate: 1.25,
          playerMode: "theater" as const,
          keyboardShortcuts: true,
        },
      };

      expect(() => AppState.parse(validAppState)).not.toThrow();
    });
  });
});

describe("Utility Functions", () => {
  describe("validatePlaylistId", () => {
    it("should validate YouTube playlist IDs", () => {
      expect(validatePlaylistId("PLrjkjhGRN8vdZxj7VfGlkc9e8GE4HGaIg")).toBe(true);
      expect(validatePlaylistId("UUrjkjhGRN8vdZxj7VfGlkc9e8GE4HGaIg")).toBe(true);
      expect(validatePlaylistId("invalid-id")).toBe(false);
      expect(validatePlaylistId("")).toBe(false);
    });
  });

  describe("validateVideoId", () => {
    it("should validate YouTube video IDs", () => {
      expect(validateVideoId("dQw4w9WgXcQ")).toBe(true);
      expect(validateVideoId("invalid")).toBe(false);
      expect(validateVideoId("")).toBe(false);
    });
  });

  describe("extractPlaylistId", () => {
    it("should extract playlist ID from various URL formats", () => {
      const urls = [
        "https://www.youtube.com/playlist?list=PLrjkjhGRN8vdZxj7VfGlkc9e8GE4HGaIg",
        "https://youtube.com/watch?v=dQw4w9WgXcQ&list=PLrjkjhGRN8vdZxj7VfGlkc9e8GE4HGaIg",
        "PLrjkjhGRN8vdZxj7VfGlkc9e8GE4HGaIg",
      ];

      urls.forEach(url => {
        expect(extractPlaylistId(url)).toBe("PLrjkjhGRN8vdZxj7VfGlkc9e8GE4HGaIg");
      });

      expect(extractPlaylistId("invalid-url")).toBe(null);
    });
  });

  describe("formatDuration", () => {
    it("should format duration in mm:ss format", () => {
      expect(formatDuration(90)).toBe("1:30");
      expect(formatDuration(3661)).toBe("1:01:01");
      expect(formatDuration(30)).toBe("0:30");
    });
  });

  describe("parseTimestamp", () => {
    it("should parse various timestamp formats", () => {
      expect(parseTimestamp("[2:30]")).toBe(150);
      expect(parseTimestamp("2:30")).toBe(150);
      expect(parseTimestamp("[1:02:30]")).toBe(3750);
      expect(parseTimestamp("invalid")).toBe(0);
    });
  });
});
