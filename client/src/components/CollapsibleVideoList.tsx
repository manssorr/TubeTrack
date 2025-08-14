import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Playlist, Video } from '@shared/schema';
import { formatDuration } from '@/lib/storage';

interface CollapsibleVideoListProps {
  playlist: Playlist | null;
  currentVideoIndex: number;
  onVideoSelect: (index: number) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

export function CollapsibleVideoList({ 
  playlist, 
  currentVideoIndex, 
  onVideoSelect,
  isCollapsed = false,
  onToggleCollapse
}: CollapsibleVideoListProps) {
  if (!playlist) {
    return (
      <Card className={`transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-full'}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            {!isCollapsed && <CardTitle className="text-sm">Playlist Videos</CardTitle>}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleCollapse?.(!isCollapsed)}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {!isCollapsed && (
          <CardContent>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No playlist loaded
            </p>
          </CardContent>
        )}
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
    <Card className={`transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-full'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          {!isCollapsed && <CardTitle className="text-sm">Playlist Videos</CardTitle>}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleCollapse?.(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {playlist.videos.map((video, index) => {
                const progress = getVideoProgress(video);
                const isActive = index === currentVideoIndex;
                
                return (
                  <div
                    key={video.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-primary/10 border-primary dark:bg-primary/20'
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => onVideoSelect(index)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isActive 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                        }`}>
                          <Play className="w-4 h-4" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium line-clamp-2 ${
                          isActive 
                            ? 'text-primary' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {video.title}
                        </h4>
                        
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatDuration(video.duration)}</span>
                          <span>{Math.round(progress)}% watched</span>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="mt-2">
                          <Progress 
                            value={progress} 
                            className="h-1.5"
                          />
                        </div>
                        
                        {/* Completion indicator */}
                        {video.completed && (
                          <div className="mt-1 text-xs text-green-600 dark:text-green-400 font-medium">
                            ✓ Completed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      )}

      {/* Collapsed state - show current video indicator */}
      {isCollapsed && (
        <div className="px-2 pb-2">
          <div className="w-8 h-8 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <span className="text-xs font-bold">{currentVideoIndex + 1}</span>
          </div>
        </div>
      )}
    </Card>
  );
}