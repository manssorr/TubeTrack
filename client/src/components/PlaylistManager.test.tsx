import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
        render(
            <TestWrapper>
                <PlaylistManager />
            </TestWrapper>
        );

        expect(screen.getByText("Import Playlist")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("https://www.youtube.com/playlist?list=... or playlist ID")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Import" })).toBeInTheDocument();
    });

    it("renders input and button correctly", () => {
        render(
            <TestWrapper>
                <PlaylistManager />
            </TestWrapper>
        );

        const input = screen.getByPlaceholderText("https://www.youtube.com/playlist?list=... or playlist ID");
        const importButton = screen.getByRole("button", { name: "Import" });

        expect(input).toBeInTheDocument();
        expect(importButton).toBeInTheDocument();
    });

    it("enables import button for valid input", async () => {
        render(
            <TestWrapper>
                <PlaylistManager />
            </TestWrapper>
        );

        const input = screen.getByPlaceholderText("https://www.youtube.com/playlist?list=... or playlist ID");
        const importButton = screen.getByRole("button", { name: "Import" });

        // Test with valid input
        fireEvent.change(input, { target: { value: "valid-playlist-url" } });

        await waitFor(() => {
            expect(importButton).not.toBeDisabled();
        });

        expect(screen.queryByText("Invalid playlist URL")).not.toBeInTheDocument();
    });

    it("shows empty state when no playlists are imported", () => {
        render(
            <TestWrapper>
                <PlaylistManager />
            </TestWrapper>
        );

        expect(screen.getByText("No playlists imported yet")).toBeInTheDocument();
        expect(screen.getByText("Import your first playlist to get started!")).toBeInTheDocument();
    });

    it("shows example URLs for user guidance", () => {
        render(
            <TestWrapper>
                <PlaylistManager />
            </TestWrapper>
        );

        expect(screen.getByText("Example formats:")).toBeInTheDocument();
        expect(screen.getByText(/https:\/\/www\.youtube\.com\/playlist/)).toBeInTheDocument();
    });
});
