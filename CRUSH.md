CRUSH.md — Quick ops + code style for this repo

Build/lint/test
- Dev: bun run dev (or npm run dev)
- Build: bun run build (or npm run build)
- Start: bun run start (or npm run start)
- Lint: bun run lint (or npm run lint)
- Typecheck: bunx tsc -p tsconfig.json --noEmit
- DB (Drizzle): bun run db:generate, bun run db:migrate, bun run db:studio
- Tests: No runner configured in package.json. Recommended add Vitest:
  - "test": "vitest",
  - "test:watch": "vitest --watch",
  - Single test: "vitest run {path} -t {name}"

Environment
- Use .env.local for Next.js runtime vars; never commit .env* files
- Services: Next.js 15, TypeScript 5, TailwindCSS 3, Drizzle ORM, NextAuth, Supabase, AWS S3
- Common envs: NEXTAUTH_SECRET, NEXTAUTH_URL, SUPABASE_URL, SUPABASE_ANON_KEY, DATABASE_URL, AWS creds/R2

Imports & layout
- Use path-relative imports across app/, components/, lib/, server/. An alias @/* exists but prefer relative for local files
- Group imports: built-ins, third-party, internal; keep stable order
- Prefer named exports; default only when a file exposes a single component

Formatting & structure
- Prettier-like: 2-space indent, semicolons, single quotes where allowed, trailing commas
- TS/TSX only; colocate UI in components/, shared utils in lib/, server-only logic in server/

Types & naming
- TS strict is enabled; type params/returns where not obvious
- Validation with zod for inputs (forms/api). Reuse lib/types.ts where possible
- Naming: PascalCase components/types, camelCase vars/functions, UPPER_SNAKE for env constants

React & Next
- Server Components by default in app/; add 'use client' only when needed
- API routes: async handlers, typed responses; never expose secrets to client
- Forms: react-hook-form + zod; surface errors via components/ui/alert or toast

Error handling
- Wrap API handlers in try/catch; return NextResponse.json({ error }, { status })
- Centralize user-facing messages; log internal details server-side only

Styling & UI
- Tailwind + shadcn/ui; compose with clsx and tailwind-merge; use class-variance-authority for variants

Git & hygiene
- Never commit generated artifacts: .next, build, out, .vercel, node_modules, .crush
- Before PRs: run lint, typecheck, and build; add tests for logic changes in lib/ or server/

Cursor/Copilot rules
- No Cursor (.cursor/rules, .cursorrules) or Copilot (.github/copilot-instructions.md) rules detected. If added later, mirror key constraints here.