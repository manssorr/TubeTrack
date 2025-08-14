import { z } from "zod";

// Base schemas
export const Thumbnail = z.object({
  url: z.string().url(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const Playlist = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  channelTitle: z.string().optional().default(""),
  itemCount: z.number().int().nonnegative().optional().default(0),
  importedAt: z.string(),
});

export const Video = z.object({
  id: z.string().min(1),
  playlistId: z.string().min(1),
  title: z.string().min(1),
  channelTitle: z.string().optional().default(""),
  durationSec: z.number().int().nonnegative(),
  thumbnails: z.record(Thumbnail).optional().default({}),
  position: z.number().int().nonnegative(),
});

export const Progress = z.object({
  videoId: z.string().min(1),
  watchedSeconds: z.number().nonnegative(),
  lastPositionSeconds: z.number().nonnegative(),
  completion: z.number().min(0).max(1),
  lastWatchedAt: z.string(),
  completedAt: z.string().optional(),
});

export const Note = z.object({
  id: z.string().uuid(),
  videoId: z.string().min(1),
  content: z.string(),
  timestamps: z.array(
    z.object({
      seconds: z.number().nonnegative(),
      label: z.string().optional(),
    })
  ),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const Settings = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  playerRate: z.number().min(0.25).max(2).default(1),
  playerMode: z.enum(["default", "theater", "minimal"]).default("default"),
  keyboardShortcuts: z.boolean().default(true),
});

export const AppState = z.object({
  version: z.number().int().nonnegative(),
  playlists: z.record(Playlist),
  videos: z.record(Video),
  progress: z.record(Progress),
  notes: z.record(Note),
  settings: Settings,
});

// API Schemas
export const PlaylistItemsResponse = z.object({
  items: z.array(
    z.object({
      videoId: z.string().min(1),
      title: z.string().min(1),
      channelTitle: z.string().optional().default(""),
      position: z.number().int().nonnegative(),
      thumbnails: z.record(z.any()).optional().default({}),
    })
  ),
  cursor: z.string().nullable(),
  total: z.number().int().nonnegative().optional(),
});

export const VideoResponse = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  channelTitle: z.string().optional().default(""),
  durationSec: z.number().int().nonnegative(),
  thumbnails: z.record(Thumbnail).optional().default({}),
});

export const HealthResponse = z.object({
  ok: z.boolean(),
  uptime: z.number().optional(),
  version: z.string().optional(),
});

export const ErrorResponse = z.object({
  error: z.string().min(1),
  message: z.string().optional(),
  statusCode: z.number().int().min(400).max(599).optional(),
});

// Query parameter schemas
export const PlaylistItemsQuery = z.object({
  cursor: z.string().optional(),
  pageSize: z.coerce.number().min(1).max(50).default(50),
});

// TypeScript types
export type TThumbnail = z.infer<typeof Thumbnail>;
export type TPlaylist = z.infer<typeof Playlist>;
export type TVideo = z.infer<typeof Video>;
export type TProgress = z.infer<typeof Progress>;
export type TNote = z.infer<typeof Note>;
export type TSettings = z.infer<typeof Settings>;
export type TAppState = z.infer<typeof AppState>;

export type TPlaylistItemsResponse = z.infer<typeof PlaylistItemsResponse>;
export type TVideoResponse = z.infer<typeof VideoResponse>;
export type THealthResponse = z.infer<typeof HealthResponse>;
export type TErrorResponse = z.infer<typeof ErrorResponse>;
export type TPlaylistItemsQuery = z.infer<typeof PlaylistItemsQuery>;

// Utility types
export type PlaylistId = string;
export type VideoId = string;
export type NoteId = string;

// Constants
export const APP_STATE_VERSION = 1;
export const LOCAL_STORAGE_KEY = "tubetrack:state";

// Validation helpers
export const validatePlaylistId = (id: string): boolean => {
  // YouTube playlist IDs are typically 34 characters starting with "PL"
  return /^PL[a-zA-Z0-9_-]{32}$/.test(id) || /^[a-zA-Z0-9_-]{18,}$/.test(id);
};

export const validateVideoId = (id: string): boolean => {
  // YouTube video IDs are 11 characters
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
};

export const extractPlaylistId = (url: string): string | null => {
  // Handle various YouTube playlist URL formats
  const patterns = [
    /[?&]list=([a-zA-Z0-9_-]+)/,
    /playlist\?list=([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]{18,})$/, // Direct playlist ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

export const parseTimestamp = (timestamp: string): number => {
  // Parse [mm:ss] or [h:mm:ss] format
  const match = timestamp.match(/^\[?(\d+):(\d{2}):?(\d{2})?\]?$/);
  if (!match) return 0;

  const hours = match[1];
  const minutes = match[2];
  const seconds = match[3];

  if (!hours || !minutes) return 0;

  let totalSeconds = parseInt(minutes, 10) * 60;

  if (seconds) {
    // h:mm:ss format
    totalSeconds = parseInt(hours, 10) * 3600 + totalSeconds + parseInt(seconds, 10);
  } else {
    // mm:ss format
    totalSeconds = parseInt(hours, 10) * 60 + parseInt(minutes, 10);
  }

  return totalSeconds;
};
