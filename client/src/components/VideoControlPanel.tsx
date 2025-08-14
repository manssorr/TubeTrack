
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";

import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface VideoControlPanelProps {
    // Player state
    playing: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    muted: boolean;
    playbackRate: number;

    // Control handlers
    onPlayPause: () => void;
    onSeek: (seconds: number) => void;
    onVolumeChange: (volume: number) => void;
    onMuteToggle: () => void;
    onPlaybackRateChange: (rate: number) => void;
    onSeekRelative: (delta: number) => void;
    onPrevious?: () => void;
    onNext?: () => void;

    // Optional customization
    showVolumeControl?: boolean;
    showPlaybackRate?: boolean;
    showNavigationButtons?: boolean;
    compact?: boolean;
    className?: string;
}

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const playbackRateOptions = [
    { value: 0.25, label: "0.25x" },
    { value: 0.5, label: "0.5x" },
    { value: 0.75, label: "0.75x" },
    { value: 1, label: "1x" },
    { value: 1.25, label: "1.25x" },
    { value: 1.5, label: "1.5x" },
    { value: 1.75, label: "1.75x" },
    { value: 2, label: "2x" },
];

export default function VideoControlPanel({
    playing,
    currentTime,
    duration,
    volume,
    muted,
    playbackRate,
    onPlayPause,
    onSeek,
    onVolumeChange,
    onMuteToggle,
    onPlaybackRateChange,
    onSeekRelative,
    onPrevious,
    onNext,
    showVolumeControl = true,
    showPlaybackRate = true,
    showNavigationButtons = true,
    compact = false,
    className = "",
}: VideoControlPanelProps) {
    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    const handleSeekBarChange = (value: number[]) => {
        const newTime = ((value[0] ?? 0) / 100) * duration;
        onSeek(newTime);
    };

    const handleVolumeChange = (value: number[]) => {
        onVolumeChange((value[0] ?? 0) / 100);
    };

    return (
        <div className={`bg-black/90 text-white p-4 space-y-3 ${className}`}>
            {/* Progress Bar */}
            <div className="space-y-2">
                <Slider
                    value={[progressPercentage]}
                    onValueChange={handleSeekBarChange}
                    max={100}
                    step={0.1}
                    className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-300">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Main Controls */}
            <div className={`flex items-center ${compact ? 'space-x-2' : 'space-x-4'}`}>
                {/* Navigation Controls */}
                {showNavigationButtons && (
                    <>
                        {onPrevious && (
                            <Button
                                size={compact ? "sm" : "default"}
                                variant="ghost"
                                onClick={onPrevious}
                                className="text-white hover:text-gray-200"
                            >
                                <SkipBack className="w-4 h-4" />
                            </Button>
                        )}
                    </>
                )}

                {/* Seek backward */}
                <Button
                    size={compact ? "sm" : "default"}
                    variant="ghost"
                    onClick={() => onSeekRelative(-10)}
                    className="text-white hover:text-gray-200"
                    title="Seek backward 10s"
                >
                    -10s
                </Button>

                {/* Play/Pause */}
                <Button
                    size={compact ? "sm" : "default"}
                    variant="ghost"
                    onClick={onPlayPause}
                    className="text-white hover:text-gray-200"
                >
                    {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>

                {/* Seek forward */}
                <Button
                    size={compact ? "sm" : "default"}
                    variant="ghost"
                    onClick={() => onSeekRelative(10)}
                    className="text-white hover:text-gray-200"
                    title="Seek forward 10s"
                >
                    +10s
                </Button>

                {/* Navigation Controls */}
                {showNavigationButtons && (
                    <>
                        {onNext && (
                            <Button
                                size={compact ? "sm" : "default"}
                                variant="ghost"
                                onClick={onNext}
                                className="text-white hover:text-gray-200"
                            >
                                <SkipForward className="w-4 h-4" />
                            </Button>
                        )}
                    </>
                )}

                {/* Volume Control */}
                {showVolumeControl && !compact && (
                    <div className="flex items-center space-x-2 ml-4">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onMuteToggle}
                            className="text-white hover:text-gray-200"
                        >
                            {muted || volume === 0 ? (
                                <VolumeX className="w-4 h-4" />
                            ) : (
                                <Volume2 className="w-4 h-4" />
                            )}
                        </Button>
                        <div className="w-16">
                            <Slider
                                value={[muted ? 0 : volume * 100]}
                                onValueChange={handleVolumeChange}
                                max={100}
                                step={1}
                                className="cursor-pointer"
                            />
                        </div>
                    </div>
                )}

                {/* Playback Rate */}
                {showPlaybackRate && !compact && (
                    <div className="ml-auto">
                        <Select
                            value={playbackRate.toString()}
                            onValueChange={(value) => onPlaybackRateChange(parseFloat(value))}
                        >
                            <SelectTrigger className="w-20 bg-transparent border-gray-600 text-white text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {playbackRateOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value.toString()}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Compact Volume and Playback Rate */}
            {compact && (showVolumeControl || showPlaybackRate) && (
                <div className="flex items-center justify-between">
                    {showVolumeControl && (
                        <div className="flex items-center space-x-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onMuteToggle}
                                className="text-white hover:text-gray-200"
                            >
                                {muted || volume === 0 ? (
                                    <VolumeX className="w-3 h-3" />
                                ) : (
                                    <Volume2 className="w-3 h-3" />
                                )}
                            </Button>
                            <div className="w-12">
                                <Slider
                                    value={[muted ? 0 : volume * 100]}
                                    onValueChange={handleVolumeChange}
                                    max={100}
                                    step={1}
                                    className="cursor-pointer"
                                />
                            </div>
                        </div>
                    )}

                    {showPlaybackRate && (
                        <Select
                            value={playbackRate.toString()}
                            onValueChange={(value) => onPlaybackRateChange(parseFloat(value))}
                        >
                            <SelectTrigger className="w-16 bg-transparent border-gray-600 text-white text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {playbackRateOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value.toString()}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            )}
        </div>
    );
}
