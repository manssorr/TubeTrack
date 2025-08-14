import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./components/ThemeProvider.tsx";
import AppHeader from "./components/AppHeader.tsx";
import Home from "./pages/Home.tsx";
import Playlists from "./pages/Playlists.tsx";
import VideoPlayerPage from "./pages/VideoPlayer.tsx";
import Analytics from "./pages/Analytics.tsx";
import NotFound from "./pages/NotFound.tsx";

function App() {
    return (
        <ThemeProvider defaultTheme="system" storageKey="tubetrack-ui-theme">
            <div className="min-h-screen bg-background">
                <Routes>
                    {/* Video Player Route (full screen, no header) */}
                    <Route path="/video/:videoId" element={<VideoPlayerPage />} />

                    {/* Main Routes (with header) */}
                    <Route path="/" element={
                        <>
                            <AppHeader />
                            <main>
                                <Home />
                            </main>
                        </>
                    } />
                    <Route path="/playlists" element={
                        <>
                            <AppHeader />
                            <main>
                                <Playlists />
                            </main>
                        </>
                    } />
                    <Route path="/analytics" element={
                        <>
                            <AppHeader />
                            <main>
                                <Analytics />
                            </main>
                        </>
                    } />
                    <Route path="*" element={
                        <>
                            <AppHeader />
                            <main>
                                <NotFound />
                            </main>
                        </>
                    } />
                </Routes>

                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: 'hsl(var(--background))',
                            color: 'hsl(var(--foreground))',
                            border: '1px solid hsl(var(--border))',
                        },
                    }}
                />
            </div>
        </ThemeProvider>
    );
}

export default App;