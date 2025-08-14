import { useMemo } from 'react';
import { ProgressData, Video } from '@shared/schema';
import { LearningAnalytics } from '@/types';

export function useAnalytics(progressData: ProgressData): LearningAnalytics {
  return useMemo(() => {
    const allVideos = progressData.playlists.flatMap(p => p.videos);
    const totalVideos = allVideos.length;
    
    if (totalVideos === 0) {
      return {
        totalVideos: 0,
        completedVideos: 0,
        overallProgress: 0,
        learningRatio: 1,
        estimatedTimeRemaining: 0,
        totalTimeSpent: 0,
        effectiveWatchTime: 0,
        averageSessionLength: 0,
        learningStreak: 0,
        completionRate: 0,
      };
    }

    // Calculate completed videos
    const completedVideos = allVideos.filter(v => v.completed).length;

    // Calculate total content duration and watched duration
    const totalContentDuration = allVideos.reduce((sum, video) => sum + video.duration, 0);
    const totalWatchedDuration = allVideos.reduce((sum, video) => {
      return sum + video.watchedSegments.reduce((segSum, [start, end]) => segSum + (end - start), 0);
    }, 0);

    // Calculate overall progress
    const overallProgress = totalContentDuration > 0 ? (totalWatchedDuration / totalContentDuration) * 100 : 0;

    // Calculate total actual time spent
    const totalTimeSpent = allVideos.reduce((sum, video) => sum + video.actualTimeSpent, 0);

    // Calculate learning ratio
    const learningRatio = totalWatchedDuration > 0 ? totalTimeSpent / totalWatchedDuration : 1;

    // Calculate remaining content duration
    const remainingDuration = totalContentDuration - totalWatchedDuration;
    const estimatedTimeRemaining = learningRatio * remainingDuration / 3600; // in hours

    // Calculate effective watch time
    const effectiveWatchTime = totalWatchedDuration;

    // Calculate average session length (simplified - would need session tracking for accuracy)
    const sessionsEstimate = Math.max(1, Math.floor(totalTimeSpent / 1800)); // Assume 30-min sessions
    const averageSessionLength = totalTimeSpent / sessionsEstimate / 60; // in minutes

    // Calculate learning streak (simplified - would need date tracking)
    const learningStreak = progressData.playlists.length > 0 ? 1 : 0; // Placeholder

    // Calculate completion rate
    const completionRate = totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;

    return {
      totalVideos,
      completedVideos,
      overallProgress,
      learningRatio,
      estimatedTimeRemaining,
      totalTimeSpent,
      effectiveWatchTime,
      averageSessionLength,
      learningStreak,
      completionRate,
    };
  }, [progressData]);
}
