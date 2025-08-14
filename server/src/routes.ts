import express from "express";
import axios from "axios";
import {
  type THealthResponse,
  type TPlaylistItemsResponse,
  PlaylistItemsQuery,
  type TVideoResponse,
} from "@tubetrack/shared";

const router = express.Router();

// Health check endpoint
router.get("/health", (_req, res) => {
  const health: THealthResponse = {
    ok: true,
    uptime: process.uptime(),
    version: process.env.npm_package_version || "unknown",
  };

  res.json(health);
});

// YouTube playlist items endpoint with pagination
router.get("/youtube/playlist/:playlistId/items", async (req, res, next) => {
  try {
    const { playlistId } = req.params;
    const queryParams = PlaylistItemsQuery.parse(req.query);

    if (!playlistId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Playlist ID is required",
        statusCode: 400,
      });
    }

    if (!process.env.YOUTUBE_API_KEY) {
      return res.status(500).json({
        error: "Server Configuration Error",
        message: "YouTube API key not configured",
        statusCode: 500,
      });
    }

    // Call YouTube Data API v3 playlistItems.list
    const youtubeResponse = await axios.get("https://www.googleapis.com/youtube/v3/playlistItems", {
      params: {
        part: "snippet,contentDetails",
        playlistId,
        maxResults: queryParams.pageSize,
        pageToken: queryParams.cursor || undefined,
        key: process.env.YOUTUBE_API_KEY,
      },
      timeout: 12000,
    });

    // Transform YouTube API response to our format
    const items = (youtubeResponse.data.items || [])
      .map((item: any) => ({
        videoId: item.contentDetails?.videoId || "",
        title: item.snippet?.title || "Untitled",
        channelTitle: item.snippet?.videoOwnerChannelTitle || item.snippet?.channelTitle || "",
        position: item.snippet?.position ?? 0,
        thumbnails: item.snippet?.thumbnails || {},
      }))
      .filter((item: any) => item.videoId); // Remove items without video ID

    const response: TPlaylistItemsResponse = {
      items,
      cursor: youtubeResponse.data.nextPageToken || null,
      total: youtubeResponse.data.pageInfo?.totalResults,
    };

    return res.json(response);
  } catch (error) {
    console.error("YouTube API error:", error);
    return next(error);
  }
});

// YouTube video details endpoint
router.get("/youtube/video/:videoId", async (req, res, next) => {
  try {
    const { videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Video ID is required",
        statusCode: 400,
      });
    }

    if (!process.env.YOUTUBE_API_KEY) {
      return res.status(500).json({
        error: "Server Configuration Error",
        message: "YouTube API key not configured",
        statusCode: 500,
      });
    }

    // Call YouTube Data API v3 videos.list
    const youtubeResponse = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
      params: {
        part: "snippet,contentDetails",
        id: videoId,
        key: process.env.YOUTUBE_API_KEY,
      },
      timeout: 12000,
    });

    console.log(`📹 Video API response for ${videoId}:`, {
      status: youtubeResponse.status,
      itemsCount: youtubeResponse.data.items?.length || 0,
      videoId
    });

    const video = youtubeResponse.data.items?.[0];
    if (!video) {
      console.log(`⚠️ Video not found: ${videoId}`);
      return res.status(404).json({
        error: "Not Found", 
        message: `Video not found or not accessible: ${videoId}`,
        statusCode: 404,
      });
    }

    // Parse duration from ISO 8601 format (PT4M13S) to seconds
    const durationMatch = video.contentDetails?.duration?.match(
      /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
    );
    let durationSec = 0;
    if (durationMatch) {
      const [, hours, minutes, seconds] = durationMatch;
      durationSec =
        parseInt(hours || "0", 10) * 3600 +
        parseInt(minutes || "0", 10) * 60 +
        parseInt(seconds || "0", 10);
    }

    const response: TVideoResponse = {
      id: video.id,
      title: video.snippet?.title || "Untitled",
      channelTitle: video.snippet?.channelTitle || "",
      durationSec,
      thumbnails: video.snippet?.thumbnails || {},
    };

    return res.json(response);
  } catch (error) {
    console.error("YouTube video API error:", error);
    return next(error);
  }
});

export default router;
