import { useState, useEffect, useCallback } from 'react';
import { ProgressData, Playlist, Video } from '@shared/schema';
import { loadProgressData, saveProgressData } from '@/lib/storage';

export function useProgressTracker() {
  const [progressData, setProgressData] = useState<ProgressData>(loadProgressData());
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Auto-save to localStorage
  useEffect(() => {
    if (autoSaveEnabled) {
      const timer = setTimeout(() => {
        saveProgressData(progressData);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [progressData, autoSaveEnabled]);

  // Add or update playlist
  const addPlaylist = useCallback((playlist: Playlist) => {
    setProgressData(prev => {
      const existingIndex = prev.playlists.findIndex(p => p.id === playlist.id);
      if (existingIndex >= 0) {
        const updated = [...prev.playlists];
        updated[existingIndex] = playlist;
        return { ...prev, playlists: updated };
      } else {
        return { ...prev, playlists: [...prev.playlists, playlist] };
      }
    });
  }, []);

  // Update video progress
  const updateVideoProgress = useCallback((
    playlistId: string,
    videoId: string,
    updates: Partial<Video>
  ) => {
    setProgressData(prev => {
      const playlistIndex = prev.playlists.findIndex(p => p.id === playlistId);
      if (playlistIndex === -1) return prev;

      const playlist = prev.playlists[playlistIndex];
      const videoIndex = playlist.videos.findIndex(v => v.id === videoId);
      if (videoIndex === -1) return prev;

      const updatedVideo = { ...playlist.videos[videoIndex], ...updates };
      const updatedVideos = [...playlist.videos];
      updatedVideos[videoIndex] = updatedVideo;

      const updatedPlaylist = { ...playlist, videos: updatedVideos };
      const updatedPlaylists = [...prev.playlists];
      updatedPlaylists[playlistIndex] = updatedPlaylist;

      return { ...prev, playlists: updatedPlaylists };
    });
  }, []);

  // Mark checkpoint (add watched segment)
  const markCheckpoint = useCallback((
    playlistId: string,
    videoId: string,
    currentTime: number
  ) => {
    setProgressData(prev => {
      const playlistIndex = prev.playlists.findIndex(p => p.id === playlistId);
      if (playlistIndex === -1) return prev;

      const playlist = prev.playlists[playlistIndex];
      const videoIndex = playlist.videos.findIndex(v => v.id === videoId);
      if (videoIndex === -1) return prev;

      const video = playlist.videos[videoIndex];
      const newSegment: [number, number] = [video.lastPosition, currentTime];
      
      // Merge overlapping segments
      const segments = [...video.watchedSegments, newSegment].sort((a, b) => a[0] - b[0]);
      const mergedSegments: [number, number][] = [];
      
      for (const segment of segments) {
        if (mergedSegments.length === 0) {
          mergedSegments.push(segment);
        } else {
          const last = mergedSegments[mergedSegments.length - 1];
          if (segment[0] <= last[1]) {
            last[1] = Math.max(last[1], segment[1]);
          } else {
            mergedSegments.push(segment);
          }
        }
      }

      const updatedVideo = {
        ...video,
        watchedSegments: mergedSegments,
        lastPosition: currentTime,
      };

      const updatedVideos = [...playlist.videos];
      updatedVideos[videoIndex] = updatedVideo;

      const updatedPlaylist = { ...playlist, videos: updatedVideos };
      const updatedPlaylists = [...prev.playlists];
      updatedPlaylists[playlistIndex] = updatedPlaylist;

      return { ...prev, playlists: updatedPlaylists };
    });
  }, []);

  // Get current playlist
  const getCurrentPlaylist = useCallback(() => {
    return progressData.playlists[currentPlaylistIndex] || null;
  }, [progressData.playlists, currentPlaylistIndex]);

  // Get current video
  const getCurrentVideo = useCallback(() => {
    const playlist = getCurrentPlaylist();
    if (!playlist) return null;
    return playlist.videos[playlist.currentVideoIndex] || null;
  }, [getCurrentPlaylist]);

  // Set current video
  const setCurrentVideo = useCallback((playlistId: string, videoIndex: number) => {
    setProgressData(prev => {
      const playlistIndex = prev.playlists.findIndex(p => p.id === playlistId);
      if (playlistIndex === -1) return prev;

      const updatedPlaylist = { ...prev.playlists[playlistIndex], currentVideoIndex: videoIndex };
      const updatedPlaylists = [...prev.playlists];
      updatedPlaylists[playlistIndex] = updatedPlaylist;

      return { ...prev, playlists: updatedPlaylists };
    });
  }, []);

  // Update settings
  const updateSettings = useCallback((settings: Partial<ProgressData['settings']>) => {
    setProgressData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings }
    }));
  }, []);

  return {
    progressData,
    setProgressData,
    currentPlaylistIndex,
    setCurrentPlaylistIndex,
    addPlaylist,
    updateVideoProgress,
    markCheckpoint,
    getCurrentPlaylist,
    getCurrentVideo,
    setCurrentVideo,
    updateSettings,
    autoSaveEnabled,
    setAutoSaveEnabled,
  };
}
