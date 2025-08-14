import React, { useCallback, useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { PlaylistInput } from '@/components/PlaylistInput';
import { VideoList } from '@/components/VideoList';
import { VideoPlayer } from '@/components/VideoPlayer';
import { MarkdownNotesPanel } from '@/components/MarkdownNotesPanel';
import { CollapsibleVideoList } from '@/components/CollapsibleVideoList';
import { VideoControlPanel } from '@/components/VideoControlPanel';
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
    darkMode: false,
    videoPlayerMode: 'normal',
    autoSave: true,
    autoSaveInterval: 30000,
    showKeyboardShortcuts: true,
    autoMarkCompleted: false
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
    setCurrentVideoTime(currentTime); // Update current time state
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

  // Current time ref to share between video player and notes
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [videoPlayerRef, setVideoPlayerRef] = useState<any>(null);
  const [isVideoListCollapsed, setIsVideoListCollapsed] = useState(false);

  // Handle timestamp insertion (for keyboard shortcut)
  const handleInsertTimestamp = useCallback((timestamp: string) => {
    console.log('Insert timestamp:', timestamp);
  }, []);

  // Handle jumping to timestamp
  const handleJumpToTimestamp = useCallback((seconds: number) => {
    console.log('Jump to timestamp:', seconds);
    // This will be handled by the VideoPlayer component through the YouTube API
  }, []);

  // Get current video time
  const getCurrentVideoTime = useCallback(() => {
    return currentVideoTime;
  }, [currentVideoTime]);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AppHeader 
          onImport={handleImport} 
          helpTrigger={<HelpWiki />}
        />
        
        <div className={`${
          userSettings.videoPlayerMode === 'theater' 
            ? 'max-w-full mx-auto px-2 sm:px-4 lg:px-6' 
            : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
        } py-6`}>
          <Tabs defaultValue="playlists" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700">
              <TabsTrigger value="playlists" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-white dark:text-gray-300">My Playlists</TabsTrigger>
              <TabsTrigger value="learning" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-white dark:text-gray-300">Learning</TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-white dark:text-gray-300">Analytics</TabsTrigger>
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
                        <MarkdownNotesPanel
                          video={currentVideo}
                          onNotesChange={handleNotesChange}
                          onInsertTimestamp={handleInsertTimestamp}
                          onJumpToTimestamp={handleJumpToTimestamp}
                          getCurrentTime={getCurrentVideoTime}
                        />
                      </div>
                    </div>
                  ) : userSettings.videoPlayerMode === 'theater' ? (
                    // Theater Mode - Full Width Layout
                    <div className="space-y-6">
                      {/* Full width video player */}
                      <div className="w-full">
                        <VideoPlayer
                          video={currentVideo}
                          onProgressUpdate={handleProgressUpdate}
                          onMarkCheckpoint={handleMarkCheckpoint}
                          onInsertTimestamp={handleInsertTimestamp}
                          playerMode={userSettings.videoPlayerMode}
                          onModeChange={handlePlayerModeChange}
                        />
                      </div>
                      
                      {/* Control panel below video */}
                      <VideoControlPanel
                        video={currentVideo}
                        onMarkCheckpoint={handleMarkCheckpoint}
                        onInsertTimestamp={handleInsertTimestamp}
                        getCurrentTime={getCurrentVideoTime}
                      />
                      
                      {/* Side-by-side layout for video list and notes */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                          <CollapsibleVideoList
                            playlist={currentPlaylist}
                            currentVideoIndex={currentPlaylist.currentVideoIndex}
                            onVideoSelect={handleVideoSelect}
                            isCollapsed={false}
                            onToggleCollapse={setIsVideoListCollapsed}
                          />
                        </div>
                        <div className="lg:col-span-2">
                          <MarkdownNotesPanel
                            video={currentVideo}
                            onNotesChange={handleNotesChange}
                            onInsertTimestamp={handleInsertTimestamp}
                            onJumpToTimestamp={handleJumpToTimestamp}
                            getCurrentTime={getCurrentVideoTime}
                            isFullWidth={true}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Standard layout for normal mode
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Collapsible Video List */}
                      <div className={isVideoListCollapsed ? "w-auto" : "lg:col-span-1"}>
                        <CollapsibleVideoList
                          playlist={currentPlaylist}
                          currentVideoIndex={currentPlaylist.currentVideoIndex}
                          onVideoSelect={handleVideoSelect}
                          isCollapsed={isVideoListCollapsed}
                          onToggleCollapse={setIsVideoListCollapsed}
                        />
                      </div>
                      
                      {/* Video Player */}
                      <div className={`${
                        isVideoListCollapsed ? 'lg:col-span-3' : 'lg:col-span-2'
                      } space-y-4`}>
                        <VideoPlayer
                          video={currentVideo}
                          onProgressUpdate={handleProgressUpdate}
                          onMarkCheckpoint={handleMarkCheckpoint}
                          onInsertTimestamp={handleInsertTimestamp}
                          playerMode={userSettings.videoPlayerMode}
                          onModeChange={handlePlayerModeChange}
                        />
                        
                        {/* Video Control Panel - separate from player */}
                        <VideoControlPanel
                          video={currentVideo}
                          onMarkCheckpoint={handleMarkCheckpoint}
                          onInsertTimestamp={handleInsertTimestamp}
                          getCurrentTime={getCurrentVideoTime}
                        />
                      </div>
                      
                      {/* Notes Panel */}
                      {!isVideoListCollapsed && (
                        <div className="lg:col-span-1">
                          <MarkdownNotesPanel
                            video={currentVideo}
                            onNotesChange={handleNotesChange}
                            onInsertTimestamp={handleInsertTimestamp}
                            onJumpToTimestamp={handleJumpToTimestamp}
                            getCurrentTime={getCurrentVideoTime}
                          />
                        </div>
                      )}
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
