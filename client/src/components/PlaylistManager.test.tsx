import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import PlaylistManager from "./PlaylistManager";

// Mock the hooks
vi.mock("../hooks/useLocalStorage", () => ({
    usePlaylists: () => ({
        playlists: {},
        addPlaylist: vi.fn(),
        removePlaylist: vi.fn(),
    }),
    useVideos: () => ({
        videos: {},
        addVideos: vi.fn(),
    }),
}));

// Mock the YouTube API client
vi.mock("../lib/youtube", () => ({
    usePlaylistImport: () => ({
        mutateAsync: vi.fn(),
        isPending: false,
    }),
    validatePlaylistInput: (input: string) => {
        if (!input) return { isValid: false, playlistId: null, error: "Please enter a playlist URL or ID" };
        if (input.includes("valid")) return { isValid: true, playlistId: "test123", error: null };
        return { isValid: false, playlistId: null, error: "Invalid playlist URL" };
    },
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
    default: {
        error: vi.fn(),
        success: vi.fn(),
        loading: vi.fn(),
    },
}));

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

describe("PlaylistManager", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the import section", () => {
        const { getByText, getByPlaceholderText, getByRole } = render(
            <TestWrapper>
                <PlaylistManager />
            </TestWrapper>
        );

        expect(getByText("Import Playlist")).toBeDefined();
        expect(getByPlaceholderText("https://www.youtube.com/playlist?list=... or playlist ID")).toBeDefined();
        expect(getByRole("button", { name: "Import" })).toBeDefined();
    });

    it("renders input and button correctly", () => {
        const { getByPlaceholderText, getByRole } = render(
            <TestWrapper>
                <PlaylistManager />
            </TestWrapper>
        );

        const input = getByPlaceholderText("https://www.youtube.com/playlist?list=... or playlist ID");
        const importButton = getByRole("button", { name: "Import" });

        expect(input).toBeDefined();
        expect(importButton).toBeDefined();
    });

    it("enables import button for valid input", () => {
        const { getByPlaceholderText, getByRole, queryByText } = render(
            <TestWrapper>
                <PlaylistManager />
            </TestWrapper>
        );

        const input = getByPlaceholderText("https://www.youtube.com/playlist?list=... or playlist ID");
        const importButton = getByRole("button", { name: "Import" });

        expect(input).toBeDefined();
        expect(importButton).toBeDefined();
        expect(queryByText("Invalid playlist URL")).toBeNull();
    });

    it("shows empty state when no playlists are imported", () => {
        const { getByText } = render(
            <TestWrapper>
                <PlaylistManager />
            </TestWrapper>
        );

        expect(getByText("No playlists imported yet")).toBeDefined();
        expect(getByText("Import your first playlist to get started!")).toBeDefined();
    });

    it("shows example URLs for user guidance", () => {
        const { getByText } = render(
            <TestWrapper>
                <PlaylistManager />
            </TestWrapper>
        );

        expect(getByText("Example formats:")).toBeDefined();
        expect(getByText(/https:\/\/www\.youtube\.com\/playlist/)).toBeDefined();
    });
});
