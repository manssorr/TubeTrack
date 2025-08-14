import React from 'react';
import { Clock, Check, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video } from '@shared/schema';
import { formatDuration } from '@/lib/storage';

interface VideoControlPanelProps {
  video: Video | null;
  onMarkCheckpoint: (currentTime: number) => void;
  onInsertTimestamp: (timestamp: string) => void;
  getCurrentTime: () => number;
}

export function VideoControlPanel({ 
  video, 
  onMarkCheckpoint, 
  onInsertTimestamp,
  getCurrentTime 
}: VideoControlPanelProps) {
  if (!video) {
    return null;
  }

  const currentTime = getCurrentTime();
  
  return (
    <Card className="border-l-4 border-l-green-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between space-x-4">
          {/* Time Display */}
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
            <span className="font-mono">Current: {formatDuration(currentTime)}</span>
            <span className="font-mono">Duration: {formatDuration(video.duration)}</span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => onMarkCheckpoint(currentTime)}
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              <Check className="w-4 h-4 mr-2" />
              Mark Progress
            </Button>
            
            <Button
              onClick={() => onInsertTimestamp(`[${formatDuration(currentTime)}] `)}
              variant="outline"
              size="sm"
            >
              <Clock className="w-4 h-4 mr-1" />
              Insert Time
            </Button>
          </div>
        </div>

        {/* Progress Info */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            Progress: {Math.round(
              video.duration > 0 
                ? (video.watchedSegments.reduce((sum, [start, end]) => sum + (end - start), 0) / video.duration) * 100
                : 0
            )}% completed
          </span>
          <span>
            Session time: {formatDuration(video.actualTimeSpent)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}