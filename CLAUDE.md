# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server
npm run dev

# Build and deployment
npm run build
npm start

# Code quality
npm run lint

# Database operations
npm run db:generate    # Generate Drizzle schema after changes
npm run db:migrate     # Run pending migrations
npm run db:studio      # Open Drizzle Studio GUI
```

## Architecture Overview

**Medikal** is a Hebrew logistics/delivery management system built with:

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Drizzle ORM** with PostgreSQL (Supabase)
- **Shadcn/ui** component library + Tailwind CSS
- **NextAuth.js** for authentication
- **Hebrew RTL interface** (`dir="rtl"`)

### Core Business Entities

- **Missions** (`/app/deliveries/`) - delivery orders with status workflow: `unassigned → waiting → in_progress → completed/problem`  
- **Drivers** (`/app/drivers/`) - driver management with authentication
- **Cars** (`/app/cars/`) - vehicle fleet with inspection reports
- **Reports** (`/app/reports/`) - analytics and vehicle inspections

### Key Directories

- `app/` - Next.js App Router (pages + API routes)
- `server/db/` - Drizzle schema and database configuration
- `components/ui/` - Complete Shadcn/ui component system
- `lib/types.ts` - Comprehensive TypeScript definitions
- `scripts/` - SQL migration files

### Database Schema Reference

Always check `server/db/schema.ts` for current data relationships:
- **missions** table drives core delivery workflow
- **drivers** with separate authentication system
- **cars** linked to inspection reports
- Well-indexed for performance

### Development Patterns

- **Server Components** - Leverage React 19 server-side rendering
- **Type-safe APIs** - All routes use TypeScript + Drizzle types
- **Component-first** - Build with existing Shadcn/ui components
- **Hebrew RTL** - Always consider RTL layout in UI changes
- **Status-driven** - Mission status determines UI behavior

### Environment Setup

Copy `.env.example` and configure:
- Supabase database connection
- NextAuth.js settings  
- Google OAuth (if using social login)

### Package Manager

Primary package manager appears to be **Bun** (bun.lockb present), though npm/pnpm lock files also exist.