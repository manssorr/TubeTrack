import { Playlist, Video, ProgressData } from '@shared/schema';

// Local database using IndexedDB for better performance and larger storage
export class LocalDB {
  private dbName = 'youtube_learning_tracker';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for playlists
        if (!db.objectStoreNames.contains('playlists')) {
          const playlistStore = db.createObjectStore('playlists', { keyPath: 'id' });
          playlistStore.createIndex('title', 'title', { unique: false });
          playlistStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        }

        // Store for cached video data
        if (!db.objectStoreNames.contains('videos')) {
          const videoStore = db.createObjectStore('videos', { keyPath: 'id' });
          videoStore.createIndex('playlistId', 'playlistId', { unique: false });
        }

        // Store for user settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Store for progress data
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'id' });
        }
      };
    });
  }

  async savePlaylist(playlist: Playlist): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const playlistWithMeta = {
      ...playlist,
      lastAccessed: new Date().toISOString(),
      createdAt: playlist.createdAt || new Date().toISOString(),
    };

    const transaction = this.db.transaction(['playlists', 'videos'], 'readwrite');
    
    // Save playlist metadata
    const playlistStore = transaction.objectStore('playlists');
    await this.promisifyRequest(playlistStore.put(playlistWithMeta));

    // Save videos separately for better querying
    const videoStore = transaction.objectStore('videos');
    for (const video of playlist.videos) {
      const videoWithPlaylistId = { ...video, playlistId: playlist.id };
      await this.promisifyRequest(videoStore.put(videoWithPlaylistId));
    }
  }

  async getPlaylist(id: string): Promise<Playlist | null> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['playlists', 'videos'], 'readonly');
    const playlistStore = transaction.objectStore('playlists');
    const videoStore = transaction.objectStore('videos');

    const playlist = await this.promisifyRequest(playlistStore.get(id));
    if (!playlist) return null;

    const videosIndex = videoStore.index('playlistId');
    const videos = await this.promisifyRequest(videosIndex.getAll(id));

    return { ...playlist, videos };
  }

  async getAllPlaylists(): Promise<Playlist[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['playlists', 'videos'], 'readonly');
    const playlistStore = transaction.objectStore('playlists');
    const videoStore = transaction.objectStore('videos');

    const playlists = await this.promisifyRequest(playlistStore.getAll());
    
    // Sort by last accessed
    playlists.sort((a, b) => new Date(b.lastAccessed || 0).getTime() - new Date(a.lastAccessed || 0).getTime());

    // Load videos for each playlist
    const playlistsWithVideos = await Promise.all(
      playlists.map(async (playlist) => {
        const videosIndex = videoStore.index('playlistId');
        const videos = await this.promisifyRequest(videosIndex.getAll(playlist.id));
        return { ...playlist, videos };
      })
    );

    return playlistsWithVideos;
  }

  async updatePlaylistAccess(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['playlists'], 'readwrite');
    const store = transaction.objectStore('playlists');
    
    const playlist = await this.promisifyRequest(store.get(id));
    if (playlist) {
      playlist.lastAccessed = new Date().toISOString();
      await this.promisifyRequest(store.put(playlist));
    }
  }

  async deletePlaylist(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['playlists', 'videos'], 'readwrite');
    const playlistStore = transaction.objectStore('playlists');
    const videoStore = transaction.objectStore('videos');

    await this.promisifyRequest(playlistStore.delete(id));

    // Delete all videos for this playlist
    const videosIndex = videoStore.index('playlistId');
    const videos = await this.promisifyRequest(videosIndex.getAll(id));
    for (const video of videos) {
      await this.promisifyRequest(videoStore.delete(video.id));
    }
  }

  async saveSettings(settings: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    
    await this.promisifyRequest(store.put({ key: 'user_settings', value: settings }));
  }

  async getSettings(): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    
    const result = await this.promisifyRequest(store.get('user_settings'));
    return result?.value || null;
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const localDB = new LocalDB();

// Initialize on module load
localDB.init().catch(console.error);