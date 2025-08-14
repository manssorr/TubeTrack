import { ProgressData, Playlist, Video } from '@shared/schema';

const STORAGE_KEY = 'youtube_learning_tracker';

// Default progress data
const defaultProgressData: ProgressData = {
  playlists: [],
  settings: {
    darkMode: false,
    autoSave: true,
    autoSaveInterval: 30000,
  },
};

// Load progress data from localStorage
export function loadProgressData(): ProgressData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultProgressData;
    
    const parsed = JSON.parse(stored);
    return { ...defaultProgressData, ...parsed };
  } catch (error) {
    console.error('Error loading progress data:', error);
    return defaultProgressData;
  }
}

// Save progress data to localStorage
export function saveProgressData(data: ProgressData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving progress data:', error);
  }
}

// Export progress data as JSON file
export function exportProgressData(): void {
  const data = loadProgressData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `youtube-learning-progress-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

// Import progress data from JSON file
export function importProgressData(file: File): Promise<ProgressData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') {
          throw new Error('Invalid file content');
        }
        
        const data = JSON.parse(result);
        // Validate the data structure here if needed
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON format'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Format time helpers
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatTimeRemaining(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  return `${hours.toFixed(1)}h`;
}
