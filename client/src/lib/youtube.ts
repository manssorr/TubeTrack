const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || "";

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  duration: string; // ISO 8601 duration format
  url: string;
}

export interface YouTubePlaylistInfo {
  id: string;
  title: string;
  videos: YouTubeVideoInfo[];
}

// Convert ISO 8601 duration to seconds
export function durationToSeconds(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}

// Extract playlist ID from YouTube URL
export function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Extract video ID from YouTube URL
export function extractVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
  );
  return match ? match[1] : null;
}

// Fetch playlist information from YouTube API
export async function fetchPlaylistInfo(
  playlistId: string,
): Promise<YouTubePlaylistInfo> {
  if (!YOUTUBE_API_KEY) {
    throw new Error(
      "YouTube API key is required. Please set VITE_YOUTUBE_API_KEY environment variable.",
    );
  }

  try {
    // Fetch playlist details
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${YOUTUBE_API_KEY}`,
    );

    if (!playlistResponse.ok) {
      throw new Error(
        `Failed to fetch playlist: ${playlistResponse.statusText}`,
      );
    }

    const playlistData = await playlistResponse.json();

    if (!playlistData.items || playlistData.items.length === 0) {
      throw new Error("Playlist not found");
    }

    const playlistTitle = playlistData.items[0].snippet.title;

    // Fetch playlist items
    const itemsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${YOUTUBE_API_KEY}`,
    );

    if (!itemsResponse.ok) {
      throw new Error(
        `Failed to fetch playlist items: ${itemsResponse.statusText}`,
      );
    }

    const itemsData = await itemsResponse.json();

    if (!itemsData.items) {
      throw new Error("No videos found in playlist");
    }

    // Extract video IDs
    const videoIds = itemsData.items
      .map((item: any) => item.snippet.resourceId.videoId)
      .filter(Boolean);

    if (videoIds.length === 0) {
      throw new Error("No valid videos found in playlist");
    }

    // Fetch video details including duration
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds.join(",")}&key=${YOUTUBE_API_KEY}`,
    );

    if (!videosResponse.ok) {
      throw new Error(
        `Failed to fetch video details: ${videosResponse.statusText}`,
      );
    }

    const videosData = await videosResponse.json();

    const videos: YouTubeVideoInfo[] = videosData.items.map((video: any) => ({
      id: video.id,
      title: video.snippet.title,
      duration: video.contentDetails.duration,
      url: `https://www.youtube.com/watch?v=${video.id}`,
    }));

    return {
      id: playlistId,
      title: playlistTitle,
      videos,
    };
  } catch (error) {
    console.error("Error fetching playlist info:", error);
    throw error;
  }
}

// Load YouTube IFrame API
export function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      resolve();
    };
  });
}

// YouTube IFrame API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}
