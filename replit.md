# Gokuarc vs Criptoides

## Overview

A 2D platformer web game built with Phaser.js, featuring a powerful main character (Gokuarc) fighting enemies (Criptoides) in a jungle setting. The game runs entirely in the browser and includes a leaderboard system for tracking high scores. The project uses a React frontend with a Node.js/Express backend and PostgreSQL database for score persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **Routing**: Wouter (lightweight React router)
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack React Query for server state
- **Game Engine**: Phaser.js for the 2D platformer game

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (compiled with tsx for development, esbuild for production)
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod validation
- **Database ORM**: Drizzle ORM with PostgreSQL

### Project Structure
```
├── client/           # React frontend application
│   └── src/
│       ├── components/ui/  # shadcn/ui components
│       ├── lib/           # Utilities including game.ts (Phaser game)
│       ├── pages/         # Route components
│       └── hooks/         # Custom React hooks
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route handlers
│   ├── storage.ts    # Database operations
│   └── db.ts         # Database connection
├── shared/           # Shared code between client/server
│   ├── schema.ts     # Drizzle database schema
│   └── routes.ts     # API route definitions with Zod schemas
└── migrations/       # Drizzle database migrations
```

### Key Design Patterns
1. **Monorepo Structure**: Client and server share TypeScript types and validation schemas through the `shared/` directory
2. **Type-Safe API**: Route definitions include input/output schemas using Zod, ensuring type safety across the full stack
3. **Component Library**: shadcn/ui components provide consistent, accessible UI elements
4. **Database Schema**: Uses Drizzle ORM with drizzle-zod for automatic schema-to-validation conversion

### Game Implementation
- The Phaser game is initialized in `client/src/lib/game.ts`
- Game renders in a container on the home page
- Controls: Arrow keys for movement/jumping, Z (punch), X (charge Kiarc), C (magic), V (special attack)
- Includes HUD with score and energy bar

### Database Schema
- **scores** table: Tracks player high scores with `playerName`, `score`, `enemiesDefeated`, and `createdAt` timestamp

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database operations with automatic migration support

### Frontend Libraries
- **Phaser.js**: 2D game engine for the platformer
- **Radix UI**: Accessible primitive components (via shadcn/ui)
- **TanStack Query**: Server state management and caching

### Development Tools
- **Vite**: Fast development server with HMR
- **Replit Plugins**: Runtime error overlay, cartographer, and dev banner for Replit environment

### Build & Runtime
- **tsx**: TypeScript execution for development
- **esbuild**: Production bundling for server code
- Uses `db:push` command for database schema synchronization