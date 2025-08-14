import { test, expect } from "@playwright/test";

test.describe("Video Player E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Start with clean state
    await page.goto("http://localhost:5173");

    // Clear local storage
    await page.evaluate(() => {
      localStorage.clear();
    });

    await page.reload();
  });

  test("should load and play video player correctly", async ({ page }) => {
    // Mock the import API to create test data
    await page.route("http://localhost:5174/api/import", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          playlistId: "video-test-playlist",
          playlistTitle: "Video Test Playlist",
          channelTitle: "Video Test Channel",
          totalVideos: 1,
          importedVideos: 1,
          videos: [
            {
              id: "dQw4w9WgXcQ", // Rick Roll - known working YouTube video
              title: "Test Video for Player",
              channelTitle: "Video Test Channel",
              durationSec: 212,
              position: 0,
              thumbnails: {
                default: {
                  url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg",
                  width: 120,
                  height: 90,
                },
                medium: {
                  url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
                  width: 320,
                  height: 180,
                },
              },
            },
          ],
        }),
      });
    });

    // Import a playlist first
    const playlistInput = page.locator('input[placeholder*="playlist"]');
    await playlistInput.fill("https://www.youtube.com/playlist?list=PLvideotestplaylist");
    await page.locator("button", { hasText: "Import" }).click();
    await expect(page.locator("text=Successfully imported")).toBeVisible({ timeout: 10000 });

    // Expand the playlist
    const playlistCard = page.locator("text=Video Test Playlist").locator("..");
    await playlistCard.locator("button").last().click(); // expand button

    // Wait for video list to appear
    await expect(page.locator("text=Test Video for Player")).toBeVisible();

    // Click on the video to open player
    const videoItem = page.locator("text=Test Video for Player").locator("..");
    await videoItem.click();

    // Should navigate to video player page
    await expect(page.url()).toContain("/video/dQw4w9WgXcQ");

    // Wait for React Player iframe to load
    const reactPlayer = page.locator("iframe").first();
    await expect(reactPlayer).toBeVisible({ timeout: 15000 });

    // Verify video info is displayed
    await expect(page.locator("text=Test Video for Player")).toBeVisible();
    await expect(page.locator("text=Video Test Channel")).toBeVisible();
    await expect(page.locator("text=#1 in playlist")).toBeVisible();

    // Verify playlist info is shown
    await expect(page.locator("text=From Playlist")).toBeVisible();
    await expect(page.locator("text=Video Test Playlist")).toBeVisible();

    // Test navigation buttons
    await expect(page.locator('[title="Previous video"]')).toBeDisabled(); // First video
    await expect(page.locator('[title="Next video"]')).toBeDisabled(); // Only one video
  });

  test("should show loading state and handle errors gracefully", async ({ page }) => {
    // Go directly to a video URL that doesn't exist
    await page.goto("http://localhost:5173/video/nonexistent-video");

    // Should show "Video Not Found" message
    await expect(page.locator("text=Video Not Found")).toBeVisible();
    await expect(page.locator("text=Go Home")).toBeVisible();

    // Click "Go Home" button
    await page.locator("text=Go Home").click();
    await expect(page.url()).toBe("http://localhost:5173/");
  });

  test("should show empty state when no playlists are imported", async ({ page }) => {
    // Wait for page to load and ensure no playlists exist
    await expect(page.locator("main h1")).toContainText("Welcome to TubeTrack");

    // When no playlists are imported, should show empty state
    await expect(page.locator("text=Ready to Start Learning?")).toBeVisible();
    await expect(page.locator("text=Import your first YouTube playlist")).toBeVisible();
  });

  test("should handle React Player errors gracefully", async ({ page }) => {
    // Go to a video page with invalid video ID
    await page.goto("http://localhost:5173/video/invalid-video-id");

    // Should show "Video Not Found" message since the video doesn't exist in storage
    await expect(page.locator("text=Video Not Found")).toBeVisible();
    await expect(page.locator("text=Go Home")).toBeVisible();
  });

  test("should navigate between videos in a playlist", async ({ page }) => {
    // Mock playlist with multiple videos
    await page.route("http://localhost:5174/api/import", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          playlistId: "multi-video-playlist",
          playlistTitle: "Multi Video Playlist",
          channelTitle: "Multi Video Channel",
          totalVideos: 3,
          importedVideos: 3,
          videos: [
            {
              id: "dQw4w9WgXcQ",
              title: "First Video",
              channelTitle: "Multi Video Channel",
              durationSec: 100,
              position: 0,
              thumbnails: { default: { url: "https://example.com/1.jpg", width: 120, height: 90 } },
            },
            {
              id: "ScMzIvxBSi4",
              title: "Second Video",
              channelTitle: "Multi Video Channel",
              durationSec: 200,
              position: 1,
              thumbnails: { default: { url: "https://example.com/2.jpg", width: 120, height: 90 } },
            },
            {
              id: "Mc74_yTAK3Y",
              title: "Third Video",
              channelTitle: "Multi Video Channel",
              durationSec: 300,
              position: 2,
              thumbnails: { default: { url: "https://example.com/3.jpg", width: 120, height: 90 } },
            },
          ],
        }),
      });
    });

    // Import playlist
    const playlistInput = page.locator('input[placeholder*="playlist"]');
    await playlistInput.fill("https://www.youtube.com/playlist?list=PLmultivideo");
    await page.locator("button", { hasText: "Import" }).click();
    await expect(page.locator("text=Successfully imported")).toBeVisible({ timeout: 10000 });

    // Expand and select first video
    const playlistCard = page.locator("text=Multi Video Playlist").locator("..");
    await playlistCard.locator("button").last().click();
    await page.locator("text=First Video").click();

    // Should be on first video
    await expect(page.url()).toContain("/video/dQw4w9WgXcQ");
    await expect(page.locator("text=First Video")).toBeVisible();
    await expect(page.locator("text=#1 in playlist")).toBeVisible();

    // Previous button should be disabled, next should be enabled
    await expect(page.locator('[title="Previous video"]')).toBeDisabled();
    await expect(page.locator('[title="Next video"]')).toBeEnabled();

    // Navigate to next video
    await page.locator('[title="Next video"]').click();
    await expect(page.url()).toContain("/video/ScMzIvxBSi4");
    await expect(page.locator("text=Second Video")).toBeVisible();
    await expect(page.locator("text=#2 in playlist")).toBeVisible();

    // Both navigation buttons should be enabled
    await expect(page.locator('[title="Previous video"]')).toBeEnabled();
    await expect(page.locator('[title="Next video"]')).toBeEnabled();

    // Navigate to previous video
    await page.locator('[title="Previous video"]').click();
    await expect(page.url()).toContain("/video/dQw4w9WgXcQ");
    await expect(page.locator("text=First Video")).toBeVisible();
  });

  test("should show playlist sidebar and allow video selection", async ({ page }) => {
    // Mock playlist with multiple videos (reuse from previous test)
    await page.route("http://localhost:5174/api/import", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          playlistId: "sidebar-test-playlist",
          playlistTitle: "Sidebar Test Playlist",
          channelTitle: "Sidebar Channel",
          totalVideos: 2,
          importedVideos: 2,
          videos: [
            {
              id: "jNQXAC9IVRw",
              title: "Sidebar Video 1",
              channelTitle: "Sidebar Channel",
              durationSec: 150,
              position: 0,
              thumbnails: {
                default: { url: "https://example.com/s1.jpg", width: 120, height: 90 },
              },
            },
            {
              id: "ZZ5LpwO-An4",
              title: "Sidebar Video 2",
              channelTitle: "Sidebar Channel",
              durationSec: 250,
              position: 1,
              thumbnails: {
                default: { url: "https://example.com/s2.jpg", width: 120, height: 90 },
              },
            },
          ],
        }),
      });
    });

    // Import and navigate to first video
    const playlistInput = page.locator('input[placeholder*="playlist"]');
    await playlistInput.fill("https://www.youtube.com/playlist?list=PLsidebar");
    await page.locator("button", { hasText: "Import" }).click();
    await expect(page.locator("text=Successfully imported")).toBeVisible({ timeout: 10000 });

    const playlistCard = page.locator("text=Sidebar Test Playlist").locator("..");
    await playlistCard.locator("button").last().click();
    await page.locator("text=Sidebar Video 1").click();

    // Should be on video player page
    await expect(page.url()).toContain("/video/jNQXAC9IVRw");

    // Toggle playlist sidebar
    await page.locator("button", { hasText: "Playlist" }).click();

    // Sidebar should show playlist info
    await expect(page.locator("text=Playlist (1/2)")).toBeVisible();

    // Should show both videos in sidebar
    await expect(page.locator("text=Sidebar Video 1")).toBeVisible();
    await expect(page.locator("text=Sidebar Video 2")).toBeVisible();

    // First video should be highlighted as current
    const firstVideoInSidebar = page.locator("text=Sidebar Video 1").locator("..");
    await expect(firstVideoInSidebar).toHaveClass(/bg-primary/);

    // Click second video in sidebar
    await page.locator("text=Sidebar Video 2").click();

    // Should navigate to second video
    await expect(page.url()).toContain("/video/ZZ5LpwO-An4");
    await expect(page.locator("text=Sidebar Video 2")).toBeVisible();
  });
});
