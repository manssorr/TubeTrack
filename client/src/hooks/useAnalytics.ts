import { useMemo } from "react";
import { useVideos, usePlaylists, useNotes, useLocalStorage } from "./useLocalStorage";

export interface LearningMetrics {
  // Time-based metrics
  totalWatchedHours: number;
  totalWatchedMinutes: number;
  avgSessionDuration: number;
  totalVideosWatched: number;

  // Progress metrics
  overallCompletionRate: number;
  completedVideos: number;
  inProgressVideos: number;
  notStartedVideos: number;

  // Playlist metrics
  totalPlaylists: number;
  activePlaylists: number;
  completedPlaylists: number;

  // Streak and consistency
  currentStreak: number;
  longestStreak: number;
  daysActive: number;

  // Notes and engagement
  totalNotes: number;
  notesPerVideo: number;
  mostUsedTags: Array<{ tag: string; count: number }>;

  // Learning patterns
  preferredPlaybackRate: number;
  mostActiveHour: number;
  mostActiveDay: string;
  learningVelocity: number; // videos per day
}

export interface PlaylistAnalytics {
  id: string;
  title: string;
  totalVideos: number;
  completedVideos: number;
  completionRate: number;
  totalDuration: number;
  watchedDuration: number;
  estimatedTimeToComplete: number;
  notesCount: number;
  lastWatchedDate?: string;
  progressTrend: "up" | "down" | "stable";
}

export interface DailyActivity {
  date: string;
  watchTime: number; // in minutes
  videosWatched: number;
  notesCreated: number;
  completions: number;
}

export interface LearningPattern {
  hourlyDistribution: Array<{ hour: number; minutes: number }>;
  weeklyDistribution: Array<{ day: string; minutes: number }>;
  monthlyProgress: Array<{ month: string; completions: number }>;
  tagFrequency: Array<{ tag: string; count: number }>;
}

