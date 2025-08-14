import React from 'react';
import { Clock, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LearningAnalytics } from '@/types';
import { formatTimeRemaining } from '@/lib/storage';

interface AnalyticsDashboardProps {
  analytics: LearningAnalytics;
}

export function AnalyticsDashboard({ analytics }: AnalyticsDashboardProps) {
  const CircularProgress = ({ value, size = 80 }: { value: number; size?: number }) => {
    const circumference = 2 * Math.PI * (size / 2 - 4);
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div className="relative inline-flex">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 4}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-gray-200 dark:text-gray-600"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 4}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="text-green-500 transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {Math.round(value)}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Completion Progress */}
          <div className="text-center">
            <CircularProgress value={analytics.overallProgress} />
            <h3 className="font-medium text-gray-900 dark:text-white mt-3">Overall Progress</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {analytics.completedVideos} of {analytics.totalVideos} videos completed
            </p>
          </div>

          {/* Learning Ratio */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="text-primary text-xl mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Learning Ratio</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {analytics.learningRatio.toFixed(1)}x
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              You take ~{analytics.learningRatio.toFixed(1)} hours to complete 1 hour of content
            </p>
          </div>

          {/* Time Remaining */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="text-orange-500 text-xl mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Est. Time Remaining</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatTimeRemaining(analytics.estimatedTimeRemaining)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">At current pace</p>
          </div>

          {/* Total Time Spent */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <Target className="text-green-500 text-xl mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Time Spent</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatTimeRemaining(analytics.totalTimeSpent / 3600)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {formatTimeRemaining(analytics.effectiveWatchTime / 3600)} effective watch time
            </p>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress Timeline */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Progress Timeline</h3>
            <div className="space-y-3">
              {analytics.completedVideos > 0 && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Completed {analytics.completedVideos} video{analytics.completedVideos > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {analytics.totalVideos > analytics.completedVideos && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {Math.round(analytics.overallProgress)}% progress overall
                  </span>
                </div>
              )}
              {analytics.totalVideos > 0 && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Started learning journey
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Learning Stats */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Learning Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Average session length</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.round(analytics.averageSessionLength)} min
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Learning streak</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {analytics.learningStreak} day{analytics.learningStreak !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total videos</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {analytics.totalVideos}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Completion rate</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.round(analytics.completionRate)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
