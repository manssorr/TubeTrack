import React, { useCallback, useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { PlaylistInput } from '@/components/PlaylistInput';
import { VideoList } from '@/components/VideoList';
import { VideoPlayer } from '@/components/VideoPlayer';
import { NotesPanel } from '@/components/NotesPanel';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { PlaylistManager } from '@/components/PlaylistManager';
import { HelpWiki } from '@/components/HelpWiki';
import { ThemeProvider } from '@/components/ThemeProvider';
import { useProgressTracker } from '@/hooks/useProgressTracker';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Playlist, UserSettings } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  // Local storage management for playlist caching
  const localStorage = useLocalStorage();
  
  const analytics = useAnalytics(progressData);
  const currentPlaylist = getCurrentPlaylist();
  const currentVideo = getCurrentVideo();
  
  // User settings with player mode
  const [userSettings, setUserSettings] = useState<UserSettings>({
    theme: 'light',
    videoPlayerMode: 'normal',
    autoSave: true
  });

  // Handle importing progress data
  const handleImport = useCallback((data: any) => {
    setProgressData(data);
  }, [setProgressData]);

  // Handle adding a new playlist
  const handlePlaylistAdd = useCallback((playlist: Playlist) => {
    addPlaylist(playlist);
    localStorage.savePlaylist(playlist); // Cache the playlist
    // Set as current playlist if it's the first one
    if (progressData.playlists.length === 0) {
      setCurrentPlaylistIndex(0);
    }
  }, [addPlaylist, progressData.playlists.length, setCurrentPlaylistIndex, localStorage]);

  // Handle playlist selection from manager
  const handlePlaylistSelect = useCallback((playlistId: string) => {
    const index = progressData.playlists.findIndex(p => p.id === playlistId);
    if (index >= 0) {
      setCurrentPlaylistIndex(index);
    }
  }, [progressData.playlists, setCurrentPlaylistIndex]);

  // Handle playlist deletion
  const handlePlaylistDelete = useCallback((playlistId: string) => {
    localStorage.deletePlaylist(playlistId);
    // Also remove from progressData
    setProgressData(prev => ({
      ...prev,
      playlists: prev.playlists.filter(p => p.id !== playlistId)
    }));
    
    // Reset current index if deleting current playlist
    if (currentPlaylist && currentPlaylist.id === playlistId) {
      setCurrentPlaylistIndex(0);
    }
  }, [localStorage, setProgressData, currentPlaylist, setCurrentPlaylistIndex]);

  // Handle toggling favorite status
  const handleToggleFavorite = useCallback((playlistId: string) => {
    const playlist = progressData.playlists.find(p => p.id === playlistId);
    if (playlist) {
      const updated = { ...playlist, isFavorite: !playlist.isFavorite };
      localStorage.updatePlaylist(playlistId, { isFavorite: updated.isFavorite });
      setProgressData(prev => ({
        ...prev,
        playlists: prev.playlists.map(p => p.id === playlistId ? updated : p)
      }));
    }
  }, [progressData.playlists, localStorage, setProgressData]);

  // Handle player mode change
  const handlePlayerModeChange = useCallback((mode: UserSettings['videoPlayerMode']) => {
    setUserSettings(prev => ({ ...prev, videoPlayerMode: mode }));
    localStorage.saveSettings({ ...userSettings, videoPlayerMode: mode });
  }, [userSettings, localStorage]);

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
        <AppHeader 
          onImport={handleImport} 
          helpTrigger={<HelpWiki />}
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Tabs defaultValue="playlists" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="playlists">My Playlists</TabsTrigger>
              <TabsTrigger value="learning">Learning</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            {/* Playlist Management Tab */}
            <TabsContent value="playlists" className="space-y-6">
              <PlaylistInput onPlaylistAdd={handlePlaylistAdd} />
              
              <PlaylistManager
                playlists={progressData.playlists}
                currentPlaylistId={currentPlaylist?.id || null}
                onPlaylistSelect={handlePlaylistSelect}
                onPlaylistDelete={handlePlaylistDelete}
                onToggleFavorite={handleToggleFavorite}
                isLoading={localStorage.isLoading}
              />
            </TabsContent>
            
            {/* Learning Tab */}
            <TabsContent value="learning">
              {currentPlaylist ? (
                <div className="space-y-6">
                  {/* Player Mode Indicator */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {currentPlaylist.title || 'Learning Session'}
                    </h2>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Player Mode: <span className="capitalize font-medium">{userSettings.videoPlayerMode}</span>
                    </div>
                  </div>
                  
                  {/* Adaptive Layout Based on Player Mode */}
                  {userSettings.videoPlayerMode === 'focus' || userSettings.videoPlayerMode === 'fullscreen' ? (
                    // Minimal layout for focus/fullscreen modes
                    <div className="space-y-6">
                      <VideoPlayer
                        video={currentVideo}
                        onProgressUpdate={handleProgressUpdate}
                        onMarkCheckpoint={handleMarkCheckpoint}
                        onInsertTimestamp={handleInsertTimestamp}
                        playerMode={userSettings.videoPlayerMode}
                        onModeChange={handlePlayerModeChange}
                      />
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <VideoList
                          playlist={currentPlaylist}
                          currentVideoIndex={currentPlaylist.currentVideoIndex}
                          onVideoSelect={handleVideoSelect}
                        />
                        <NotesPanel
                          video={currentVideo}
                          onNotesChange={handleNotesChange}
                          onInsertTimestamp={handleInsertTimestamp}
                          onJumpToTimestamp={handleJumpToTimestamp}
                          getCurrentTime={() => 0}
                        />
                      </div>
                    </div>
                  ) : (
                    // Standard layout for normal/theater modes
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Video List */}
                      <div className="lg:col-span-1">
                        <VideoList
                          playlist={currentPlaylist}
                          currentVideoIndex={currentPlaylist.currentVideoIndex}
                          onVideoSelect={handleVideoSelect}
                        />
                      </div>
                      
                      {/* Video Player */}
                      <div className={userSettings.videoPlayerMode === 'theater' ? 'lg:col-span-3' : 'lg:col-span-2'}>
                        <VideoPlayer
                          video={currentVideo}
                          onProgressUpdate={handleProgressUpdate}
                          onMarkCheckpoint={handleMarkCheckpoint}
                          onInsertTimestamp={handleInsertTimestamp}
                          playerMode={userSettings.videoPlayerMode}
                          onModeChange={handlePlayerModeChange}
                        />
                      </div>
                      
                      {/* Notes Panel - hidden in theater mode to give more space */}
                      {userSettings.videoPlayerMode !== 'theater' && (
                        <div className="lg:col-span-1">
                          <NotesPanel
                            video={currentVideo}
                            onNotesChange={handleNotesChange}
                            onInsertTimestamp={handleInsertTimestamp}
                            onJumpToTimestamp={handleJumpToTimestamp}
                            getCurrentTime={() => 0}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Notes Panel for Theater Mode (below player) */}
                  {userSettings.videoPlayerMode === 'theater' && (
                    <div className="max-w-4xl">
                      <NotesPanel
                        video={currentVideo}
                        onNotesChange={handleNotesChange}
                        onInsertTimestamp={handleInsertTimestamp}
                        onJumpToTimestamp={handleJumpToTimestamp}
                        getCurrentTime={() => 0}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-4">📚</div>
                    <h3 className="text-xl font-medium mb-2">No Playlist Selected</h3>
                    <p>Go to "My Playlists" tab to select a playlist or add a new one.</p>
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <AnalyticsDashboard analytics={analytics} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ThemeProvider>
  );
}
