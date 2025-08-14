import { useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
    Clock,
    PlayCircle,
    BookOpen,
    CheckCircle2,
    TrendingUp,
    Calendar,
    FileText,
    Tag,
    Target,
    Award,
    Activity
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MetricCard } from "./MetricCard";
import { Button } from "./ui/button";
import { useAnalytics } from "@/hooks/useAnalytics";



export function AnalyticsDashboard() {
    const { metrics, playlistAnalytics, dailyActivity, learningPatterns, isLoading } = useAnalytics();
    const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'all'>('month');

    if (isLoading) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading analytics...</p>
                </div>
            </div>
        );
    }



    const formatHours = (hours: number) => {
        if (hours < 1) {
            return `${Math.round(hours * 60)}m`;
        }
        return `${hours.toFixed(1)}h`;
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Learning Analytics</h1>
                <p className="text-muted-foreground">
                    Track your progress and discover your learning patterns
                </p>
            </div>

            {/* Time Range Filter */}
            <div className="flex gap-2">
                <Button
                    variant={selectedTimeRange === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTimeRange('week')}
                >
                    This Week
                </Button>
                <Button
                    variant={selectedTimeRange === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTimeRange('month')}
                >
                    This Month
                </Button>
                <Button
                    variant={selectedTimeRange === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTimeRange('all')}
                >
                    All Time
                </Button>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Watch Time"
                    value={formatHours(metrics.totalWatchedHours)}
                    subtitle={`${metrics.totalWatchedMinutes.toFixed(0)} minutes total`}
                    icon={<Clock className="w-4 h-4" />}
                    badge={{
                        text: `${metrics.daysActive} days active`,
                        variant: 'secondary'
                    }}
                />

                <MetricCard
                    title="Videos Completed"
                    value={metrics.completedVideos}
                    subtitle={`${(metrics.overallCompletionRate * 100).toFixed(1)}% completion rate`}
                    icon={<PlayCircle className="w-4 h-4" />}
                    trend={{
                        value: metrics.completedVideos,
                        label: `of ${metrics.completedVideos + metrics.inProgressVideos + metrics.notStartedVideos} total`,
                        direction: 'up'
                    }}
                />

                <MetricCard
                    title="Active Playlists"
                    value={metrics.activePlaylists}
                    subtitle={`${metrics.completedPlaylists} completed`}
                    icon={<BookOpen className="w-4 h-4" />}
                    badge={{
                        text: `${metrics.totalPlaylists} total`,
                        variant: 'outline'
                    }}
                />

                <MetricCard
                    title="Current Streak"
                    value={metrics.currentStreak}
                    subtitle={`${metrics.longestStreak} days longest`}
                    icon={<Award className="w-4 h-4" />}
                    trend={{
                        value: metrics.currentStreak,
                        label: metrics.currentStreak > 1 ? 'days' : 'day',
                        direction: metrics.currentStreak > 0 ? 'up' : 'neutral'
                    }}
                />

                <MetricCard
                    title="Notes Created"
                    value={metrics.totalNotes}
                    subtitle={`${metrics.notesPerVideo.toFixed(1)} per video avg`}
                    icon={<FileText className="w-4 h-4" />}
                />

                <MetricCard
                    title="Learning Velocity"
                    value={metrics.learningVelocity.toFixed(1)}
                    subtitle="videos per day"
                    icon={<TrendingUp className="w-4 h-4" />}
                    trend={{
                        value: Number(metrics.learningVelocity.toFixed(1)),
                        label: 'videos/day',
                        direction: metrics.learningVelocity > 0.5 ? 'up' : 'neutral'
                    }}
                />

                <MetricCard
                    title="Most Active Hour"
                    value={`${metrics.mostActiveHour}:00`}
                    subtitle="Peak learning time"
                    icon={<Activity className="w-4 h-4" />}
                />

                <MetricCard
                    title="Most Active Day"
                    value={metrics.mostActiveDay}
                    subtitle="Best learning day"
                    icon={<Calendar className="w-4 h-4" />}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Activity Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Daily Activity (Last 30 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={dailyActivity}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis />
                                <Tooltip
                                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                                    formatter={(value, name) => [
                                        name === 'watchTime' ? `${Math.round(Number(value))} min` : value,
                                        name === 'watchTime' ? 'Watch Time' :
                                            name === 'videosWatched' ? 'Videos' :
                                                name === 'completions' ? 'Completed' : 'Notes'
                                    ]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="watchTime"
                                    stackId="1"
                                    stroke="#8884d8"
                                    fill="#8884d8"
                                    fillOpacity={0.6}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Weekly Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Weekly Learning Pattern
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={learningPatterns.weeklyDistribution}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`${Math.round(Number(value))} min`, 'Watch Time']} />
                                <Bar dataKey="minutes" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Tags */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tag className="w-5 h-5" />
                            Most Used Tags
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {metrics.mostUsedTags.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={metrics.mostUsedTags.slice(0, 8)}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="tag" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [value, 'Uses']} />
                                    <Bar dataKey="count" fill="#ffc658" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                <div className="text-center">
                                    <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No tags found in your notes yet</p>
                                    <p className="text-sm">Start using #hashtags in your notes to see tag analytics</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Playlist Progress */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Playlist Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto">
                            {playlistAnalytics.length > 0 ? playlistAnalytics.map((playlist) => (
                                <div key={playlist.id} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium line-clamp-1">
                                            {playlist.title}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {(playlist.completionRate * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${playlist.completionRate * 100}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>{playlist.completedVideos}/{playlist.totalVideos} videos</span>
                                        <span>{playlist.notesCount} notes</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                                    <div className="text-center">
                                        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>No playlists imported yet</p>
                                        <p className="text-sm">Import a playlist to see progress analytics</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Video Progress Status Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Video Progress Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Completed', value: metrics.completedVideos, color: '#10b981' },
                                            { name: 'In Progress', value: metrics.inProgressVideos, color: '#f59e0b' },
                                            { name: 'Not Started', value: metrics.notStartedVideos, color: '#6b7280' },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        <Cell fill="#10b981" />
                                        <Cell fill="#f59e0b" />
                                        <Cell fill="#6b7280" />
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col justify-center space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 bg-emerald-500 rounded" />
                                <span className="text-sm">Completed: {metrics.completedVideos} videos</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 bg-yellow-500 rounded" />
                                <span className="text-sm">In Progress: {metrics.inProgressVideos} videos</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 bg-gray-500 rounded" />
                                <span className="text-sm">Not Started: {metrics.notStartedVideos} videos</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
