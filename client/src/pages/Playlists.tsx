import { useState } from "react";
import { ChevronDown, ChevronRight, PlayCircle, Clock, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import PlaylistManager from "../components/PlaylistManager";
import VideoList from "../components/VideoList";
import VideoFilters, { type CompletionFilter, type SortOption } from "../components/VideoFilters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";
import { usePlaylists, useVideos, useProgress } from "../hooks/useLocalStorage";

interface PlaylistCardProps {
    playlist: {
        id: string;
        title: string;
        channelTitle: string;
        itemCount: number;
        importedAt: string;
    };
    onVideoSelect?: (videoId: string) => void;
}

function PlaylistCard({ playlist, onVideoSelect }: PlaylistCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [completionFilter, setCompletionFilter] = useState<CompletionFilter>("all");
    const [sortBy, setSortBy] = useState<SortOption>("position");

    const { getVideosByPlaylist } = useVideos();
    const { getVideoProgress } = useProgress();
    const { removePlaylist } = usePlaylists();

    const videos = getVideosByPlaylist(playlist.id);

    // Calculate playlist stats
    const playlistStats = videos.reduce(
        (acc, video) => {
            const progress = getVideoProgress(video.id);
            const isCompleted = progress.completion >= 0.9;
            const hasStarted = progress.watchedSeconds > 0;

            acc.totalDuration += video.durationSec;
            acc.totalWatchedTime += progress.watchedSeconds;

            if (isCompleted) {
                acc.completed++;
            } else if (hasStarted) {
                acc.inProgress++;
            } else {
                acc.notStarted++;
            }

            return acc;
        },
        { completed: 0, inProgress: 0, notStarted: 0, totalDuration: 0, totalWatchedTime: 0 }
    );

    const completionRate = videos.length > 0 ? (playlistStats.completed / videos.length) * 100 : 0;

    // Filter videos for current filters
    const filteredVideos = videos.filter(video => {
        const matchesSearch = !searchQuery ||
            video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            video.channelTitle.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (completionFilter === "all") return true;

        const progress = getVideoProgress(video.id);
        const isCompleted = progress.completion >= 0.9;
        const hasStarted = progress.watchedSeconds > 0;

        switch (completionFilter) {
            case "completed": return isCompleted;
            case "in-progress": return hasStarted && !isCompleted;
            case "not-started": return !hasStarted;
            default: return true;
        }
    });

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete "${playlist.title}"? This will also remove all progress and notes for videos in this playlist.`)) {
            removePlaylist(playlist.id);
            toast.success(`Deleted playlist "${playlist.title}"`);
        }
    };

    return (
        <Card>
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1 flex-1 min-w-0">
                            <CardTitle className="text-lg line-clamp-2">{playlist.title}</CardTitle>
                            <CardDescription className="flex items-center gap-2 text-sm">
                                <span>{playlist.channelTitle}</span>
                                <span>•</span>
                                <span>{videos.length} videos</span>
                                <span>•</span>
                                <span>{formatDuration(playlistStats.totalDuration)}</span>
                            </CardDescription>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleDelete}
                                className="text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    {isExpanded ? (
                                        <ChevronDown className="w-4 h-4" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4" />
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="secondary" className="text-xs">
                            {Math.round(completionRate)}% Complete
                        </Badge>
                        {playlistStats.completed > 0 && (
                            <Badge variant="default" className="text-xs">
                                {playlistStats.completed} Completed
                            </Badge>
                        )}
                        {playlistStats.inProgress > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                {playlistStats.inProgress} In Progress
                            </Badge>
                        )}
                        {playlistStats.notStarted > 0 && (
                            <Badge variant="outline" className="text-xs">
                                {playlistStats.notStarted} Not Started
                            </Badge>
                        )}
                    </div>
                </CardHeader>

                <CollapsibleContent>
                    <CardContent className="pt-0">
                        <div className="space-y-4">
                            <VideoFilters
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                                completionFilter={completionFilter}
                                onCompletionFilterChange={setCompletionFilter}
                                sortBy={sortBy}
                                onSortChange={setSortBy}
                                videoCount={videos.length}
                                filteredCount={filteredVideos.length}
                            />

                            <VideoList
                                playlistId={playlist.id}
                                searchQuery={searchQuery}
                                completionFilter={completionFilter}
                                sortBy={sortBy}
                                onVideoSelect={onVideoSelect}
                            />
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}

export default function Playlists() {
    const { playlists } = usePlaylists();

    const playlistsArray = Object.values(playlists).sort(
        (a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()
    );

    const handleVideoSelect = (videoId: string) => {
        // TODO: Navigate to video player
        console.log("Selected video:", videoId);
    };

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight mb-2">Playlists</h1>
                <p className="text-lg text-muted-foreground">
                    Import and manage your YouTube learning playlists
                </p>
            </div>

            {/* Import Section */}
            <div className="mb-8">
                <PlaylistManager />
            </div>

            {/* Playlists Section */}
            {playlistsArray.length > 0 ? (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <PlayCircle className="w-5 h-5" />
                        <h2 className="text-2xl font-semibold">Your Playlists</h2>
                        <Badge variant="secondary" className="ml-auto">
                            {playlistsArray.length} playlist{playlistsArray.length !== 1 ? 's' : ''}
                        </Badge>
                    </div>

                    <div className="space-y-4">
                        {playlistsArray.map(playlist => (
                            <PlaylistCard
                                key={playlist.id}
                                playlist={playlist}
                                onVideoSelect={handleVideoSelect}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    <PlayCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No playlists yet</h3>
                    <p>Import your first YouTube playlist to get started!</p>
                </div>
            )}
        </div>
    );
}
