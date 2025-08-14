import { useState, useEffect, useCallback } from 'react';
import { ProgressData, Playlist, UserSettings } from '@shared/schema';
import { localDB } from '@/lib/localDb';
import { loadProgressData, saveProgressData } from '@/lib/storage';

export function useLocalStorage() {
  const [progressData, setProgressData] = useState<ProgressData>(loadProgressData());
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null);

  // Initialize local database and load playlists
  useEffect(() => {
    const initializeDB = async () => {
      try {
        await localDB.init();
        const savedPlaylists = await localDB.getAllPlaylists();
        setPlaylists(savedPlaylists);
        
        // Load settings from IndexedDB
        const settings = await localDB.getSettings();
        if (settings) {
          setProgressData(prev => ({ ...prev, settings }));
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize local database:', error);
        setIsLoading(false);
      }
    };

    initializeDB();
  }, []);

  // Save playlist to both localStorage and IndexedDB
  const savePlaylist = useCallback(async (playlist: Playlist) => {
    try {
      // Save to IndexedDB for caching and offline access
      await localDB.savePlaylist(playlist);
      
      // Update local state
      setPlaylists(prev => {
        const existingIndex = prev.findIndex(p => p.id === playlist.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = playlist;
          return updated;
        }
        return [playlist, ...prev];
      });

      // Also update the progress data for localStorage sync
      setProgressData(prev => {
        const existingIndex = prev.playlists.findIndex(p => p.id === playlist.id);
        if (existingIndex >= 0) {
          const updated = [...prev.playlists];
          updated[existingIndex] = playlist;
          return { ...prev, playlists: updated };
        }
        return { ...prev, playlists: [playlist, ...prev.playlists] };
      });

      return true;
    } catch (error) {
      console.error('Failed to save playlist:', error);
      return false;
    }
  }, []);

  // Load playlist from cache
  const loadPlaylist = useCallback(async (id: string): Promise<Playlist | null> => {
    try {
      const playlist = await localDB.getPlaylist(id);
      if (playlist) {
        await localDB.updatePlaylistAccess(id);
        // Refresh the playlists list to update last accessed
        const updatedPlaylists = await localDB.getAllPlaylists();
        setPlaylists(updatedPlaylists);
      }
      return playlist;
    } catch (error) {
      console.error('Failed to load playlist:', error);
      return null;
    }
  }, []);

  // Delete playlist
  const deletePlaylist = useCallback(async (id: string) => {
    try {
      await localDB.deletePlaylist(id);
      setPlaylists(prev => prev.filter(p => p.id !== id));
      
      // Also remove from progress data
      setProgressData(prev => ({
        ...prev,
        playlists: prev.playlists.filter(p => p.id !== id)
      }));

      if (currentPlaylistId === id) {
        setCurrentPlaylistId(null);
      }

      return true;
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      return false;
    }
  }, [currentPlaylistId]);

  // Update playlist (for progress changes, etc.)
  const updatePlaylist = useCallback(async (id: string, updates: Partial<Playlist>) => {
    try {
      const existing = await localDB.getPlaylist(id);
      if (!existing) return false;

      const updated = { ...existing, ...updates };
      await localDB.savePlaylist(updated);

      // Update local state
      setPlaylists(prev => prev.map(p => p.id === id ? updated : p));
      setProgressData(prev => ({
        ...prev,
        playlists: prev.playlists.map(p => p.id === id ? updated : p)
      }));

      return true;
    } catch (error) {
      console.error('Failed to update playlist:', error);
      return false;
    }
  }, []);

  // Save settings
  const saveSettings = useCallback(async (settings: UserSettings) => {
    try {
      await localDB.saveSettings(settings);
      setProgressData(prev => ({ ...prev, settings }));
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }, []);

  // Auto-save progress data to localStorage (for backup)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveProgressData(progressData);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [progressData]);

  // Get current playlist
  const getCurrentPlaylist = useCallback(() => {
    if (!currentPlaylistId) return null;
    return playlists.find(p => p.id === currentPlaylistId) || null;
  }, [currentPlaylistId, playlists]);

  return {
    // Data
    progressData,
    setProgressData,
    playlists,
    isLoading,
    
    // Current playlist
    currentPlaylistId,
    setCurrentPlaylistId,
    getCurrentPlaylist,
    
    // Operations
    savePlaylist,
    loadPlaylist,
    deletePlaylist,
    updatePlaylist,
    saveSettings,
  };
}