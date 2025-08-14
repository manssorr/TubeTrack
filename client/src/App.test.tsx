import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                {children}
            </BrowserRouter>
        </QueryClientProvider>
    );
}

describe("App", () => {
    it("renders the home page", () => {
        render(
            <TestWrapper>
                <App />
            </TestWrapper>
        );

        // Check that the main heading is present
        expect(screen.getByText("Welcome to TubeTrack")).toBeInTheDocument();

        // Check that some feature cards are present (including emojis)
        expect(screen.getByText("📚 Import Playlists")).toBeInTheDocument();
        expect(screen.getByText("🎯 Track Progress")).toBeInTheDocument();
        expect(screen.getByText("📝 Take Notes")).toBeInTheDocument();
    });

    it("renders the app header", () => {
        render(
            <TestWrapper>
                <App />
            </TestWrapper>
        );

        // Check that the header is present
        expect(screen.getByText("TubeTrack")).toBeInTheDocument();

        // Check navigation links (using getAllBy since there are desktop + mobile versions)
        expect(screen.getAllByText("Home")).toHaveLength(2); // Desktop + mobile
        expect(screen.getAllByText("Playlists")).toHaveLength(2);
        expect(screen.getAllByText("Analytics")).toHaveLength(2);
    });

    it("has theme toggle functionality", () => {
        render(
            <TestWrapper>
                <App />
            </TestWrapper>
        );

        // Theme toggle button should be present
        const themeButton = screen.getByRole("button");
        expect(themeButton).toBeInTheDocument();
    });
});
