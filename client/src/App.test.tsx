import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";

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
        const { getByText } = render(
            <TestWrapper>
                <App />
            </TestWrapper>
        );

        // Check that the main heading is present
        expect(getByText("Welcome to TubeTrack")).toBeDefined();

        // Check that some feature cards are present (including emojis)
        expect(getByText("📚 Import Playlists")).toBeDefined();
        expect(getByText("🎯 Track Progress")).toBeDefined();
        expect(getByText("📝 Take Notes")).toBeDefined();
    });

    it("renders the app header", () => {
        const { getByText, getAllByText } = render(
            <TestWrapper>
                <App />
            </TestWrapper>
        );

        // Check that the header is present
        expect(getByText("TubeTrack")).toBeDefined();

        // Check navigation links (using getAllBy since there are desktop + mobile versions)
        expect(getAllByText("Home")).toHaveLength(2); // Desktop + mobile
        expect(getAllByText("Playlists")).toHaveLength(2);
        expect(getAllByText("Analytics")).toHaveLength(2);
    });

    it("has theme toggle functionality", () => {
        const { getByRole } = render(
            <TestWrapper>
                <App />
            </TestWrapper>
        );

        // Theme toggle button should be present
        const themeButton = getByRole("button");
        expect(themeButton).toBeDefined();
    });
});
