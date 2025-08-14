import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export default function Home() {
    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome to TubeTrack</h1>
                <p className="text-lg text-muted-foreground">
                    Track your YouTube learning progress with playlists, notes, and analytics
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            📚 Import Playlists
                        </CardTitle>
                        <CardDescription>
                            Add YouTube playlists to track your learning progress
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Paste any YouTube playlist URL and we'll import all videos with metadata.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            🎯 Track Progress
                        </CardTitle>
                        <CardDescription>
                            Watch videos and automatically track completion
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Your watch time and progress are saved automatically as you learn.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            📝 Take Notes
                        </CardTitle>
                        <CardDescription>
                            Write markdown notes with timestamps
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Add timestamped notes that link directly to video moments.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            📊 View Analytics
                        </CardTitle>
                        <CardDescription>
                            See your learning patterns and progress
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Track watch time, completion rates, and learning streaks.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            🎮 Keyboard Shortcuts
                        </CardTitle>
                        <CardDescription>
                            Navigate efficiently with hotkeys
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Use spacebar, arrow keys, and more to control video playback.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            🌙 Dark Mode
                        </CardTitle>
                        <CardDescription>
                            Switch between light and dark themes
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Choose your preferred theme or follow system settings.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}