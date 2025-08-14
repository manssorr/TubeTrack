import React, { useCallback } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { PlaylistInput } from '@/components/PlaylistInput';
import { VideoList } from '@/components/VideoList';
import { VideoPlayer } from '@/components/VideoPlayer';
import { NotesPanel } from '@/components/NotesPanel';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { ThemeProvider } from '@/components/ThemeProvider';
import { useProgressTracker } from '@/hooks/useProgressTracker';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Playlist } from '@shared/schema';

export default function Home() {
  const {
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
  } = useProgressTracker();

  const analytics = useAnalytics(progressData);
  const currentPlaylist = getCurrentPlaylist();
  const currentVideo = getCurrentVideo();

  // Handle importing progress data
  const handleImport = useCallback((data: any) => {
    setProgressData(data);
  }, [setProgressData]);

  // Handle adding a new playlist
  const handlePlaylistAdd = useCallback((playlist: Playlist) => {
    addPlaylist(playlist);
    // Set as current playlist if it's the first one
    if (progressData.playlists.length === 0) {
      setCurrentPlaylistIndex(0);
    }
  }, [addPlaylist, progressData.playlists.length, setCurrentPlaylistIndex]);

  // Handle video selection
  const handleVideoSelect = useCallback((videoIndex: number) => {
    if (currentPlaylist) {
      setCurrentVideo(currentPlaylist.id, videoIndex);
    }
  }, [currentPlaylist, setCurrentVideo]);

  // Handle progress updates
  const handleProgressUpdate = useCallback((currentTime: number, actualTimeSpent: number) => {
    if (currentPlaylist && currentVideo) {
      updateVideoProgress(currentPlaylist.id, currentVideo.id, {
        lastPosition: currentTime,
        actualTimeSpent,
      });
    }
  }, [currentPlaylist, currentVideo, updateVideoProgress]);

  // Handle checkpoint marking
  const handleMarkCheckpoint = useCallback((currentTime: number) => {
    if (currentPlaylist && currentVideo) {
      markCheckpoint(currentPlaylist.id, currentVideo.id, currentTime);
    }
  }, [currentPlaylist, currentVideo, markCheckpoint]);

  // Handle notes changes
  const handleNotesChange = useCallback((notes: string) => {
    if (currentPlaylist && currentVideo) {
      updateVideoProgress(currentPlaylist.id, currentVideo.id, { notes });
    }
  }, [currentPlaylist, currentVideo, updateVideoProgress]);

  // Handle timestamp insertion (for keyboard shortcut)
  const handleInsertTimestamp = useCallback((timestamp: string) => {
    // This will be handled by NotesPanel component
    console.log('Insert timestamp:', timestamp);
  }, []);

  // Handle jumping to timestamp
  const handleJumpToTimestamp = useCallback((seconds: number) => {
    // This will be handled by VideoPlayer component
    console.log('Jump to timestamp:', seconds);
  }, []);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AppHeader onImport={handleImport} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Playlist Input */}
          <div className="mb-6">
            <PlaylistInput onPlaylistAdd={handlePlaylistAdd} />
          </div>
          
          {/* Main Interface */}
          {currentPlaylist && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              {/* Video List */}
              <div className="lg:col-span-1">
                <VideoList
                  playlist={currentPlaylist}
                  currentVideoIndex={currentPlaylist.currentVideoIndex}
                  onVideoSelect={handleVideoSelect}
                />
              </div>
              
              {/* Video Player */}
              <div className="lg:col-span-2">
                <VideoPlayer
                  video={currentVideo}
                  onProgressUpdate={handleProgressUpdate}
                  onMarkCheckpoint={handleMarkCheckpoint}
                  onInsertTimestamp={handleInsertTimestamp}
                />
              </div>
              
              {/* Notes Panel */}
              <div className="lg:col-span-1">
                <NotesPanel
                  video={currentVideo}
                  onNotesChange={handleNotesChange}
                  onInsertTimestamp={handleInsertTimestamp}
                  onJumpToTimestamp={handleJumpToTimestamp}
                  getCurrentTime={() => 0} // Will be passed from VideoPlayer
                />
              </div>
            </div>
          )}
          
          {/* Analytics Dashboard */}
          <AnalyticsDashboard analytics={analytics} />
        </div>
      </div>
    </ThemeProvider>
  );
}
