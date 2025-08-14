# YouTube Learning Progress Tracker

## Overview

This is a comprehensive web application designed to track learning progress through YouTube playlists. The application provides an embedded YouTube player, timestamped note-taking capabilities, progress tracking with visual indicators, and detailed analytics about learning pace and completion estimates. Users can input playlist URLs or JSON data, mark progress checkpoints with minimal clicks, and analyze their learning patterns through a rich dashboard.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Modern component-based architecture using functional components and hooks
- **Vite**: Fast build tool and development server with hot module replacement
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, accessible UI components
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: Custom hooks (`useProgressTracker`, `useAnalytics`) for business logic with React's built-in state management

### Data Management
- **Local Storage**: All progress data persists in browser localStorage with auto-save functionality
- **Drizzle ORM**: PostgreSQL schema definitions ready for future database integration
- **Schema Validation**: Zod schemas for type-safe data validation and transformation
- **Data Structure**: Hierarchical playlist → videos → segments structure with progress tracking

### Key Components Architecture
- **VideoPlayer**: YouTube iframe integration with progress tracking and keyboard controls
- **NotesPanel**: Real-time note editing with timestamp insertion and auto-save
- **AnalyticsDashboard**: Learning metrics calculation and visualization
- **PlaylistInput**: YouTube API integration for playlist data fetching
- **VideoList**: Progress visualization with segment-based completion tracking

### YouTube Integration
- **YouTube API**: Fetches playlist metadata, video titles, and durations
- **Embedded Player**: Custom YouTube player wrapper with progress tracking hooks
- **URL Parsing**: Extracts playlist and video IDs from various YouTube URL formats
- **Duration Handling**: Converts ISO 8601 duration format to seconds for calculations

### Progress Tracking System
- **Segment-based Progress**: Tracks watched segments as [start, end] pairs rather than simple percentages
- **Real-time Updates**: Progress auto-saves every 30 seconds during video playback
- **Checkpoint System**: One-click progress marking with keyboard shortcuts (Enter key)
- **Session Tracking**: Monitors actual time spent vs. content duration for learning ratio calculations

### Analytics Engine
- **Learning Metrics**: Calculates completion rates, learning ratios, and time estimates
- **Progress Visualization**: Circular progress indicators and linear progress bars
- **Predictive Analytics**: Estimates completion time based on historical learning pace
- **Performance Insights**: Tracks effective watch time vs. actual time spent

### Theme and Accessibility
- **Dark/Light Mode**: Theme provider with localStorage persistence
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Keyboard Navigation**: Comprehensive keyboard shortcuts for minimal-click interaction
- **Accessibility**: ARIA labels and semantic HTML structure throughout

### Data Import/Export
- **JSON Export**: Progress data can be exported as timestamped JSON files
- **Backup System**: Manual export/import functionality for data portability
- **Format Validation**: Robust error handling for imported data validation

## External Dependencies

### Core Framework Dependencies
- **React 18**: Component library with concurrent features
- **TypeScript**: Type safety and developer experience
- **Vite**: Build tool and development server
- **Wouter**: Lightweight routing solution

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless component primitives for accessibility
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe variant API for component styling

### Data and Validation
- **Zod**: Schema validation and type inference
- **Drizzle ORM**: Type-safe SQL toolkit (configured for PostgreSQL)
- **@neondatabase/serverless**: PostgreSQL client for future cloud deployment

### YouTube Integration
- **YouTube Data API v3**: Playlist and video metadata fetching
- **YouTube IFrame API**: Embedded player control and event handling

### Development Tools
- **TanStack Query**: Server state management and caching (minimal usage)
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration

### Backend Infrastructure (Minimal)
- **Express.js**: Lightweight server for health checks and future API endpoints
- **Node.js**: Runtime environment
- **Connect-pg-simple**: Session store for future authentication features

The application is primarily client-side focused with localStorage persistence, but includes backend infrastructure for future enhancements like user accounts, cloud synchronization, and collaborative features.