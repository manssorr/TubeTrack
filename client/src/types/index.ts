export interface YouTubeVideo {
  id: string;
  title: string;
  duration: number; // in seconds
  url: string;
}

export interface YouTubePlaylist {
  id: string;
  title: string;
  videos: YouTubeVideo[];
}

export interface WatchedSegment {
  start: number;
  end: number;
}

export interface LearningAnalytics {
  totalVideos: number;
  completedVideos: number;
  overallProgress: number; // percentage
  learningRatio: number; // actual time / content time
  estimatedTimeRemaining: number; // in hours
  totalTimeSpent: number; // in seconds
  effectiveWatchTime: number; // in seconds
  averageSessionLength: number; // in minutes
  learningStreak: number; // days
  completionRate: number; // percentage
}

export interface TimestampNote {
  timestamp: number;
  text: string;
}
