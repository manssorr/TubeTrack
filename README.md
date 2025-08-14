# YouTube Learning Progress Tracker

A comprehensive web application designed to track learning progress through YouTube playlists with embedded player, timestamped note-taking capabilities, progress tracking with visual indicators, and detailed analytics about learning pace and completion estimates.

## Features

- **Embedded YouTube Player** with multiple viewing modes (Normal, Theater, Focus, Fullscreen)
- **Individual Timestamped Notes** with markdown support and full-screen editing
- **Progress Tracking** with segment-based completion tracking and one-click checkpoints
- **Collapsible Video List** for distraction-free learning
- **Learning Analytics** with completion estimates and pace tracking
- **Dark/Light Theme** support with persistent preferences
- **Keyboard Shortcuts** for minimal-click interaction
- **Data Export/Import** for backup and portability
- **Responsive Design** that works on desktop and mobile

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with shadcn/ui components
- **Wouter** for lightweight routing
- **TanStack Query** for server state management
- **Zod** for schema validation

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for database operations (PostgreSQL ready)
- **In-memory storage** for development (with PostgreSQL migration path)

### YouTube Integration
- **YouTube Data API v3** for playlist metadata
- **YouTube IFrame API** for embedded player control

## Prerequisites

Before running this project, make sure you have:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **YouTube Data API Key** (for fetching playlist information)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd youtube-learning-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# YouTube API Configuration
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here

# Database Configuration (optional - uses in-memory storage by default)
DATABASE_URL=postgresql://username:password@localhost:5432/youtube_tracker

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 4. Get YouTube API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**
4. Create credentials (API Key)
5. Copy the API key to your `.env` file

### 5. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure

```
youtube-learning-tracker/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ui/        # shadcn/ui base components
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── MarkdownNotesPanel.tsx
│   │   │   ├── CollapsibleVideoList.tsx
│   │   │   └── ...
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions and configurations
│   │   ├── pages/         # Page components
│   │   └── types/         # TypeScript type definitions
│   └── index.html
├── server/                # Backend Express application
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data storage interface
│   └── vite.ts           # Vite integration
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema and validation
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

## Usage Guide

### Adding a Playlist

1. Go to the **"My Playlists"** tab
2. Click **"Add New Playlist"**
3. Enter a YouTube playlist URL (e.g., `https://www.youtube.com/playlist?list=PLxxxxxx`)
4. The app will fetch all videos and their metadata

### Learning with the App

1. Switch to the **"Learning"** tab
2. Select a playlist from your collection
3. Choose your preferred viewing mode:
   - **Normal**: Standard layout with video list, player, and notes
   - **Theater**: Full-width video with notes below
   - **Focus**: Minimal UI for distraction-free learning
   - **Fullscreen**: Maximum immersion

### Taking Notes

- Click the **"Insert Time"** button to add a timestamp
- Type your notes in the panel below the video
- Each note is saved automatically with a timestamp
- Click any timestamp to jump to that moment in the video
- Use markdown formatting for rich text notes

### Tracking Progress

- Click **"Mark Progress"** to checkpoint your current position
- The app tracks watched segments, not just overall percentage
- View your learning analytics in the **"Analytics"** tab

### Keyboard Shortcuts

- **Space**: Play/Pause video
- **Enter**: Mark progress checkpoint
- **Ctrl+T**: Insert current timestamp
- **Ctrl+F**: Toggle fullscreen mode

## Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Database operations (when using PostgreSQL)
npm run db:generate    # Generate migrations
npm run db:migrate     # Run migrations
npm run db:studio      # Open database studio
```

### Adding New Features

1. **Components**: Add new UI components in `client/src/components/`
2. **API Routes**: Add new endpoints in `server/routes.ts`
3. **Database Schema**: Update `shared/schema.ts` for data model changes
4. **Hooks**: Create custom hooks in `client/src/hooks/`

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_YOUTUBE_API_KEY` | YouTube Data API key | Yes | - |
| `DATABASE_URL` | PostgreSQL connection string | No | In-memory storage |
| `PORT` | Server port | No | 5000 |
| `NODE_ENV` | Environment mode | No | development |

## Database Setup (Optional)

By default, the app uses in-memory storage. To use PostgreSQL:

1. Install PostgreSQL locally or use a cloud service
2. Create a database for the application
3. Set the `DATABASE_URL` environment variable
4. Run migrations: `npm run db:migrate`

## Troubleshooting

### Common Issues

**YouTube API Quota Exceeded**
- YouTube API has daily quotas. If exceeded, try again the next day
- Consider implementing caching for frequently accessed playlists

**Video Not Loading**
- Check if the video is publicly available
- Some videos may be region-restricted
- Ensure your YouTube API key is valid

**Build Errors**
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check Node.js version compatibility

**Dark Mode Issues**
- Clear browser localStorage: `localStorage.clear()`
- Check if theme persistence is working correctly

### Performance Tips

- **Large Playlists**: The app handles playlists with hundreds of videos efficiently
- **Note Storage**: Notes are stored locally; consider exporting regularly for backup
- **Memory Usage**: Restart the browser tab if experiencing slowness with very long sessions

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Submit a pull request with a clear description

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Roadmap

- [ ] User authentication and cloud sync
- [ ] Collaborative learning features
- [ ] Advanced analytics and insights
- [ ] Mobile app version
- [ ] Integration with other video platforms
- [ ] AI-powered note suggestions

## Support

If you encounter any issues or have questions:

1. Check this README and troubleshooting section
2. Look through existing GitHub issues
3. Create a new issue with detailed information about your problem

---

**Happy Learning!** 🎓