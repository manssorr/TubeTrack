import { useInfiniteQuery, useQuery, useMutation } from "@tanstack/react-query";
import {
  TPlaylistItemsResponse,
  TVideoResponse,
  extractPlaylistId,
  validatePlaylistId,
  validateVideoId,
} from "@tubetrack/shared";

// API Base URL
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5174";

// Error types
export class YouTubeAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = "YouTubeAPIError";
  }
}

// API request helper with error handling
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorCode = String(response.status);

      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
        if (errorData.error) {
          errorCode = errorData.error;
        }
      } catch {
        // Ignore JSON parse errors, use default message
      }

      throw new YouTubeAPIError(errorMessage, response.status, errorCode);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof YouTubeAPIError) {
      throw error;
    }

    // Network or other errors
    throw new YouTubeAPIError(error instanceof Error ? error.message : String(error));
  }
}

// Core API functions
export const youtubeAPI = {
  async getPlaylistItems(
    playlistId: string,
    cursor?: string,
    pageSize = 50
  ): Promise<TPlaylistItemsResponse> {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    params.set("pageSize", String(pageSize));

    const query = params.toString();
    const endpoint = `/api/youtube/playlist/${playlistId}/items${query ? `?${query}` : ""}`;

    return apiRequest<TPlaylistItemsResponse>(endpoint);
  },

  async getVideo(videoId: string): Promise<TVideoResponse> {
    return apiRequest<TVideoResponse>(`/api/youtube/video/${videoId}`);
  },
};

// React Query hooks
export function usePlaylistItems(playlistId: string | null, pageSize = 50) {
  return useInfiniteQuery({
    queryKey: ["playlistItems", playlistId, pageSize],
    queryFn: async ({ pageParam }) => {
      if (!playlistId) throw new Error("Playlist ID is required");
      return youtubeAPI.getPlaylistItems(playlistId, pageParam, pageSize);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.cursor || undefined,
    enabled: Boolean(playlistId && validatePlaylistId(playlistId)),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (except rate limiting)
      if (error instanceof YouTubeAPIError) {
        if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
          return false;
        }
      }
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useVideo(videoId: string | null) {
  return useQuery({
    queryKey: ["video", videoId],
    queryFn: () => {
      if (!videoId) throw new Error("Video ID is required");
      return youtubeAPI.getVideo(videoId);
    },
    enabled: Boolean(videoId && validateVideoId(videoId)),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

// Playlist import types and hooks
export interface PlaylistImportProgress {
  totalItems: number | null;
  importedItems: number;
  currentPage: number;
  isComplete: boolean;
  error: string | null;
}

export interface PlaylistImportResult {
  playlistId: string;
  playlistTitle: string;
  channelTitle: string;
  totalVideos: number;
  importedVideos: number;
  videos: Array<{
    id: string;
    title: string;
    channelTitle: string;
    durationSec: number;
    position: number;
    thumbnails: Record<string, any>;
  }>;
}

export function usePlaylistImport() {
  return useMutation({
    mutationFn: async (playlistUrl: string): Promise<PlaylistImportResult> => {
      // Extract playlist ID from URL
      const playlistId = extractPlaylistId(playlistUrl);
      if (!playlistId) {
        throw new YouTubeAPIError("Invalid playlist URL or ID");
      }

      if (!validatePlaylistId(playlistId)) {
        throw new YouTubeAPIError("Invalid playlist ID format");
      }

      const allVideos: PlaylistImportResult["videos"] = [];
      let cursor: string | undefined = undefined;
      let totalItems: number | null = null;
      let playlistTitle = "";
      let channelTitle = "";

      // Fetch all pages
      do {
        const response = await youtubeAPI.getPlaylistItems(playlistId, cursor);

        // Set total from first response
        if (totalItems === null) {
          totalItems = response.total || null;
        }

        // Get playlist metadata from first video if available
        if (response.items.length > 0 && !playlistTitle) {
          playlistTitle = `Playlist ${playlistId}`; // We'll enhance this later
          channelTitle = response.items[0]?.channelTitle || "";
        }

        // Process videos and fetch durations
        for (const item of response.items) {
          try {
            // Get video details for duration
            const videoDetails = await youtubeAPI.getVideo(item.videoId);

            allVideos.push({
              id: item.videoId,
              title: item.title,
              channelTitle: item.channelTitle || videoDetails.channelTitle,
              durationSec: videoDetails.durationSec,
              position: item.position,
              thumbnails: item.thumbnails || videoDetails.thumbnails,
            });
          } catch (videoError) {
            console.warn(`Failed to fetch details for video ${item.videoId}:`, videoError);
            
            // Skip videos that are private, deleted, or restricted
            if (videoError instanceof YouTubeAPIError && videoError.status === 404) {
              console.log(`⚠️ Skipping unavailable video: ${item.videoId} - "${item.title}"`);
              continue; // Don't add this video to the list
            }
            
            // For other errors, add video with basic info
            allVideos.push({
              id: item.videoId,
              title: item.title || `Video ${item.videoId}`,
              channelTitle: item.channelTitle || "",
              durationSec: 0, // Unknown duration
              position: item.position,
              thumbnails: item.thumbnails || {},
            });
          }
        }

        cursor = response.cursor || undefined;
      } while (cursor);

      console.log(`✅ Import completed:`, {
        playlistId,
        playlistTitle,
        totalVideos: totalItems || allVideos.length,
        importedVideos: allVideos.length,
        skippedVideos: (totalItems || 0) - allVideos.length,
      });

      return {
        playlistId,
        playlistTitle,
        channelTitle,
        totalVideos: totalItems || allVideos.length,
        importedVideos: allVideos.length,
        videos: allVideos,
      };
    },
    retry: (failureCount, error) => {
      // Don't retry on validation errors
      if (error instanceof YouTubeAPIError && error.message.includes("Invalid")) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 2000,
  });
}

// Helper function to validate playlist URL/ID
export function validatePlaylistInput(input: string): {
  isValid: boolean;
  playlistId: string | null;
  error: string | null;
} {
  if (!input.trim()) {
    return { isValid: false, playlistId: null, error: "Please enter a playlist URL or ID" };
  }

  const playlistId = extractPlaylistId(input.trim());
  if (!playlistId) {
    return {
      isValid: false,
      playlistId: null,
      error: "Could not extract playlist ID from the provided URL",
    };
  }

  if (!validatePlaylistId(playlistId)) {
    return {
      isValid: false,
      playlistId: null,
      error: "Invalid playlist ID format",
    };
  }

  return { isValid: true, playlistId, error: null };
}

// Export types
export type { TPlaylistItemsResponse, TVideoResponse };
