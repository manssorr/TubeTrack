import { useCallback, useEffect, useRef } from "react";
import { useProgress } from "./useLocalStorage";

interface UseProgressTrackerOptions {
  videoId: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  isReady: boolean;
}

interface UseProgressTrackerReturn {
  markComplete: () => void;
  resetProgress: () => void;
  getResumeTime: () => number;
}

const SAVE_INTERVAL_MS = 5000; // Save progress every 5 seconds
const COMPLETION_THRESHOLD = 0.9; // Mark complete at 90%

export function useProgressTracker({
  videoId,
  duration,
  currentTime,
  isPlaying,
  isReady,
}: UseProgressTrackerOptions): UseProgressTrackerReturn {
  const { updateProgress, getVideoProgress } = useProgress();

  const watchedSecondsRef = useRef(new Set<number>());
  const lastSaveTimeRef = useRef(0);
  const lastCurrentTimeRef = useRef(0);

  // Initialize watched seconds from existing progress
  useEffect(() => {
    if (videoId && isReady) {
      // Reset the watched seconds set for new video
      watchedSecondsRef.current = new Set();
      lastCurrentTimeRef.current = 0;
    }
  }, [videoId, isReady]);

  // Track watched seconds and save progress periodically
  useEffect(() => {
    if (!videoId || !isPlaying || !isReady || duration === 0) {
      return;
    }

    const trackingInterval = setInterval(() => {
      const now = Date.now();
      const currentSecond = Math.floor(currentTime);

      // Only count if time has advanced (avoiding double counting when paused/seeking)
      if (currentSecond !== Math.floor(lastCurrentTimeRef.current)) {
        watchedSecondsRef.current.add(currentSecond);
      }

      lastCurrentTimeRef.current = currentTime;

      // Save progress every 5 seconds
      if (now - lastSaveTimeRef.current >= SAVE_INTERVAL_MS) {
        saveCurrentProgress();
        lastSaveTimeRef.current = now;
      }
    }, 1000);

    return () => clearInterval(trackingInterval);
  }, [videoId, isPlaying, isReady, currentTime, duration]);

  // Save progress when video is paused/stopped
  useEffect(() => {
    if (!isPlaying && videoId && isReady && duration > 0) {
      saveCurrentProgress();
    }
  }, [isPlaying]);

  const saveCurrentProgress = useCallback(() => {
    if (!videoId || duration === 0) return;

    const existingProgress = getVideoProgress(videoId);
    const watchedCount = watchedSecondsRef.current.size;

    // Combine with existing watched seconds (for videos watched in multiple sessions)
    const totalWatchedSeconds = Math.max(watchedCount, existingProgress.watchedSeconds);
    const completion = Math.min(totalWatchedSeconds / duration, 1);

    const updatedProgress = {
      videoId,
      watchedSeconds: totalWatchedSeconds,
      lastPositionSeconds: currentTime,
      completion,
      lastWatchedAt: new Date().toISOString(),
    };

    updateProgress(videoId, updatedProgress);

    // Auto-mark complete if threshold is reached
    if (completion >= COMPLETION_THRESHOLD && existingProgress.completion < COMPLETION_THRESHOLD) {
      console.log(`Video ${videoId} marked as complete (${Math.round(completion * 100)}%)`);
    }
  }, [videoId, duration, currentTime, updateProgress, getVideoProgress]);

  const markComplete = useCallback(() => {
    if (!videoId || duration === 0) return;

    const updatedProgress = {
      videoId,
      watchedSeconds: duration,
      lastPositionSeconds: currentTime,
      completion: 1,
      lastWatchedAt: new Date().toISOString(),
    };

    updateProgress(videoId, updatedProgress);
  }, [videoId, duration, currentTime, updateProgress]);

  const resetProgress = useCallback(() => {
    if (!videoId) return;

    const resetProgress = {
      videoId,
      watchedSeconds: 0,
      lastPositionSeconds: 0,
      completion: 0,
      lastWatchedAt: new Date().toISOString(),
    };

    updateProgress(videoId, resetProgress);
    watchedSecondsRef.current.clear();
  }, [videoId, updateProgress]);

  const getResumeTime = useCallback(() => {
    if (!videoId) return 0;

    const progress = getVideoProgress(videoId);
    // Only resume if more than 30 seconds watched and less than 95% complete
    if (progress.lastPositionSeconds > 30 && progress.completion < 0.95) {
      return progress.lastPositionSeconds;
    }

    return 0;
  }, [videoId, getVideoProgress]);

  // Save progress on unmount
  useEffect(() => {
    return () => {
      if (videoId && duration > 0) {
        saveCurrentProgress();
      }
    };
  }, []);

  return {
    markComplete,
    resetProgress,
    getResumeTime,
  };
}
