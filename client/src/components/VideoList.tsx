import { useMemo } from "react";
import { Play, User, CheckCircle, Circle, PlayCircle } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { useVideos, useProgress } from "../hooks/useLocalStorage";
import { TVideo } from "@tubetrack/shared";

interface VideoListProps {
    playlistId: string;
    searchQuery?: string | undefined;
    completionFilter?: "all" | "completed" | "in-progress" | "not-started" | undefined;
    sortBy?: "position" | "title" | "duration" | "completion" | undefined;
    onVideoSelect?: ((videoId: string) => void) | undefined;
}

interface VideoItemProps {
    video: TVideo;
    progress: {
        completion: number;
        watchedSeconds: number;
        lastWatchedAt: string;
    };
    onSelect: (videoId: string) => void;
}

function VideoItem({ video, progress, onSelect }: VideoItemProps) {
    const completionPercentage = Math.round(progress.completion * 100);
    const isCompleted = progress.completion >= 0.9;
    const hasStarted = progress.watchedSeconds > 0;

    // Format duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins >= 60) {
            const hours = Math.floor(mins / 60);
            const remainingMins = mins % 60;
            return `${hours}:${remainingMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // Get best thumbnail
    const getThumbnail = (thumbnails: Record<string, any>) => {
        if (thumbnails.medium) return thumbnails.medium.url;
        if (thumbnails.high) return thumbnails.high.url;
        if (thumbnails.standard) return thumbnails.standard.url;
        if (thumbnails.default) return thumbnails.default.url;
        return "/api/placeholder/320/180"; // fallback
    };

    const handleClick = () => {
        onSelect(video.id);
    };

    return (
        <Card
            className="group hover:shadow-md transition-shadow cursor-pointer"
            onClick={handleClick}
        >
            <CardContent className="p-4">
                <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="relative flex-shrink-0">
                        <img
                            src={getThumbnail(video.thumbnails)}
                            alt={video.title}
                            className="w-32 h-18 object-cover rounded-md bg-muted"
                            loading="lazy"
                        />

                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                            <Play className="w-6 h-6 text-white" fill="white" />
                        </div>

                        {/* Duration badge */}
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                            {formatDuration(video.durationSec)}
                        </div>

                        {/* Progress indicator */}
                        {hasStarted && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 h-1 rounded-b-md">
                                <div
                                    className={`h-full rounded-b-md ${isCompleted ? "bg-green-500" : "bg-blue-500"
                                        }`}
                                    style={{ width: `${completionPercentage}%` }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium line-clamp-2 text-sm group-hover:text-primary transition-colors">
                                {video.title}
                            </h3>

                            {/* Status icon */}
                            <div className="flex-shrink-0 mt-1">
                                {isCompleted ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : hasStarted ? (
                                    <PlayCircle className="w-4 h-4 text-blue-600" />
                                ) : (
                                    <Circle className="w-4 h-4 text-muted-foreground" />
                                )}
                            </div>
                        </div>

                        {/* Channel and position */}
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span className="truncate">{video.channelTitle || "Unknown Channel"}</span>
                            <span>•</span>
                            <span>#{video.position + 1}</span>
                        </div>

                        {/* Progress info */}
                        {hasStarted && (
                            <div className="mt-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                    <span>Progress</span>
                                    <span>{completionPercentage}%</span>
                                </div>
                                <Progress value={completionPercentage} className="h-1" />
                            </div>
                        )}

                        {/* Status badge */}
                        <div className="mt-2">
                            <Badge
                                variant={
                                    isCompleted ? "default" : hasStarted ? "secondary" : "outline"
                                }
                                className="text-xs"
                            >
                                {isCompleted ? "Completed" : hasStarted ? "In Progress" : "Not Started"}
                            </Badge>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function VideoList({
    playlistId,
    searchQuery = "",
    completionFilter = "all",
    sortBy = "position",
    onVideoSelect,
}: VideoListProps) {
    const handleVideoSelect = onVideoSelect || (() => { });
    const { getVideosByPlaylist } = useVideos();
    const { getVideoProgress } = useProgress();

    const videos = getVideosByPlaylist(playlistId);

    // Filter and sort videos
    const filteredAndSortedVideos = useMemo(() => {
        let filtered = videos;

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                video =>
                    video.title.toLowerCase().includes(query) ||
                    video.channelTitle.toLowerCase().includes(query)
            );
        }

        // Apply completion filter
        if (completionFilter !== "all") {
            filtered = filtered.filter(video => {
                const progress = getVideoProgress(video.id);
                const isCompleted = progress.completion >= 0.9;
                const hasStarted = progress.watchedSeconds > 0;

                switch (completionFilter) {
                    case "completed":
                        return isCompleted;
                    case "in-progress":
                        return hasStarted && !isCompleted;
                    case "not-started":
                        return !hasStarted;
                    default:
                        return true;
                }
            });
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "title":
                    return a.title.localeCompare(b.title);
                case "duration":
                    return b.durationSec - a.durationSec; // longest first
                case "completion": {
                    const progressA = getVideoProgress(a.id);
                    const progressB = getVideoProgress(b.id);
                    return progressB.completion - progressA.completion; // most complete first
                }
                case "position":
                default:
                    return a.position - b.position;
            }
        });

        return filtered;
    }, [videos, searchQuery, completionFilter, sortBy, getVideoProgress]);

    if (videos.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <PlayCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No videos found in this playlist</p>
            </div>
        );
    }

    if (filteredAndSortedVideos.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <PlayCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No videos match your current filters</p>
                <p className="text-sm mt-1">Try adjusting your search or filter settings</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {filteredAndSortedVideos.map(video => {
                const progress = getVideoProgress(video.id);
                return (
                    <VideoItem
                        key={video.id}
                        video={video}
                        progress={progress}
                        onSelect={handleVideoSelect}
                    />
                );
            })}
        </div>
    );
}
