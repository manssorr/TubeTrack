import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, SkipBack, SkipForward, List, Keyboard } from "lucide-react";
import { useState } from "react";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";

import VideoPlayer from "@/components/VideoPlayer";
import VideoControlPanel from "@/components/VideoControlPanel";
import { useVideos, useProgress, usePlaylists } from "@/hooks/useLocalStorage";
import { useVideoKeyboardShortcuts, KeyboardShortcutsHelp } from "@/hooks/useVideoKeyboardShortcuts";

export default function VideoPlayerPage() {
    const { videoId } = useParams<{ videoId: string }>();
    const navigate = useNavigate();
    const [showPlaylist, setShowPlaylist] = useState(false);

    // Player state
    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const { videos } = useVideos();
    const { getVideoProgress } = useProgress();
    const { playlists } = usePlaylists();

    // Player control handlers
    const handlePlayPause = () => setPlaying(!playing);

    const handleSeek = (seconds: number) => {
        setCurrentTime(seconds);
        // Note: Actual seeking is handled by the VideoPlayer component via its ref
    };

    const handleSeekRelative = (delta: number) => {
        const newTime = Math.max(0, Math.min(duration, currentTime + delta));
        handleSeek(newTime);
    };

    const handleVolumeChange = (newVolume: number) => {
        setVolume(newVolume);
        if (newVolume > 0 && muted) {
            setMuted(false);
        }
    };

    const handleMuteToggle = () => setMuted(!muted);

    const handlePlaybackRateChange = (rate: number) => setPlaybackRate(rate);

    const handleVolumeUp = () => {
        const newVolume = Math.min(1, volume + 0.1);
        handleVolumeChange(newVolume);
    };

    const handleVolumeDown = () => {
        const newVolume = Math.max(0, volume - 0.1);
        handleVolumeChange(newVolume);
    };

    const handleSpeedDecrease = () => {
        const rates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
        const currentIndex = rates.indexOf(playbackRate);
        if (currentIndex > 0) {
            const newRate = rates[currentIndex - 1];
            if (newRate !== undefined) {
                setPlaybackRate(newRate);
            }
        }
    };

    const handleSpeedIncrease = () => {
        const rates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
        const currentIndex = rates.indexOf(playbackRate);
        if (currentIndex < rates.length - 1) {
            const newRate = rates[currentIndex + 1];
            if (newRate !== undefined) {
                setPlaybackRate(newRate);
            }
        }
    };

    const handleSeekToPercentage = (percentage: number) => {
        const newTime = (percentage / 100) * duration;
        handleSeek(newTime);
    };

    // Get video data and navigation
    const currentVideo = videoId ? videos[videoId] : null;
    const playlist = currentVideo ? playlists[currentVideo.playlistId] : null;
    const progress = videoId ? getVideoProgress(videoId) : null;

    // Get playlist videos for navigation
    const playlistVideos = currentVideo
        ? Object.values(videos)
            .filter(v => v.playlistId === currentVideo.playlistId)
            .sort((a, b) => a.position - b.position)
        : [];

    const currentIndex = playlistVideos.findIndex(v => v.id === videoId);
    const previousVideo = currentIndex > 0 ? playlistVideos[currentIndex - 1] : null;
    const nextVideo = currentIndex < playlistVideos.length - 1 ? playlistVideos[currentIndex + 1] : null;

    const handlePrevious = () => {
        if (previousVideo) {
            navigate(`/video/${previousVideo.id}`);
        }
    };

    const handleNext = () => {
        if (nextVideo) {
            navigate(`/video/${nextVideo.id}`);
        }
    };

    // Keyboard shortcuts
    useVideoKeyboardShortcuts({
        onPlayPause: handlePlayPause,
        onSeekBackward: (seconds = 5) => handleSeekRelative(-seconds),
        onSeekForward: (seconds = 5) => handleSeekRelative(seconds),
        onVolumeUp: handleVolumeUp,
        onVolumeDown: handleVolumeDown,
        onMuteToggle: handleMuteToggle,
        onSpeedDecrease: handleSpeedDecrease,
        onSpeedIncrease: handleSpeedIncrease,
        ...(previousVideo && { onPrevious: handlePrevious }),
        ...(nextVideo && { onNext: handleNext }),
        onSeekToPercentage: handleSeekToPercentage,
    });

    if (!videoId || !currentVideo) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Video Not Found</h1>
                    <p className="text-muted-foreground mb-6">
                        The requested video could not be found.
                    </p>
                    <Button onClick={() => navigate("/")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Home
                    </Button>
                </div>
            </div>
        );
    }

    const handleVideoEnd = () => {
        // Auto-advance to next video
        if (nextVideo) {
            navigate(`/video/${nextVideo.id}`);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        if (mins >= 60) {
            const hours = Math.floor(mins / 60);
            const remainingMins = mins % 60;
            return `${hours}:${remainingMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(-1)}
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>

                            <div className="flex items-center gap-2">
                                {previousVideo && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handlePrevious}
                                        title="Previous video"
                                    >
                                        <SkipBack className="w-4 h-4" />
                                    </Button>
                                )}

                                {nextVideo && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleNext}
                                        title="Next video"
                                    >
                                        <SkipForward className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <Keyboard className="w-4 h-4 mr-2" />
                                        Shortcuts
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Keyboard Shortcuts</DialogTitle>
                                    </DialogHeader>
                                    <KeyboardShortcutsHelp />
                                </DialogContent>
                            </Dialog>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPlaylist(!showPlaylist)}
                                className="flex items-center gap-2"
                            >
                                <List className="w-4 h-4" />
                                Playlist
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                <div className={`grid gap-6 ${showPlaylist ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
                    {/* Main Video Player */}
                    <div className={showPlaylist ? 'lg:col-span-2' : 'lg:col-span-1'}>
                        <div className="space-y-4">
                            {/* Video Player */}
                            <div className="aspect-video">
                                <VideoPlayer
                                    videoId={videoId}
                                    playing={playing}
                                    volume={volume}
                                    muted={muted}
                                    playbackRate={playbackRate}
                                    controls={false}
                                    width="100%"
                                    height="100%"
                                    resumeFromLastPosition={true}
                                    onReady={() => {
                                        console.log('Video ready');
                                    }}
                                    onPlay={() => setPlaying(true)}
                                    onPause={() => setPlaying(false)}
                                    onProgress={(state) => {
                                        setCurrentTime(state.playedSeconds);
                                        if (state.duration && !duration) {
                                            setDuration(state.duration);
                                        }
                                    }}
                                    onVideoEnd={handleVideoEnd}
                                    onError={(error) => {
                                        console.error('Video error:', error);
                                    }}
                                    className="w-full h-full"
                                />

                                {/* Custom Video Controls */}
                                <VideoControlPanel
                                    playing={playing}
                                    currentTime={currentTime}
                                    duration={duration}
                                    volume={volume}
                                    muted={muted}
                                    playbackRate={playbackRate}
                                    onPlayPause={handlePlayPause}
                                    onSeek={handleSeek}
                                    onVolumeChange={handleVolumeChange}
                                    onMuteToggle={handleMuteToggle}
                                    onPlaybackRateChange={handlePlaybackRateChange}
                                    onSeekRelative={handleSeekRelative}
                                    {...(previousVideo && { onPrevious: handlePrevious })}
                                    {...(nextVideo && { onNext: handleNext })}
                                    showNavigationButtons={true}
                                    className="mt-2"
                                />
                            </div>

                            {/* Video Info */}
                            <div className="space-y-4">
                                <div>
                                    <h1 className="text-2xl font-bold line-clamp-2">
                                        {currentVideo.title}
                                    </h1>
                                    <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                                        <span>{currentVideo.channelTitle}</span>
                                        <span>•</span>
                                        <span>{formatDuration(currentVideo.durationSec)}</span>
                                        <span>•</span>
                                        <span>#{currentVideo.position + 1} in playlist</span>
                                    </div>
                                </div>

                                {/* Progress Info */}
                                <div className="flex items-center gap-4">
                                    <Badge variant={progress && progress.completion >= 0.9 ? "default" : progress && progress.watchedSeconds > 0 ? "secondary" : "outline"}>
                                        {progress && progress.completion >= 0.9 ? "Completed" : progress && progress.watchedSeconds > 0 ? "In Progress" : "Not Started"}
                                    </Badge>

                                    {progress && progress.watchedSeconds > 0 && (
                                        <span className="text-sm text-muted-foreground">
                                            {Math.round((progress.completion || 0) * 100)}% watched
                                        </span>
                                    )}
                                </div>

                                {/* Playlist Info */}
                                {playlist && (
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">From Playlist</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div>
                                                <p className="font-medium">{playlist.title}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {playlist.channelTitle} • {playlistVideos.length} videos
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Playlist Sidebar */}
                    {showPlaylist && (
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        Playlist ({currentIndex + 1}/{playlistVideos.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="max-h-[600px] overflow-y-auto">
                                        {playlistVideos.map((video, index) => {
                                            const videoProgress = getVideoProgress(video.id);
                                            const isCurrentVideo = video.id === videoId;
                                            const isCompleted = videoProgress.completion >= 0.9;

                                            return (
                                                <div
                                                    key={video.id}
                                                    className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${isCurrentVideo ? 'bg-primary/10 border-primary/20' : ''
                                                        }`}
                                                    role="button"
                                                    tabIndex={0}
                                                    aria-current={isCurrentVideo ? "true" : undefined}
                                                    onClick={() => !isCurrentVideo && navigate(`/video/${video.id}`)}
                                                    onKeyDown={e => {
                                                        if (!isCurrentVideo && (e.key === "Enter" || e.key === " ")) {
                                                            e.preventDefault();
                                                            navigate(`/video/${video.id}`);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex gap-3">
                                                        <div className="flex-shrink-0 text-sm text-muted-foreground w-8">
                                                            {index + 1}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm line-clamp-2 ${isCurrentVideo ? 'font-medium' : ''}`}>
                                                                {video.title}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs text-muted-foreground">
                                                                    {formatDuration(video.durationSec)}
                                                                </span>
                                                                {isCompleted && (
                                                                    <Badge variant="default" className="text-xs">
                                                                        ✓
                                                                    </Badge>
                                                                )}
                                                                {videoProgress.watchedSeconds > 0 && !isCompleted && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {Math.round(videoProgress.completion * 100)}%
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
