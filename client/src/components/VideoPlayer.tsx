import ReactPlayer from "react-player";

interface VideoPlayerProps {
    videoId: string;
    onVideoEnd?: () => void;
    className?: string;
}

export default function VideoPlayer({
    videoId,
    onVideoEnd,
    className = ""
}: VideoPlayerProps) {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    return (
        <div className={`bg-black rounded-lg overflow-hidden ${className}`}>
            <ReactPlayer
                src={videoUrl}
                width="100%"
                height="100%"
                onEnded={onVideoEnd}
                onError={(error: unknown) => {
                    console.error('Video player error:', error);
                }}

            />
        </div>
    );
}
