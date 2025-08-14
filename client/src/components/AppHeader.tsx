import { Moon, Sun, Monitor, Youtube } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "./ThemeProvider";

function AppHeader() {
    const { theme, setTheme } = useTheme();

    const cycleTheme = () => {
        if (theme === "light") {
            setTheme("dark");
        } else if (theme === "dark") {
            setTheme("system");
        } else {
            setTheme("light");
        }
    };

    const getThemeIcon = () => {
        switch (theme) {
            case "light":
                return <Sun className="h-4 w-4" />;
            case "dark":
                return <Moon className="h-4 w-4" />;
            default:
                return <Monitor className="h-4 w-4" />;
        }
    };

    const getThemeLabel = () => {
        switch (theme) {
            case "light":
                return "Light";
            case "dark":
                return "Dark";
            default:
                return "System";
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Youtube className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold">TubeTrack</h1>
                </div>

                <nav className="hidden md:flex items-center gap-6">
                    <a
                        href="/"
                        className="text-sm font-medium hover:text-primary transition-colors"
                    >
                        Home
                    </a>
                    <a
                        href="/playlists"
                        className="text-sm font-medium hover:text-primary transition-colors"
                    >
                        Playlists
                    </a>
                    <a
                        href="/analytics"
                        className="text-sm font-medium hover:text-primary transition-colors"
                    >
                        Analytics
                    </a>
                </nav>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={cycleTheme}
                        title={`Current theme: ${getThemeLabel()}. Click to cycle themes.`}
                    >
                        {getThemeIcon()}
                    </Button>
                </div>
            </div>

            {/* Mobile navigation */}
            <div className="md:hidden border-t px-4 py-2">
                <nav className="flex items-center justify-center gap-4">
                    <a
                        href="/"
                        className="text-sm font-medium hover:text-primary transition-colors"
                    >
                        Home
                    </a>
                    <a
                        href="/playlists"
                        className="text-sm font-medium hover:text-primary transition-colors"
                    >
                        Playlists
                    </a>
                    <a
                        href="/analytics"
                        className="text-sm font-medium hover:text-primary transition-colors"
                    >
                        Analytics
                    </a>
                </nav>
            </div>
        </header>
    );
}

export default AppHeader;
