import { useState } from "react";
import { Trash2, Download, Loader2, AlertCircle, CheckCircle, Calendar, Hash } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";

import { usePlaylistImport, validatePlaylistInput } from "../lib/youtube";
import { usePlaylists, useVideos } from "../hooks/useLocalStorage";


export default function PlaylistManager() {
    const [playlistInput, setPlaylistInput] = useState("");
    const [importProgress, setImportProgress] = useState(0);

    const { playlists, addPlaylist, removePlaylist } = usePlaylists();
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

    const handleDelete = (playlistId: string, playlistTitle: string) => {
        if (window.confirm(`Are you sure you want to delete "${playlistTitle}"? This will also remove all progress and notes for videos in this playlist.`)) {
            removePlaylist(playlistId);
            toast.success(`Deleted playlist "${playlistTitle}"`);
        }
    };

    const playlistArray = Object.values(playlists).sort(
        (a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()
    );

    const isImporting = importMutation.isPending;
    const validation = validatePlaylistInput(playlistInput);

    return (
        <div className="space-y-6">
            {/* Import Section */}
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

            {/* Playlists List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                        Your Playlists ({playlistArray.length})
                    </h3>
                    {playlistArray.length > 0 && (
                        <Badge variant="secondary">
                            {playlistArray.reduce((sum, p) => sum + p.itemCount, 0)} total videos
                        </Badge>
                    )}
                </div>

                {playlistArray.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center text-muted-foreground space-y-2">
                                <Download className="h-12 w-12 mx-auto opacity-50" />
                                <p>No playlists imported yet</p>
                                <p className="text-sm">Import your first playlist to get started!</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {playlistArray.map((playlist) => {
                            const importDate = new Date(playlist.importedAt);
                            return (
                                <Card key={playlist.id}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <CardTitle className="text-base line-clamp-2">
                                                    {playlist.title}
                                                </CardTitle>
                                                {playlist.channelTitle && (
                                                    <CardDescription>
                                                        by {playlist.channelTitle}
                                                    </CardDescription>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(playlist.id, playlist.title)}
                                                className="text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Hash className="h-4 w-4" />
                                                {playlist.itemCount} videos
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {importDate.toLocaleDateString()}
                                            </div>
                                            <Badge variant="outline" className="ml-auto">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Imported
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
