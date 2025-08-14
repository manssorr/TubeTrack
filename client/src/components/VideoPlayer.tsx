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
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <ReactPlayer
                {...{
                    url: videoUrl,
                    width: "100%",
                    height: "100%",
                    controls: true,
                    onEnded: onVideoEnd,
                    onError: (error: any) => {
                        console.error('Video player error:', error);
                    }
                } as any}
            />
        </div>
    );
}
