import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import express from "express";
import axios from "axios";

import routes from "./routes.js";

// Mock axios for API calls
vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedAxios = vi.mocked(axios);

// Test app setup
const app = express();
app.use(express.json());
app.use("/api", routes);

describe("Server Routes", () => {
  beforeAll(() => {
    // Set test environment variables
    process.env.YOUTUBE_API_KEY = "test-api-key";
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/api/health").expect(200);

      expect(response.body).toMatchObject({
        ok: true,
        uptime: expect.any(Number),
      });
    });
  });

  describe("GET /api/youtube/playlist/:playlistId/items", () => {
    it("should return playlist items", async () => {
      const mockYouTubeResponse = {
        data: {
          items: [
            {
              contentDetails: {
                videoId: "dQw4w9WgXcQ",
              },
              snippet: {
                title: "Never Gonna Give You Up",
                channelTitle: "Rick Astley",
                position: 0,
                thumbnails: {
                  default: { url: "https://example.com/thumb.jpg" },
                },
              },
            },
          ],
          nextPageToken: "NEXT_PAGE_TOKEN",
          pageInfo: {
            totalResults: 50,
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockYouTubeResponse);

      const response = await request(app).get("/api/youtube/playlist/PLtest123/items").expect(200);

      expect(response.body).toMatchObject({
        items: [
          {
            videoId: "dQw4w9WgXcQ",
            title: "Never Gonna Give You Up",
            channelTitle: "Rick Astley",
            position: 0,
            thumbnails: {
              default: { url: "https://example.com/thumb.jpg" },
            },
          },
        ],
        cursor: "NEXT_PAGE_TOKEN",
        total: 50,
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://www.googleapis.com/youtube/v3/playlistItems",
        expect.objectContaining({
          params: {
            part: "snippet,contentDetails",
            playlistId: "PLtest123",
            maxResults: 50,
            key: "test-api-key",
          },
        })
      );
    });

    it("should handle pagination with cursor", async () => {
      const mockYouTubeResponse = {
        data: {
          items: [],
          nextPageToken: null,
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockYouTubeResponse);

      await request(app)
        .get("/api/youtube/playlist/PLtest123/items?cursor=PAGE_TOKEN&pageSize=25")
        .expect(200);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://www.googleapis.com/youtube/v3/playlistItems",
        expect.objectContaining({
          params: expect.objectContaining({
            pageToken: "PAGE_TOKEN",
            maxResults: 25,
          }),
        })
      );
    });

    it("should return 400 for missing playlist ID", async () => {
      await request(app).get("/api/youtube/playlist//items").expect(404); // Route not found
    });

    it("should handle YouTube API errors", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("API Error"));

      await request(app).get("/api/youtube/playlist/PLtest123/items").expect(500);
    });
  });

  describe("GET /api/youtube/video/:videoId", () => {
    it("should return video details", async () => {
      const mockYouTubeResponse = {
        data: {
          items: [
            {
              id: "dQw4w9WgXcQ",
              snippet: {
                title: "Never Gonna Give You Up",
                channelTitle: "Rick Astley",
                thumbnails: {
                  default: { url: "https://example.com/thumb.jpg" },
                },
              },
              contentDetails: {
                duration: "PT3M33S", // 3 minutes 33 seconds
              },
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockYouTubeResponse);

      const response = await request(app).get("/api/youtube/video/dQw4w9WgXcQ").expect(200);

      expect(response.body).toMatchObject({
        id: "dQw4w9WgXcQ",
        title: "Never Gonna Give You Up",
        channelTitle: "Rick Astley",
        durationSec: 213, // 3*60 + 33
        thumbnails: {
          default: { url: "https://example.com/thumb.jpg" },
        },
      });
    });

    it("should return 404 for non-existent video", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          items: [],
        },
      });

      await request(app).get("/api/youtube/video/nonexistent").expect(404);
    });

    it("should parse various duration formats", async () => {
      const testCases = [
        { duration: "PT4M13S", expected: 253 }, // 4:13
        { duration: "PT1H2M3S", expected: 3723 }, // 1:02:03
        { duration: "PT45S", expected: 45 }, // 0:45
        { duration: "PT2M", expected: 120 }, // 2:00
        { duration: "PT1H", expected: 3600 }, // 1:00:00
      ];

      for (const testCase of testCases) {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            items: [
              {
                id: "test",
                snippet: { title: "Test", channelTitle: "Test" },
                contentDetails: { duration: testCase.duration },
              },
            ],
          },
        });

        const response = await request(app).get("/api/youtube/video/test").expect(200);

        expect(response.body.durationSec).toBe(testCase.expected);
      }
    });
  });

  describe("Error cases", () => {
    it("should return 404 for unknown routes", async () => {
      await request(app).get("/api/unknown").expect(404);
    });
  });
});
