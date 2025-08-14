import React, { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { fetchPlaylistInfo, extractPlaylistId, durationToSeconds } from '@/lib/youtube';
import { Playlist, Video } from '@shared/schema';

interface PlaylistInputProps {
  onPlaylistAdd: (playlist: Playlist) => void;
}

export function PlaylistInput({ onPlaylistAdd }: PlaylistInputProps) {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLoadPlaylist = async () => {
    if (!playlistUrl.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube playlist URL.",
        variant: "destructive",
      });
      return;
    }

    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube playlist URL.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const playlistInfo = await fetchPlaylistInfo(playlistId);
      
      const videos: Video[] = playlistInfo.videos.map(video => ({
        id: video.id,
        title: video.title,
        url: video.url,
        duration: durationToSeconds(video.duration),
        watchedSegments: [],
        lastPosition: 0,
        notes: '',
        actualTimeSpent: 0,
        completed: false,
      }));

      const playlist: Playlist = {
        id: playlistInfo.id,
        title: playlistInfo.title,
        url: playlistUrl,
        videos,
        startDate: new Date().toISOString(),
        totalActualTime: 0,
        currentVideoIndex: 0,
      };

      onPlaylistAdd(playlist);
      setPlaylistUrl('');
      
      toast({
        title: "Playlist Added",
        description: `Successfully loaded "${playlistInfo.title}" with ${videos.length} videos.`,
      });
    } catch (error) {
      console.error('Error loading playlist:', error);
      toast({
        title: "Failed to Load Playlist",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        // Validate JSON structure
        if (!Array.isArray(jsonData)) {
          throw new Error('JSON must be an array of video objects');
        }

        const videos: Video[] = jsonData.map((item, index) => {
          if (!item.title || !item.url || typeof item.duration !== 'number') {
            throw new Error(`Invalid video object at index ${index}`);
          }
          
          return {
            id: `custom-${Date.now()}-${index}`,
            title: item.title,
            url: item.url,
            duration: item.duration,
            watchedSegments: [],
            lastPosition: 0,
            notes: '',
            actualTimeSpent: 0,
            completed: false,
          };
        });

        const playlist: Playlist = {
          id: `custom-${Date.now()}`,
          title: `Custom Playlist - ${new Date().toLocaleDateString()}`,
          videos,
          startDate: new Date().toISOString(),
          totalActualTime: 0,
          currentVideoIndex: 0,
        };

        onPlaylistAdd(playlist);
        
        toast({
          title: "JSON Imported",
          description: `Successfully imported ${videos.length} videos.`,
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: error instanceof Error ? error.message : "Invalid JSON format.",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Playlist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="playlist-url">YouTube Playlist URL</Label>
          <div className="flex space-x-3 mt-2">
            <Input
              id="playlist-url"
              type="url"
              placeholder="https://youtube.com/playlist?list=..."
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleLoadPlaylist} disabled={isLoading}>
              {!!isLoading && <Plus className="w-4 h-4 mr-2" />}
              {isLoading ? 'Loading...' : 'Load'}
            </Button>
          </div>
        </div>
        
        <div className="text-center text-gray-500 dark:text-gray-400">or</div>
        
        <div>
          <Label htmlFor="json-upload">Upload JSON</Label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer mt-2">
            <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Drop JSON file here or click to browse</p>
            <input
              id="json-upload"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => document.getElementById('json-upload')?.click()}
            >
              Choose File
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
