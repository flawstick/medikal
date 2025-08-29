# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Medikal is a Hebrew-language multi-tenant logistics and delivery management system built with Next.js. The system handles mission tracking, driver management, vehicle safety compliance, and emergency reporting for logistics organizations.

## Tech Stack
- **Framework**: Next.js 15.2.4 (App Router) + React 19 + TypeScript
- **UI**: Tailwind CSS + shadcn/ui + Radix UI components  
- **Database**: PostgreSQL via Supabase (direct SQL, not using Drizzle ORM)
- **Auth**: NextAuth.js + Supabase Auth (dual authentication system)
- **Storage**: Cloudflare R2 (AWS S3 compatible)
- **External APIs**: Google Maps for address handling
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for data visualization

## Common Commands
```bash
bun dev                 # Start development server
bun build              # Build for production  
bun start              # Start production server
bun lint               # Run ESLint
```

## Database Management
- **NOT using Drizzle ORM** - use direct SQL scripts in `/scripts` folder
- Database changes should be made via SQL files in `/scripts`
- Use Supabase dashboard or psql for database operations

## Architecture

### Multi-Tenant Structure
- Dynamic `[orgId]` routing for organization-scoped access
- Organization-based data isolation in all database operations
- Middleware handles route protection and automatic org redirection
- Separate layouts for auth (`/login`) and dashboard (`/[orgId]`) routes

### Database Schema (Direct SQL)
Key entities managed via SQL scripts in `/scripts`:
- **Organizations**: Core tenant entity with settings and configurations
- **Missions**: Delivery/logistics tasks with status tracking
- **Drivers**: Field personnel with authentication capabilities  
- **Cars**: Vehicle fleet with inspection requirements
- **Vehicle Inspections**: Safety compliance tracking
- **Emergency Reports**: Incident management and reporting
- **Accounts**: NextAuth integration layer

### Authentication Flow
- Development: Hardcoded credentials (`dev@flawstick.com`)
- Production: Dual system using both NextAuth.js and Supabase Auth
- Session management via JWT tokens
- Route-based access control through middleware

## Key Features
- Hebrew RTL language support throughout the UI
- File upload with EXIF data processing for images
- Real-time mission status tracking
- Vehicle safety inspection workflows
- Emergency incident reporting system
- Analytics dashboards with Recharts
- Google Maps integration for address handling

## Development Notes
- No testing framework currently configured
- Build configuration ignores TypeScript/ESLint errors for deployment
- Uses Bun as package manager and runtime
- Image uploads stored in Cloudflare R2 with metadata extraction
- Database changes managed through direct SQL scripts in `/scripts` folder

## File Structure
- `app/` - Next.js App Router with auth/dashboard layouts
- `scripts/` - Direct SQL migration and setup files
- `lib/` - Utilities, types, database connections, API helpers
- `components/ui/` - shadcn/ui component library
- `components/` - Custom React components
- `hooks/` - Custom React hooks