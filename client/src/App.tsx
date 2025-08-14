import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./components/ThemeProvider.tsx";
import AppHeader from "./components/AppHeader.tsx";
import Home from "./pages/Home.tsx";
import Playlists from "./pages/Playlists.tsx";
import NotFound from "./pages/NotFound.tsx";

function App() {
    return (
        <ThemeProvider defaultTheme="system" storageKey="tubetrack-ui-theme">
            <div className="min-h-screen bg-background">
                <AppHeader />
                <main>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/playlists" element={<Playlists />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </main>

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
