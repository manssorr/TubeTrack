import React from 'react';
import { Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Playlist, Video } from '@shared/schema';
import { formatDuration } from '@/lib/storage';

interface VideoListProps {
  playlist: Playlist | null;
  currentVideoIndex: number;
  onVideoSelect: (index: number) => void;
}

export function VideoList({ playlist, currentVideoIndex, onVideoSelect }: VideoListProps) {
  if (!playlist) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Playlist Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No playlist loaded
          </p>
        </CardContent>
      </Card>
    );
  }

  const getVideoProgress = (video: Video) => {
    if (video.duration === 0) return 0;
    const watchedTime = video.watchedSegments.reduce((sum, [start, end]) => sum + (end - start), 0);
    return (watchedTime / video.duration) * 100;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Playlist Videos</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {playlist.videos.map((video, index) => {
              const progress = getVideoProgress(video);
              const isActive = index === currentVideoIndex;
              
              return (
                <div
                  key={video.id}
                  onClick={() => onVideoSelect(index)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    isActive
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-8 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                        <Play className="w-3 h-3 text-gray-500" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {video.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDuration(video.duration)}
                        </span>
                        <span className={`text-xs ${progress >= 90 ? 'text-green-600' : progress >= 50 ? 'text-yellow-600' : 'text-blue-600'}`}>
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="mt-2">
                        <Progress 
                          value={progress} 
                          className="h-1.5"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
