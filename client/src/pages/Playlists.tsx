import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    PlayCircle,
    Clock,
    User,
    Calendar,
    MoreVertical,
    Trash2,
    ExternalLink,
    Plus,
    Search,
    Filter,
    Grid3X3,
    List
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import PlaylistManager from "@/components/PlaylistManager";
import { usePlaylists, useVideos, useProgress } from "@/hooks/useLocalStorage";

type ViewMode = 'grid' | 'list';
type SortOption = 'recent' | 'title' | 'progress' | 'videos';

export default function Playlists() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>('recent');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [showImporter, setShowImporter] = useState(false);

    const { playlists, removePlaylist } = usePlaylists();
    const { getVideosByPlaylist } = useVideos();
    const { getVideoProgress } = useProgress();

    const playlistsArray = Object.values(playlists);

    // Filter and sort playlists
    const filteredAndSortedPlaylists = playlistsArray
        .filter(playlist =>
            playlist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            playlist.channelTitle.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'recent':
                    return new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime();
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'progress':
                    const aProgress = getPlaylistProgress(a.id);
                    const bProgress = getPlaylistProgress(b.id);
                    return bProgress.completionRate - aProgress.completionRate;
                case 'videos':
                    const aVideos = getVideosByPlaylist(a.id);
                    const bVideos = getVideosByPlaylist(b.id);
                    return bVideos.length - aVideos.length;
                default:
                    return 0;
            }
        });

    // Calculate playlist progress
    function getPlaylistProgress(playlistId: string) {
        const playlistVideos = getVideosByPlaylist(playlistId);
        const completedVideos = playlistVideos.filter(video => {
            const progress = getVideoProgress(video.id);
            return progress.completion >= 0.9;
        }).length;

        const totalDuration = playlistVideos.reduce((sum, video) => sum + video.durationSec, 0);
        const watchedDuration = playlistVideos.reduce((sum, video) => {
            const progress = getVideoProgress(video.id);
            return sum + progress.watchedSeconds;
        }, 0);

        return {
            totalVideos: playlistVideos.length,
            completedVideos,
            completionRate: playlistVideos.length > 0 ? (completedVideos / playlistVideos.length) * 100 : 0,
            totalDuration,
            watchedDuration,
        };
    }

    // Format duration helper
    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m`;
        }
        return `${seconds}s`;
    };

    // Navigate to first video in playlist
    const handlePlayPlaylist = (playlistId: string) => {
        const playlistVideos = getVideosByPlaylist(playlistId).sort((a, b) => a.position - b.position);
        if (playlistVideos.length > 0) {
            navigate(`/video/${playlistVideos[0].id}`);
        }
    };

    // Handle playlist deletion with confirmation
    const handleDeletePlaylist = async (playlistId: string, playlistTitle: string) => {
        if (window.confirm(`Are you sure you want to delete "${playlistTitle}"? This will also remove all associated videos and progress.`)) {
            removePlaylist(playlistId);
        }
    };

    // Render empty state
    if (playlistsArray.length === 0) {
        return (
            <div className="container mx-auto py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold tracking-tight mb-2">My Playlists</h1>
                    <p className="text-lg text-muted-foreground">
                        Import and manage your YouTube playlists
                    </p>
                </div>

                <div className="max-w-2xl mx-auto">
                    <PlaylistManager />

                    <div className="text-center py-12 text-muted-foreground">
                        <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No playlists yet</h3>
                        <p className="mb-6">
                            Import your first YouTube playlist to start learning and tracking progress!
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Render playlist card
    const PlaylistCard = ({ playlist }: { playlist: any }) => {
        const progress = getPlaylistProgress(playlist.id);

        return (
            <Card className="group hover:shadow-lg transition-all duration-200">
                <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1 min-w-0">
                            <CardTitle className="line-clamp-2 text-lg">
                                {playlist.title}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {playlist.channelTitle}
                            </CardDescription>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => window.open(`https://www.youtube.com/playlist?list=${playlist.id}`, '_blank')}
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    View on YouTube
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleDeletePlaylist(playlist.id, playlist.title)}
                                    className="text-destructive"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Playlist
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>{progress.completedVideos} of {progress.totalVideos} completed</span>
                            <span>{Math.round(progress.completionRate)}%</span>
                        </div>
                        <Progress value={progress.completionRate} className="h-2" />
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                            <p className="text-xl font-bold">{progress.totalVideos}</p>
                            <p className="text-muted-foreground">Videos</p>
                        </div>
                        <div>
                            <p className="text-xl font-bold">{formatDuration(progress.totalDuration)}</p>
                            <p className="text-muted-foreground">Duration</p>
                        </div>
                        <div>
                            <p className="text-xl font-bold">{formatDuration(progress.watchedDuration)}</p>
                            <p className="text-muted-foreground">Watched</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            onClick={() => handlePlayPlaylist(playlist.id)}
                            className="flex-1"
                            disabled={progress.totalVideos === 0}
                        >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            {progress.completedVideos > 0 ? 'Continue' : 'Start'} Learning
                        </Button>
                        {/* <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/playlist/${playlist.id}/videos`)}
                        >
                            View Videos
                        </Button> */}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Imported {new Date(playlist.importedAt).toLocaleDateString()}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                            {progress.completionRate === 100 ? 'Completed' :
                                progress.completedVideos > 0 ? 'In Progress' : 'Not Started'}
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="container mx-auto py-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">My Playlists</h1>
                    <p className="text-muted-foreground">
                        {playlistsArray.length} playlist{playlistsArray.length !== 1 ? 's' : ''} imported
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button onClick={() => setShowImporter(!showImporter)} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Import Playlist
                    </Button>
                </div>
            </div>

            {/* Import Section */}
            {showImporter && (
                <div className="max-w-2xl">
                    <PlaylistManager />
                </div>
            )}

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Search playlists..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                        <SelectTrigger className="w-[160px]">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="recent">Recently Added</SelectItem>
                            <SelectItem value="title">Title (A-Z)</SelectItem>
                            <SelectItem value="progress">Progress</SelectItem>
                            <SelectItem value="videos">Video Count</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex border rounded-md">
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className="rounded-r-none"
                        >
                            <Grid3X3 className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className="rounded-l-none"
                        >
                            <List className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Playlists Grid/List */}
            {filteredAndSortedPlaylists.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No playlists found</h3>
                    <p>Try adjusting your search or import a new playlist.</p>
                </div>
            ) : (
                <div className={
                    viewMode === 'grid'
                        ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                        : "space-y-4"
                }>
                    {filteredAndSortedPlaylists.map(playlist => (
                        <PlaylistCard key={playlist.id} playlist={playlist} />
                    ))}
                </div>
            )}
        </div>
    );
}