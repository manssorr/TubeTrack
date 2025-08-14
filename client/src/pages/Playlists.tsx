import { BarChart3, Clock, TrendingUp, PlayCircle, Target, Award, Flame, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { usePlaylists, useVideos, useProgress, useNotes } from "../hooks/useLocalStorage";

// Analytics helper functions
function getStreakDays(progress: Record<string, any>) {
    // Simple streak calculation - days with any watch activity
    const dates = Object.values(progress)
        .map(p => p.lastWatchedAt)
        .filter(Boolean)
        .map(date => new Date(date).toDateString());

    const uniqueDates = [...new Set(dates)].sort();
    let streak = 0;
    // const today = new Date().toDateString(); // unused for now

    // Count consecutive days from today backwards
    for (let i = 0; i < uniqueDates.length; i++) {
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - i);
        if (uniqueDates.includes(currentDate.toDateString())) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

export default function Playlists() {
    const { playlists } = usePlaylists();
    const { videos, getVideosByPlaylist } = useVideos();
    const { progress, getVideoProgress } = useProgress();
    const { notes } = useNotes();

    const playlistsArray = Object.values(playlists).sort(
        (a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()
    );

    // Calculate comprehensive analytics
    const totalVideos = Object.keys(videos).length;
    const completedVideos = Object.values(progress).filter(p => p.completion >= 0.9).length;
    const inProgressVideos = Object.values(progress).filter(p => p.watchedSeconds > 0 && p.completion < 0.9).length;
    const totalWatchTime = Object.values(progress).reduce((sum, p) => sum + p.watchedSeconds, 0);
    const totalNotes = Object.keys(notes).length;
    const streakDays = getStreakDays(progress);

    const formatWatchTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m`;
        }
        return `${seconds}s`;
    };

    const completionRate = totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;

    // Playlist analytics
    const playlistAnalytics = playlistsArray.map(playlist => {
        const playlistVideos = getVideosByPlaylist(playlist.id);
        const playlistCompleted = playlistVideos.filter(v => {
            const prog = getVideoProgress(v.id);
            return prog.completion >= 0.9;
        }).length;
        const playlistWatchTime = playlistVideos.reduce((sum, v) => {
            const prog = getVideoProgress(v.id);
            return sum + prog.watchedSeconds;
        }, 0);
        const playlistTotalDuration = playlistVideos.reduce((sum, v) => sum + v.durationSec, 0);

        return {
            ...playlist,
            videoCount: playlistVideos.length,
            completedCount: playlistCompleted,
            completionRate: playlistVideos.length > 0 ? (playlistCompleted / playlistVideos.length) * 100 : 0,
            watchTime: playlistWatchTime,
            totalDuration: playlistTotalDuration,
        };
    });

    if (playlistsArray.length === 0) {
        return (
            <div className="container mx-auto py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Learning Analytics</h1>
                    <p className="text-lg text-muted-foreground">
                        Track your progress and insights
                    </p>
                </div>

                <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
                    <p className="mb-6">
                        Import some playlists and start learning to see your analytics!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight mb-2">Learning Analytics</h1>
                <p className="text-lg text-muted-foreground">
                    Track your progress, patterns, and achievements
                </p>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="flex items-center p-6">
                        <Target className="h-8 w-8 text-green-600 mr-3" />
                        <div>
                            <p className="text-2xl font-bold">{Math.round(completionRate)}%</p>
                            <p className="text-sm text-muted-foreground">Overall Completion</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center p-6">
                        <Clock className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                            <p className="text-2xl font-bold">{formatWatchTime(totalWatchTime)}</p>
                            <p className="text-sm text-muted-foreground">Total Watch Time</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center p-6">
                        <Flame className="h-8 w-8 text-orange-600 mr-3" />
                        <div>
                            <p className="text-2xl font-bold">{streakDays}</p>
                            <p className="text-sm text-muted-foreground">Day Streak</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center p-6">
                        <BookOpen className="h-8 w-8 text-purple-600 mr-3" />
                        <div>
                            <p className="text-2xl font-bold">{totalNotes}</p>
                            <p className="text-sm text-muted-foreground">Notes Created</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Progress Overview */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Progress Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Completed Videos</span>
                                <span>{completedVideos} / {totalVideos}</span>
                            </div>
                            <Progress value={completionRate} className="h-2" />
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{completedVideos}</p>
                                <p className="text-xs text-muted-foreground">Completed</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{inProgressVideos}</p>
                                <p className="text-xs text-muted-foreground">In Progress</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-600">{totalVideos - completedVideos - inProgressVideos}</p>
                                <p className="text-xs text-muted-foreground">Not Started</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="w-5 h-5" />
                            Achievements
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            {completedVideos >= 10 && (
                                <div className="flex items-center gap-3 p-2 bg-green-50 rounded">
                                    <Award className="w-6 h-6 text-green-600" />
                                    <div>
                                        <p className="font-medium text-sm">Video Master</p>
                                        <p className="text-xs text-muted-foreground">Completed 10+ videos</p>
                                    </div>
                                </div>
                            )}

                            {streakDays >= 3 && (
                                <div className="flex items-center gap-3 p-2 bg-orange-50 rounded">
                                    <Flame className="w-6 h-6 text-orange-600" />
                                    <div>
                                        <p className="font-medium text-sm">Streak Keeper</p>
                                        <p className="text-xs text-muted-foreground">{streakDays} day learning streak</p>
                                    </div>
                                </div>
                            )}

                            {totalNotes >= 5 && (
                                <div className="flex items-center gap-3 p-2 bg-purple-50 rounded">
                                    <BookOpen className="w-6 h-6 text-purple-600" />
                                    <div>
                                        <p className="font-medium text-sm">Note Taker</p>
                                        <p className="text-xs text-muted-foreground">{totalNotes} notes created</p>
                                    </div>
                                </div>
                            )}

                            {playlistsArray.length >= 5 && (
                                <div className="flex items-center gap-3 p-2 bg-blue-50 rounded">
                                    <PlayCircle className="w-6 h-6 text-blue-600" />
                                    <div>
                                        <p className="font-medium text-sm">Playlist Collector</p>
                                        <p className="text-xs text-muted-foreground">{playlistsArray.length} playlists imported</p>
                                    </div>
                                </div>
                            )}

                            {!(completedVideos >= 10 || streakDays >= 3 || totalNotes >= 5 || playlistsArray.length >= 5) && (
                                <p className="text-sm text-muted-foreground">
                                    Keep learning to unlock achievements!
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Playlist Analytics */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Playlist Breakdown
                    </CardTitle>
                    <CardDescription>
                        Detailed progress for each of your imported playlists
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {playlistAnalytics.map(playlist => (
                            <div key={playlist.id} className="border rounded-lg p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1 flex-1 min-w-0">
                                        <h3 className="font-medium line-clamp-2">{playlist.title}</h3>
                                        <p className="text-sm text-muted-foreground">{playlist.channelTitle}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-xs ml-4">
                                        {Math.round(playlist.completionRate)}% complete
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Progress</span>
                                        <span>{playlist.completedCount} / {playlist.videoCount} videos</span>
                                    </div>
                                    <Progress value={playlist.completionRate} className="h-1.5" />
                                </div>

                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Watch time: {formatWatchTime(playlist.watchTime)}</span>
                                    <span>Total duration: {formatWatchTime(playlist.totalDuration)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
