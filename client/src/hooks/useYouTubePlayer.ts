import { useEffect, useRef, useState, useCallback } from 'react';
import { loadYouTubeAPI } from '@/lib/youtube';

export interface UseYouTubePlayerOptions {
  videoId: string;
  onTimeUpdate?: (currentTime: number) => void;
  onStateChange?: (state: number) => void;
  autoplay?: boolean;
}

export function useYouTubePlayer({
  videoId,
  onTimeUpdate,
  onStateChange,
  autoplay = false,
}: UseYouTubePlayerOptions) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerState, setPlayerState] = useState(-1);
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout>();

  // Initialize YouTube player
  useEffect(() => {
    if (!containerRef.current || !videoId) return;

    const initPlayer = async () => {
      try {
        await loadYouTubeAPI();
        
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId,
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            controls: 1,
            rel: 0,
            modestbranding: 1,
          },
          events: {
            onReady: (event: any) => {
              setIsReady(true);
              setDuration(event.target.getDuration());
            },
            onStateChange: (event: any) => {
              setPlayerState(event.data);
              onStateChange?.(event.data);
              
              // Start/stop time updates based on player state
              if (event.data === window.YT.PlayerState.PLAYING) {
                startTimeUpdates();
              } else {
                stopTimeUpdates();
              }
            },
          },
        });
      } catch (error) {
        console.error('Error initializing YouTube player:', error);
      }
    };

    initPlayer();

    return () => {
      stopTimeUpdates();
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, autoplay, onStateChange]);

  // Start time updates
  const startTimeUpdates = useCallback(() => {
    if (timeUpdateIntervalRef.current) return;
    
    timeUpdateIntervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        onTimeUpdate?.(time);
      }
    }, 1000);
  }, [onTimeUpdate]);

  // Stop time updates
  const stopTimeUpdates = useCallback(() => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = undefined;
    }
  }, []);

  // Player control methods
  const play = useCallback(() => {
    if (playerRef.current && playerRef.current.playVideo) {
      playerRef.current.playVideo();
    }
  }, []);

  const pause = useCallback(() => {
    if (playerRef.current && playerRef.current.pauseVideo) {
      playerRef.current.pauseVideo();
    }
  }, []);

  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(seconds, true);
    }
  }, []);

  const getCurrentTime = useCallback(() => {
    if (playerRef.current && playerRef.current.getCurrentTime) {
      return playerRef.current.getCurrentTime();
    }
    return 0;
  }, []);

  const getDuration = useCallback(() => {
    if (playerRef.current && playerRef.current.getDuration) {
      return playerRef.current.getDuration();
    }
    return 0;
  }, []);

  return {
    containerRef,
    isReady,
    currentTime,
    duration,
    playerState,
    play,
    pause,
    seekTo,
    getCurrentTime,
    getDuration,
  };
}
