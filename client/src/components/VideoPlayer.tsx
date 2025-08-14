import React, { useEffect, useState, useCallback } from 'react';
import { Bookmark, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { Video } from '@shared/schema';
import { formatDuration } from '@/lib/storage';
import { extractVideoId } from '@/lib/youtube';

interface VideoPlayerProps {
  video: Video | null;
  onProgressUpdate: (currentTime: number, actualTimeSpent: number) => void;
  onMarkCheckpoint: (currentTime: number) => void;
  onInsertTimestamp: (timestamp: string) => void;
}

export function VideoPlayer({ 
  video, 
  onProgressUpdate, 
  onMarkCheckpoint,
  onInsertTimestamp 
}: VideoPlayerProps) {
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

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

  // Seek to last position when video loads
  useEffect(() => {
    if (isReady && video && video.lastPosition > 0) {
      seekTo(video.lastPosition);
    }
  }, [isReady, video, seekTo]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }

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
          e.preventDefault();
          if (video) {
            onMarkCheckpoint(getCurrentTime());
          }
          break;
      }

      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        const time = getCurrentTime();
        const timestamp = formatDuration(time);
        onInsertTimestamp(`[${timestamp}] `);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, play, pause, video, getCurrentTime, onMarkCheckpoint, onInsertTimestamp]);

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

  return (
    <Card>
      <CardContent className="p-0">
        {/* YouTube Player */}
        <div className="relative">
          <div className="aspect-video bg-gray-900 rounded-t-lg overflow-hidden">
            <div ref={containerRef} className="w-full h-full" />
          </div>
          
          {/* Progress Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => onMarkCheckpoint(getCurrentTime())}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Bookmark className="w-4 h-4 mr-2" />
                Mark Progress
              </Button>
              <span className="text-white text-sm">
                {formatDuration(currentTime)} / {formatDuration(video.duration)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Video Info and Controls */}
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
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
