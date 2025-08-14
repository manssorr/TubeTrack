import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Video data structure
export const videoSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  duration: z.number(), // in seconds
  watchedSegments: z.array(z.tuple([z.number(), z.number()])).default([]), // [start, end] pairs
  lastPosition: z.number().default(0),
  notes: z.string().default(""),
  actualTimeSpent: z.number().default(0), // total seconds spent on this video
  completed: z.boolean().default(false),
});

// Playlist data structure
export const playlistSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  url: z.string().optional(),
  videos: z.array(videoSchema),
  startDate: z.string(),
  totalActualTime: z.number().default(0), // total seconds spent learning
  currentVideoIndex: z.number().default(0),
  lastAccessed: z.string().optional(),
  createdAt: z.string().optional(),
  isFavorite: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

// User settings schema
export const userSettingsSchema = z.object({
  theme: z.enum(['light', 'dark']).default('light'),
  darkMode: z.boolean().default(false),
  autoSave: z.boolean().default(true),
  autoSaveInterval: z.number().default(30000), // 30 seconds
  videoPlayerMode: z.enum(['normal', 'theater', 'fullscreen', 'focus']).default('normal'),
  showKeyboardShortcuts: z.boolean().default(true),
  autoMarkCompleted: z.boolean().default(false), // Auto-mark video as completed at 90%
});

// Progress tracking data
export const progressDataSchema = z.object({
  playlists: z.array(playlistSchema),
  settings: userSettingsSchema,
});

export type Video = z.infer<typeof videoSchema>;
export type Playlist = z.infer<typeof playlistSchema>;
export type UserSettings = z.infer<typeof userSettingsSchema>;
export type ProgressData = z.infer<typeof progressDataSchema>;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
