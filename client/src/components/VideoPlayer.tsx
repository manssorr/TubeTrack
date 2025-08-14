import ReactPlayer from "react-player";
import React, { useEffect, useRef, useState, useCallback } from "react";

import { useProgressTracker } from "@/hooks/useProgressTracker";

interface VideoPlayerProps {
    videoId: string;

    // Player state props
    playing?: boolean;
    volume?: number | null;
    muted?: boolean;
    playbackRate?: number;
    loop?: boolean;
    controls?: boolean;
    light?: boolean | string;
    pip?: boolean;
    resumeFromLastPosition?: boolean;

    // Dimensions
    width?: string | number;
    height?: string | number;

    // Callback props
    onVideoEnd?: () => void;
    onReady?: () => void;
    onStart?: () => void;
    onPlay?: () => void;
    onPause?: () => void;
    onTimeUpdate?: (currentTime: number) => void;
    onDurationChange?: (duration: number) => void;
    onError?: (error: unknown) => void;

    // Styling
    className?: string;
    style?: React.CSSProperties;
}

export default function VideoPlayer({
    videoId,
    playing,
    volume,
    muted = false,
    playbackRate = 1,
    loop = false,
    controls = true,
    light = false,
    pip = false,
    resumeFromLastPosition = true,
    width = "100%",
    height = "100%",
    onVideoEnd,
    onReady,
    onStart,
    onPlay,
    onPause,
    onTimeUpdate,
    onDurationChange,
    onError,
    className = "",
    style = {}
}: VideoPlayerProps) {
    const playerRef = useRef<HTMLVideoElement | null>(null);

    const setPlayerRef = useCallback((player: HTMLVideoElement) => {
        if (!player) return;
        playerRef.current = player;
    }, []);
    const hasResumedRef = useRef(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isReady, setIsReady] = useState(false);

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Progress tracking
    const { getResumeTime } = useProgressTracker({
        videoId,
        duration,
        currentTime,
        isPlaying: playing ?? false,
        isReady,
    });

    // Auto-resume from last position
    useEffect(() => {
        if (isReady && resumeFromLastPosition && !hasResumedRef.current && duration > 0) {
            const resumeTime = getResumeTime();
            if (resumeTime > 0 && playerRef.current) {
                console.log(`Resuming video ${videoId} from ${resumeTime}s`);
                // For ReactPlayer, seek using currentTime
                playerRef.current.currentTime = resumeTime;
            }
            hasResumedRef.current = true;
        }
    }, [isReady, resumeFromLastPosition, getResumeTime, videoId, duration]);

    // Reset resume flag when video changes
    useEffect(() => {
        hasResumedRef.current = false;
        setIsReady(false);
        setCurrentTime(0);
        setDuration(0);
    }, [videoId]);

    const handleReady = () => {
        setIsReady(true);
        onReady?.();
    };

    const handleStart = () => {
        onStart?.();
    };

    const handleTimeUpdate = () => {
        const player = playerRef.current;
        if (!player) return;

        const currentTime = player.currentTime;
        setCurrentTime(currentTime);
        onTimeUpdate?.(currentTime);
    };

    const handleProgress = () => {
        const player = playerRef.current;
        if (!player || !player.buffered?.length) return;

        // This is for loading progress, not playback progress
        console.log('onProgress - loading');
    };

    const handleDurationChange = () => {
        const player = playerRef.current;
        if (!player) return;

        console.log('onDurationChange', player.duration);
        const dur = player.duration;
        if (dur && dur > 0) {
            setDuration(dur);
            onDurationChange?.(dur);
        }
    };

    const handleError = (error: unknown) => {
        console.error('Video player error:', error);
        onError?.(error);
    };

    return (
        <div
            className={`bg-black rounded-lg overflow-hidden relative aspect-video ${className}`}
            style={style}
        >
            <ReactPlayer
                ref={setPlayerRef}
                src={videoUrl}
                playing={playing ?? false}
                volume={volume ?? 1}
                muted={muted}
                playbackRate={playbackRate}
                loop={loop}
                controls={controls}
                light={light}
                pip={pip ?? false}
                width={width}
                height={height}
                onReady={handleReady}
                onStart={handleStart}
                onPlay={onPlay}
                onPause={onPause}
                onTimeUpdate={handleTimeUpdate}
                onProgress={handleProgress}
                onDurationChange={handleDurationChange}
                onEnded={onVideoEnd}
                onError={handleError}
            />

            {/* Loading state */}
            {!isReady && (
                <div className="absolute inset-0 bg-black flex items-center justify-center">
                    <div className="text-white text-lg">Loading player...</div>
                </div>
            )}

            {/* Debug info in development */}
            {process.env.NODE_ENV === "development" && isReady && (
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-2 rounded">
                    <div>Playing: {playing ? "Yes" : "No"}</div>
                    <div>Time: {Math.round(currentTime)}s / {Math.round(duration)}s</div>
                    <div>Progress: {duration > 0 ? Math.round((currentTime / duration) * 100) : 0}%</div>
                </div>
            )}
        </div>
    );
}
