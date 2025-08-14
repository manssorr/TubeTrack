import PlaylistManager from "../components/PlaylistManager";

export default function Playlists() {
    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight mb-2">Playlists</h1>
                <p className="text-lg text-muted-foreground">
                    Import and manage your YouTube learning playlists
                </p>
            </div>

            <PlaylistManager />
        </div>
    );
}
