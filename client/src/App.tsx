import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider.tsx";
import AppHeader from "./components/AppHeader.tsx";
import Home from "./pages/Home.tsx";
import NotFound from "./pages/NotFound.tsx";

function App() {
    return (
        <ThemeProvider defaultTheme="system" storageKey="tubetrack-ui-theme">
            <div className="min-h-screen bg-background">
                <AppHeader />
                <main>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </main>
            </div>
        </ThemeProvider>
    );
}

export default App;
