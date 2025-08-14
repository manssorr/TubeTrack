import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Bookmark, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { VideoPlayerModes } from './VideoPlayerModes';
import { Video, UserSettings } from '@shared/schema';
import { formatDuration } from '@/lib/storage';
import { extractVideoId } from '@/lib/youtube';

interface VideoPlayerProps {
  video: Video | null;
  onProgressUpdate: (currentTime: number, actualTimeSpent: number) => void;
  onMarkCheckpoint: (currentTime: number) => void;
  onInsertTimestamp: (timestamp: string) => void;
  playerMode?: UserSettings['videoPlayerMode'];
  onModeChange?: (mode: UserSettings['videoPlayerMode']) => void;
  onExposeControls?: (controls: {
    seekTo: (seconds: number) => void;
    getCurrentTime: () => number;
    play: () => void;
    pause: () => void;
  }) => void;
}

export function VideoPlayer({ 
  video, 
  onProgressUpdate, 
  onMarkCheckpoint,
  onInsertTimestamp,
  playerMode = 'normal',
  onModeChange,
  onExposeControls
}: VideoPlayerProps) {
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const videoId = video ? extractVideoId(video.url) : null;

  const handleTimeUpdate = useCallback((currentTime: number) => {
    if (video && isPlaying) {
      const now = Date.now();
      const sessionTime = Math.floor((now - sessionStartTime) / 1000);
      setTotalSessionTime(sessionTime);
      onProgressUpdate(currentTime, video.actualTimeSpent + sessionTime);
    }
  }, [video, isPlaying, sessionStartTime, onProgressUpdate]);

  const handleStateChange = useCallback((state: number) => {
    const YT = window.YT;
    if (YT) {
      setIsPlaying(state === YT.PlayerState.PLAYING);
      
      if (state === YT.PlayerState.PLAYING) {
        setSessionStartTime(Date.now());
      }
    }
  }, []);

  const {
    containerRef,
    isReady,
    currentTime,
    duration,
    playerState,
    play,
    pause,
    seekTo,
    getCurrentTime,
  } = useYouTubePlayer({
    videoId: videoId || '',
    onTimeUpdate: handleTimeUpdate,
    onStateChange: handleStateChange,
  });

  // Expose controls to parent (Home) so other panels can seek/inspect time
  useEffect(() => {
    if (onExposeControls) {
      onExposeControls({ seekTo, getCurrentTime, play, pause });
    }
  }, [onExposeControls, seekTo, getCurrentTime, play, pause]);

  // Seek to last position when video loads
  useEffect(() => {
    if (isReady && video && video.lastPosition > 0) {
      seekTo(video.lastPosition);
    }
  }, [isReady, video, seekTo]);

  // Handle fullscreen mode
  const toggleFullscreen = useCallback(async () => {
    if (!playerContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await playerContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
        onModeChange?.('fullscreen');
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        onModeChange?.('normal');
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, [onModeChange]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      if (!isCurrentlyFullscreen && playerMode === 'fullscreen') {
        onModeChange?.('normal');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [playerMode, onModeChange]);

  // Enhanced keyboard shortcuts (scoped and input-safe)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const active = document.activeElement as HTMLElement | null;
      const isEditable = (el: HTMLElement | null) => {
        if (!el) return false;
        return (
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          el.isContentEditable ||
          el.getAttribute('role') === 'textbox'
        );
      };

      // Ignore when typing anywhere editable
      if (isEditable(target) || isEditable(active)) return;

      // Only react if event occurs within the player container (except Ctrl+T)
      const path = (e.composedPath && e.composedPath()) || [];
      const insidePlayer = playerContainerRef.current ? path.includes(playerContainerRef.current) : true;

      // Allow Ctrl+T globally for timestamp insertion
      const isTimestampCombo = e.ctrlKey && e.key.toLowerCase() === 't';
      if (!insidePlayer && !isTimestampCombo) return;

      // Skip unrelated modifier combos
      const hasModifiers = e.altKey || e.metaKey;
      if (hasModifiers && !isTimestampCombo) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (isPlaying) {
            pause();
          } else {
            play();
          }
          break;
        case 'Enter':
          if (video) {
            e.preventDefault();
            onMarkCheckpoint(getCurrentTime());
          }
          break;
        case 'KeyF':
          if (e.ctrlKey) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
        case 'Escape':
          if (isFullscreen) {
            e.preventDefault();
            document.exitFullscreen();
          }
          break;
        default:
          break;
      }

      if (isTimestampCombo) {
        e.preventDefault();
        const time = getCurrentTime();
        const timestamp = formatDuration(time);
        onInsertTimestamp(`[${timestamp}] `);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, play, pause, video, getCurrentTime, onMarkCheckpoint, onInsertTimestamp, toggleFullscreen, isFullscreen]);

  if (!video) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          Select a video to start learning
        </CardContent>
      </Card>
    );
  }

  const getVideoProgress = () => {
    if (video.duration === 0) return 0;
    const watchedTime = video.watchedSegments.reduce((sum, [start, end]) => sum + (end - start), 0);
    return (watchedTime / video.duration) * 100;
  };

  const renderProgressSegments = () => {
    if (!video || video.duration === 0) return null;

    return (
      <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
        {/* Watched segments */}
        {video.watchedSegments.map(([start, end], index) => {
          const startPercent = (start / video.duration) * 100;
          const widthPercent = ((end - start) / video.duration) * 100;
          
          return (
            <div
              key={index}
              className="absolute h-full bg-green-500"
              style={{
                left: `${startPercent}%`,
                width: `${widthPercent}%`,
              }}
            />
          );
        })}
        
        {/* Current position indicator */}
        {currentTime > 0 && (
          <div
            className="absolute w-1 h-full bg-primary rounded-full"
            style={{
              left: `${(currentTime / video.duration) * 100}%`,
            }}
          />
        )}
      </div>
    );
  };

  // Get container classes based on player mode
  const getContainerClasses = () => {
    switch (playerMode) {
      case 'theater':
        return 'w-full max-w-none'; // Takes full width of container
      case 'focus':
        return 'w-full max-w-4xl mx-auto'; // Centered with max width
      case 'fullscreen':
        return 'fixed inset-0 z-50 bg-black'; // Full viewport
      default:
        return ''; // Normal card styling
    }
  };

  const shouldShowCard = playerMode === 'normal';
  const shouldShowMinimalUI = playerMode === 'focus' || playerMode === 'fullscreen';

  const playerContent = (
    <div className={`relative ${getContainerClasses()}`} ref={playerContainerRef}>
      {/* YouTube Player */}
      <div className={`relative ${
        playerMode === 'fullscreen' ? 'h-screen' : 
        playerMode === 'theater' ? 'aspect-video w-full' :
        'aspect-video'
      } bg-gray-900 ${shouldShowCard ? 'rounded-t-lg' : ''} overflow-hidden`}>
        <div ref={containerRef} className="w-full h-full" />
        
        {/* Top Controls Bar (for theater/fullscreen modes) */}
        {(playerMode === 'theater' || playerMode === 'fullscreen') && (
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium text-lg truncate mr-4">
                {video.title}
              </h3>
              <div className="flex items-center space-x-2">
                {onModeChange && (
                  <VideoPlayerModes 
                    currentMode={playerMode} 
                    onModeChange={onModeChange}
                  />
                )}
                {playerMode === 'fullscreen' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => document.exitFullscreen()}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
        
        
      </div>
      
      {/* Additional info panel for normal mode */}
      {shouldShowCard && (
        <div className="p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            {video.title}
          </h3>
          
          {/* Detailed Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Progress</span>
              <span>{Math.round(getVideoProgress())}% watched</span>
            </div>
            {renderProgressSegments()}
          </div>

          {/* Keyboard Shortcuts */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Shortcuts:</p>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>
                <kbd className="bg-gray-200 dark:bg-gray-600 px-1 rounded">Space</kbd> Play/Pause
              </span>
              <span>
                <kbd className="bg-gray-200 dark:bg-gray-600 px-1 rounded">Enter</kbd> Mark Progress
              </span>
              <span>
                <kbd className="bg-gray-200 dark:bg-gray-600 px-1 rounded">Ctrl+T</kbd> Insert Timestamp
              </span>
              <span>
                <kbd className="bg-gray-200 dark:bg-gray-600 px-1 rounded">Ctrl+F</kbd> Fullscreen
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (shouldShowCard) {
    return (
      <Card>
        <CardContent className="p-0">
          {playerContent}
        </CardContent>
      </Card>
    );
  }

  return playerContent;
}
