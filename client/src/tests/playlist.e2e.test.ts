import { test, expect } from "@playwright/test";

test.describe("Playlist Management E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Start with clean state
    await page.goto("http://localhost:5173");

    // Clear local storage
    await page.evaluate(() => {
      localStorage.clear();
    });

    await page.reload();
  });

  test("should import a playlist and display playlist name correctly", async ({ page }) => {
    // Wait for the page to load
    await expect(page.locator("main h1")).toContainText("Welcome to TubeTrack");

    // Mock the API response for playlist import
    await page.route("http://localhost:5174/api/import", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          playlistId: "PLrAXtmRdnEQy6nuLMV6Tmi0u-FGMxYh4Z",
          playlistTitle: "Test React Playlist - E2E Test",
          channelTitle: "React Test Channel",
          totalVideos: 3,
          importedVideos: 3,
          videos: [
            {
              id: "test-video-1",
              title: "Test Video 1",
              channelTitle: "React Test Channel",
              durationSec: 300,
              position: 0,
              thumbnails: {
                default: { url: "https://example.com/thumb1.jpg", width: 120, height: 90 },
              },
            },
            {
              id: "test-video-2",
              title: "Test Video 2",
              channelTitle: "React Test Channel",
              durationSec: 450,
              position: 1,
              thumbnails: {
                default: { url: "https://example.com/thumb2.jpg", width: 120, height: 90 },
              },
            },
            {
              id: "test-video-3",
              title: "Test Video 3",
              channelTitle: "React Test Channel",
              durationSec: 600,
              position: 2,
              thumbnails: {
                default: { url: "https://example.com/thumb3.jpg", width: 120, height: 90 },
              },
            },
          ],
        }),
      });
    });

    // Find and fill the playlist input
    const playlistInput = page.locator('input[placeholder*="playlist"]');
    await playlistInput.fill(
      "https://www.youtube.com/playlist?list=PLrAXtmRdnEQy6nuLMV6Tmi0u-FGMxYh4Z"
    );

    // Click import button
    await page.locator("button", { hasText: "Import" }).click();

    // Wait for import to complete
    await expect(page.locator("text=Successfully imported")).toBeVisible({ timeout: 10000 });

    // Verify playlist name is displayed correctly (NOT the ID)
    await expect(page.locator("text=Test React Playlist - E2E Test")).toBeVisible();

    // Verify we don't see the playlist ID displayed anywhere visible to users
    await expect(page.locator("text=PLrAXtmRdnEQy6nuLMV6Tmi0u-FGMxYh4Z")).not.toBeVisible();

    // Verify playlist stats are shown
    await expect(page.locator("text=3 videos")).toBeVisible();
    await expect(page.locator("text=React Test Channel")).toBeVisible();

    // Verify the playlist appears in the "Your Learning Playlists" section
    const playlistSection = page.locator("text=Your Learning Playlists").locator("..");
    await expect(playlistSection).toBeVisible();

    // The playlist title should be visible in the playlist card
    await expect(playlistSection.locator("text=Test React Playlist - E2E Test")).toBeVisible();
  });

  test("should delete a playlist and update UI immediately", async ({ page }) => {
    // First import a playlist
    await page.route("http://localhost:5174/api/import", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          playlistId: "test-delete-playlist",
          playlistTitle: "Playlist to Delete",
          channelTitle: "Test Channel",
          totalVideos: 1,
          importedVideos: 1,
          videos: [
            {
              id: "test-video",
              title: "Test Video",
              channelTitle: "Test Channel",
              durationSec: 300,
              position: 0,
              thumbnails: {
                default: { url: "https://example.com/thumb.jpg", width: 120, height: 90 },
              },
            },
          ],
        }),
      });
    });

    const playlistInput = page.locator('input[placeholder*="playlist"]');
    await playlistInput.fill(
      "https://www.youtube.com/playlist?list=PLrAXtmRdnEQy6nuLMV6Tmi0u-FGMxYh4Z"
    );
    await page.locator("button", { hasText: "Import" }).click();
    await expect(page.locator("text=Successfully imported")).toBeVisible({ timeout: 10000 });

    // Verify playlist is visible
    await expect(page.locator("text=Playlist to Delete")).toBeVisible();

    // Mock the confirmation dialog
    page.on("dialog", dialog => dialog.accept());

    // Find and click delete button
    const deleteButton = page.locator('[data-testid="delete-playlist"]').or(
      page
        .locator("button")
        .filter({ has: page.locator("svg") })
        .nth(0) // trash icon
    );
    await deleteButton.click();

    // Verify playlist is removed from UI immediately (no refresh needed)
    await expect(page.locator("text=Playlist to Delete")).not.toBeVisible();
    await expect(page.locator("text=Ready to Start Learning?")).toBeVisible();
  });

  test("should navigate between home and playlists pages with different content", async ({
    page,
  }) => {
    // Go to home page
    await page.goto("http://localhost:5173");
    await expect(page.locator("main h1")).toContainText("Welcome to TubeTrack");

    // Navigate to playlists page
    await page.locator('a[href="/playlists"]').first().click();
    await expect(page.url()).toContain("/playlists");

    // Verify we're on a different page with different content
    await expect(page.locator("main h1")).toContainText("Learning Analytics");

    // Should not contain the "Welcome to TubeTrack" heading
    await expect(page.locator("text=Welcome to TubeTrack")).not.toBeVisible();

    // Navigate back to home
    await page.locator('a[href="/"]').first().click();
    await expect(page.locator("main h1")).toContainText("Welcome to TubeTrack");
  });

  test("should show playlist progress and completion stats correctly", async ({ page }) => {
    // Import a playlist
    await page.route("http://localhost:5174/api/import", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          playlistId: "progress-test-playlist",
          playlistTitle: "Progress Test Playlist",
          channelTitle: "Progress Channel",
          totalVideos: 2,
          importedVideos: 2,
          videos: [
            {
              id: "progress-video-1",
              title: "Progress Video 1",
              channelTitle: "Progress Channel",
              durationSec: 100,
              position: 0,
              thumbnails: {
                default: { url: "https://example.com/thumb1.jpg", width: 120, height: 90 },
              },
            },
            {
              id: "progress-video-2",
              title: "Progress Video 2",
              channelTitle: "Progress Channel",
              durationSec: 200,
              position: 1,
              thumbnails: {
                default: { url: "https://example.com/thumb2.jpg", width: 120, height: 90 },
              },
            },
          ],
        }),
      });
    });

    const playlistInput = page.locator('input[placeholder*="playlist"]');
    await playlistInput.fill("https://www.youtube.com/playlist?list=PLprogress");
    await page.locator("button", { hasText: "Import" }).click();
    await expect(page.locator("text=Successfully imported")).toBeVisible({ timeout: 10000 });

    // Expand playlist to see details
    const playlistCard = page.locator("text=Progress Test Playlist").locator("..");
    await playlistCard.locator("button").last().click(); // expand button

    // Verify initial state shows 0% complete and "Not Started" badges
    await expect(page.locator("text=0% Complete")).toBeVisible();
    await expect(page.locator("text=2 Not Started")).toBeVisible();

    // Verify playlist name is shown, not ID
    await expect(page.locator("text=Progress Test Playlist")).toBeVisible();
    await expect(page.locator("text=progress-test-playlist")).not.toBeVisible();
  });
});
