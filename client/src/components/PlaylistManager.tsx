import { useState } from "react";
import { Download, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

import { usePlaylistImport, validatePlaylistInput } from "../lib/youtube";
import { usePlaylists, useVideos } from "../hooks/useLocalStorage";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";


export default function PlaylistManager() {
    const [playlistInput, setPlaylistInput] = useState("");
    const [importProgress, setImportProgress] = useState(0);

    const { addPlaylist } = usePlaylists();
    const { addVideos } = useVideos();

    const importMutation = usePlaylistImport();

    const handleImport = async () => {
        // Validate input
        const validation = validatePlaylistInput(playlistInput);
        if (!validation.isValid) {
            toast.error(validation.error || "Invalid playlist input");
            return;
        }

        try {
            setImportProgress(0);
            toast.loading("Starting playlist import...", { id: "import" });

            const result = await importMutation.mutateAsync(playlistInput);

            // Save playlist to local storage
            const playlist = {
                id: result.playlistId,
                title: result.playlistTitle,
                channelTitle: result.channelTitle,
                itemCount: result.totalVideos,
                importedAt: new Date().toISOString(),
            };

            addPlaylist(playlist);

            // Save videos to local storage
            const videos = result.videos.map(video => ({
                id: video.id,
                playlistId: result.playlistId,
                title: video.title,
                channelTitle: video.channelTitle,
                durationSec: video.durationSec,
                thumbnails: video.thumbnails,
                position: video.position,
            }));

            addVideos(videos);

            toast.success(
                `Successfully imported ${result.importedVideos} videos from "${result.playlistTitle}"`,
                { id: "import", duration: 5000 }
            );

            setPlaylistInput("");
            setImportProgress(100);

        } catch (error) {
            console.error("Import failed:", error);
            toast.error(
                error instanceof Error ? error.message : "Failed to import playlist",
                { id: "import", duration: 6000 }
            );
        }
    };

    const isImporting = importMutation.isPending;
    const validation = validatePlaylistInput(playlistInput);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Import Playlist
                </CardTitle>
                <CardDescription>
                    Paste a YouTube playlist URL or ID to import all videos
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-3">
                    <div className="flex-1 space-y-2">
                        <Input
                            placeholder="https://www.youtube.com/playlist?list=... or playlist ID"
                            value={playlistInput}
                            onChange={(e) => setPlaylistInput(e.target.value)}
                            disabled={isImporting}
                            className={validation.error && playlistInput ? "border-destructive" : ""}
                            data-testid="playlist-input"
                        />
                        {validation.error && playlistInput && (
                            <p className="text-sm text-destructive flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                {validation.error}
                            </p>
                        )}
                    </div>
                    <Button
                        onClick={handleImport}
                        disabled={isImporting || !validation.isValid}
                        className="min-w-[100px]"
                        data-testid="import-button"
                    >
                        {isImporting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Importing...
                            </>
                        ) : (
                            "Import"
                        )}
                    </Button>
                </div>

                {/* Import Progress */}
                {isImporting && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Fetching playlist data and video details...
                        </div>
                        <Progress value={importProgress} />
                    </div>
                )}

                {/* Example URLs */}
                <div className="text-xs text-muted-foreground space-y-1">
                    <p>Example formats:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>https://www.youtube.com/playlist?list=PLrAXtmRdnEQy4rCWOMxvr9v5YNr1xJD5W</li>
                        <li>PLrAXtmRdnEQy4rCWOMxvr9v5YNr1xJD5W</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