export function useAnalytics() {
  const { videos } = useVideos();
  const { state } = useLocalStorage();
  const { playlists } = usePlaylists();
  const { getNotesByVideo } = useNotes();

  const analytics = useMemo(() => {
    const videoList = Object.values(videos);
    const progressData = state.progress;
    const playlistList = Object.values(playlists);

    // Calculate total watched time and progress
    let totalWatchedSeconds = 0;
    let completedVideos = 0;
    let inProgressVideos = 0;
    let notStartedVideos = 0;
    let totalNotes = 0;
    let allTags: string[] = [];

    // Track dates for streak calculation
    const activeDates = new Set<string>();

    videoList.forEach(video => {
      const progress = progressData[video.id];
      if (progress) {
        totalWatchedSeconds += progress.watchedSeconds;

        if (progress.completion >= 0.9) {
          completedVideos++;
        } else if (progress.watchedSeconds > 30) {
          inProgressVideos++;
        } else {
          notStartedVideos++;
        }

        // Add active date
        if (progress.lastWatchedAt) {
          const date = new Date(progress.lastWatchedAt).toDateString();
          activeDates.add(date);
        }
      } else {
        notStartedVideos++;
      }

      // Count notes for this video
      const videoNotes = getNotesByVideo(video.id);
      totalNotes += videoNotes.length;

      // Collect tags
      videoNotes.forEach(note => {
        allTags.push(...note.tags);
      });
    });

    // Calculate streaks
    const sortedDates = Array.from(activeDates)
      .map(date => new Date(date))
      .sort((a, b) => b.getTime() - a.getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;

    for (let i = 0; i < sortedDates.length; i++) {
      const date = sortedDates[i];
      if (!date) continue;

      const daysDiff = Math.floor((today.getTime() - date.getTime()) / oneDayMs);

      if (i === 0 && (daysDiff === 0 || daysDiff === 1)) {
        currentStreak = 1;
        tempStreak = 1;
      } else if (i > 0) {
        const prevDate = sortedDates[i - 1];
        if (!prevDate) continue;

        const dateDiff = Math.floor((prevDate.getTime() - date.getTime()) / oneDayMs);

        if (dateDiff === 1) {
          tempStreak++;
          if (i === 1) currentStreak = tempStreak;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    // Calculate tag frequency
    const tagFrequency = allTags.reduce(
      (acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const mostUsedTags = Object.entries(tagFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Calculate playlist metrics
    // @ts-ignore - Type compatibility issue with optional fields
    const playlistMetrics: PlaylistAnalytics[] = playlistList.map(playlist => {
      const playlistVideos = videoList.filter(v => v.playlistId === playlist.id);
      const completedInPlaylist = playlistVideos.filter(v => {
        const progress = progressData[v.id];
        return progress && progress.completion >= 0.9;
      }).length;

      const totalDuration = playlistVideos.reduce((sum, v) => sum + v.durationSec, 0);
      const watchedDuration = playlistVideos.reduce((sum, v) => {
        const progress = progressData[v.id];
        return sum + (progress ? progress.watchedSeconds : 0);
      }, 0);

      const completionRate =
        playlistVideos.length > 0 ? completedInPlaylist / playlistVideos.length : 0;

      // Estimate time to complete (assuming 1.25x average speed)
      const remainingDuration = totalDuration - watchedDuration;
      const estimatedTimeToComplete = remainingDuration / 1.25;

      const playlistNotes = playlistVideos.reduce((sum, v) => {
        return sum + getNotesByVideo(v.id).length;
      }, 0);

      // Find last watched date
      const lastWatched = playlistVideos
        .map(v => progressData[v.id]?.lastWatchedAt)
        .filter(Boolean)
        .sort()
        .pop();

      return {
        id: playlist.id,
        title: playlist.title,
        totalVideos: playlistVideos.length,
        completedVideos: completedInPlaylist,
        completionRate,
        totalDuration,
        watchedDuration,
        estimatedTimeToComplete,
        notesCount: playlistNotes,
        lastWatchedDate: lastWatched,
        progressTrend: "stable" as const, // TODO: Calculate based on recent activity
      };
    });

    // Calculate overall metrics
    const totalWatchedHours = totalWatchedSeconds / 3600;
    const totalWatchedMinutes = totalWatchedSeconds / 60;
    const overallCompletionRate = videoList.length > 0 ? completedVideos / videoList.length : 0;

    const activePlaylists = playlistMetrics.filter(
      p => p.completionRate > 0 && p.completionRate < 1
    ).length;
    const completedPlaylists = playlistMetrics.filter(p => p.completionRate >= 1).length;

    const notesPerVideo = videoList.length > 0 ? totalNotes / videoList.length : 0;

    // Calculate learning velocity (videos completed per day)
    const daysActive = activeDates.size;
    const learningVelocity = daysActive > 0 ? completedVideos / daysActive : 0;

    const metrics: LearningMetrics = {
      totalWatchedHours,
      totalWatchedMinutes,
      avgSessionDuration: totalWatchedMinutes / Math.max(daysActive, 1),
      totalVideosWatched: completedVideos + inProgressVideos,

      overallCompletionRate,
      completedVideos,
      inProgressVideos,
      notStartedVideos,

      totalPlaylists: playlistList.length,
      activePlaylists,
      completedPlaylists,

      currentStreak,
      longestStreak,
      daysActive,

      totalNotes,
      notesPerVideo,
      mostUsedTags,

      preferredPlaybackRate: 1, // TODO: Calculate from usage data
      mostActiveHour: 14, // TODO: Calculate from timestamps
      mostActiveDay: "Monday", // TODO: Calculate from timestamps
      learningVelocity,
    };

    return {
      metrics,
      playlistAnalytics: playlistMetrics,
    };
  }, [videos, playlists, getNotesByVideo]);

  // Generate daily activity data for charts
  const dailyActivity = useMemo((): DailyActivity[] => {
    const progressData = state.progress;
    const videoList = Object.values(videos);
    const activityMap = new Map<string, DailyActivity>();

    // Initialize last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      // @ts-ignore - dateStr is always defined from toISOString
      activityMap.set(dateStr, {
        date: dateStr,
        watchTime: 0,
        videosWatched: 0,
        notesCreated: 0,
        completions: 0,
      });
    }

    // Populate with actual data
    videoList.forEach(video => {
      const progress = progressData[video.id];
      if (progress && progress.lastWatchedAt) {
        const date = new Date(progress.lastWatchedAt).toISOString().split("T")[0];
        if (!date) return;

        const activity = activityMap.get(date);

        if (activity) {
          activity.watchTime += progress.watchedSeconds / 60; // convert to minutes
          activity.videosWatched += 1;
          if (progress.completion >= 0.9) {
            activity.completions += 1;
          }

          // Add notes count (approximation)
          const videoNotes = getNotesByVideo(video.id);
          activity.notesCreated += videoNotes.length;
        }
      }
    });

    return Array.from(activityMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [videos, state.progress, getNotesByVideo]);

  // Generate learning patterns
  const learningPatterns = useMemo((): LearningPattern => {
    const progressData = state.progress;
    const videoList = Object.values(videos);

    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({ hour, minutes: 0 }));
    const weeklyDistribution = [
      { day: "Monday", minutes: 0 },
      { day: "Tuesday", minutes: 0 },
      { day: "Wednesday", minutes: 0 },
      { day: "Thursday", minutes: 0 },
      { day: "Friday", minutes: 0 },
      { day: "Saturday", minutes: 0 },
      { day: "Sunday", minutes: 0 },
    ];

    // Analyze activity patterns (simplified - would need more detailed timestamps)
    videoList.forEach(video => {
      const progress = progressData[video.id];
      if (progress && progress.lastWatchedAt) {
        const date = new Date(progress.lastWatchedAt);
        const hour = date.getHours();
        const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });

        const watchMinutes = progress.watchedSeconds / 60;
        if (hourlyDistribution[hour]) {
          hourlyDistribution[hour].minutes += watchMinutes;
        }

        const weekdayEntry = weeklyDistribution.find(d => d.day === dayOfWeek);
        if (weekdayEntry) {
          weekdayEntry.minutes += watchMinutes;
        }
      }
    });

    return {
      hourlyDistribution,
      weeklyDistribution,
      monthlyProgress: [], // TODO: Implement monthly tracking
      tagFrequency: analytics.metrics.mostUsedTags,
    };
  }, [videos, state.progress, analytics.metrics.mostUsedTags]);

  return {
    ...analytics,
    dailyActivity,
    learningPatterns,
    isLoading: false,
    error: null,
  };
}
