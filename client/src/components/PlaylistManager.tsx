import React, { useState } from 'react';
import { Star, Trash2, Eye, Clock, PlayCircle, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Playlist } from '@shared/schema';
import { formatDuration, formatTimeRemaining } from '@/lib/storage';

interface PlaylistManagerProps {
  playlists: Playlist[];
  currentPlaylistId: string | null;
  onPlaylistSelect: (id: string) => void;
  onPlaylistDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  isLoading?: boolean;
}

export function PlaylistManager({ 
  playlists, 
  currentPlaylistId, 
  onPlaylistSelect, 
  onPlaylistDelete,
  onToggleFavorite,
  isLoading = false 
}: PlaylistManagerProps) {
  const [filter, setFilter] = useState<'all' | 'favorites' | 'recent'>('all');

  const getPlaylistProgress = (playlist: Playlist) => {
    if (playlist.videos.length === 0) return 0;
    const totalDuration = playlist.videos.reduce((sum, video) => sum + video.duration, 0);
    const watchedDuration = playlist.videos.reduce((sum, video) => {
      return sum + video.watchedSegments.reduce((segSum, [start, end]) => segSum + (end - start), 0);
    }, 0);
    return totalDuration > 0 ? (watchedDuration / totalDuration) * 100 : 0;
  };

  const getCompletedVideos = (playlist: Playlist) => {
    return playlist.videos.filter(video => video.completed).length;
  };

  const getFilteredPlaylists = () => {
    let filtered = [...playlists];

    switch (filter) {
      case 'favorites':
        filtered = filtered.filter(p => p.isFavorite);
        break;
      case 'recent':
        filtered = filtered.sort((a, b) => 
          new Date(b.lastAccessed || 0).getTime() - new Date(a.lastAccessed || 0).getTime()
        ).slice(0, 10);
        break;
      default:
        // Sort by last accessed for 'all'
        filtered = filtered.sort((a, b) => 
          new Date(b.lastAccessed || 0).getTime() - new Date(a.lastAccessed || 0).getTime()
        );
    }

    return filtered;
  };

  const formatLastAccessed = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Playlists</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredPlaylists = getFilteredPlaylists();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Your Playlists ({playlists.length})
          <div className="flex space-x-1">
            {(['all', 'favorites', 'recent'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize text-xs"
              >
                {f === 'favorites' && <Star className="w-3 h-3 mr-1" />}
                {f === 'recent' && <Clock className="w-3 h-3 mr-1" />}
                {f}
              </Button>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredPlaylists.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {filter === 'all' ? (
              <div>
                <PlayCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No playlists yet. Add a YouTube playlist to get started!</p>
              </div>
            ) : (
              <p>No {filter} playlists found</p>
            )}
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {filteredPlaylists.map((playlist) => {
                const progress = getPlaylistProgress(playlist);
                const completedVideos = getCompletedVideos(playlist);
                const isActive = playlist.id === currentPlaylistId;

                return (
                  <div
                    key={playlist.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      isActive
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                    onClick={() => onPlaylistSelect(playlist.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 mr-4">
                        {/* Title and favorite indicator */}
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {playlist.title || 'Untitled Playlist'}
                          </h3>
                          {playlist.isFavorite && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                          )}
                        </div>

                        {/* Stats */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                          <span className="flex items-center">
                            <PlayCircle className="w-3 h-3 mr-1" />
                            {playlist.videos.length} videos
                          </span>
                          <span className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {completedVideos}/{playlist.videos.length} completed
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatLastAccessed(playlist.lastAccessed)}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                progress >= 90 
                                  ? 'bg-green-500' 
                                  : progress >= 50 
                                  ? 'bg-yellow-500' 
                                  : 'bg-blue-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Tags */}
                        {playlist.tags && playlist.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {playlist.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {playlist.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{playlist.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(playlist.id);
                          }}>
                            <Star className={`w-4 h-4 mr-2 ${playlist.isFavorite ? 'fill-current text-yellow-500' : ''}`} />
                            {playlist.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlaylistDelete(playlist.id);
                            }}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete playlist
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}