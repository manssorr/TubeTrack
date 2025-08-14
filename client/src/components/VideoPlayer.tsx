import ReactPlayer from "react-player";
import React, { useEffect, useRef, useState } from "react";

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
    onPlay?: () => void;
    onPause?: () => void;
    onProgress?: (state: {
        played: number;
        playedSeconds: number;
        loaded: number;
        loadedSeconds: number;
        duration?: number;
    }) => void;
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
    onPlay,
    onPause,
    onProgress,
    onError,
    className = "",
    style = {}
}: VideoPlayerProps) {
    const playerRef = useRef<any>(null);
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
                playerRef.current.seekTo(resumeTime, "seconds");
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
        if (playerRef.current) {
            const dur = playerRef.current.getDuration();
            setDuration(dur || 0);
        }
        onReady?.();
    };

    const handleProgress = (state: {
        played: number;
        playedSeconds: number;
        loaded: number;
        loadedSeconds: number;
        duration?: number;
    }) => {
        setCurrentTime(state.playedSeconds || 0);
        // Update duration if we don't have it yet
        if (!duration && playerRef.current) {
            const dur = playerRef.current.getDuration();
            if (dur) setDuration(dur);
        }
        onProgress?.(state);
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
                ref={playerRef}
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
                onPlay={onPlay}
                onPause={onPause}
                onProgress={handleProgress as any}
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
