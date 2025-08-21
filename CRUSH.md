CRUSH.md — Quick ops + code style for this repo

Build/lint/test
- Dev: bun run dev (or npm run dev)
- Build: bun run build (or npm run build)
- Start: bun run start (or npm run start)
- Lint: bun run lint (or npm run lint)
- DB (Drizzle): bun run db:generate, bun run db:migrate, bun run db:studio
- Tests: No test runner configured in package.json. If you add one (Vitest/Jest/Playwright), add commands here. Suggested: "test": "vitest", "test:watch": "vitest --watch", "test:file": "vitest run {path} -t {name}" to run a single test.

Environment
- Create .env.local for Next.js runtime vars. Do not commit .env* files.
- Required services: Next.js 15, TypeScript 5, TailwindCSS 3, Drizzle ORM, NextAuth, Supabase client, AWS S3 SDK.

Imports & module layout
- Use path-relative imports within app/, components/, lib/, server/ (no alias config in tsconfig.json). Group: built-ins, third-party, internal; keep stable order.
- Prefer named exports; avoid default unless a component is the only export.

Formatting & style
- Use Prettier-like conventions: 2-space indent, semicolons, single quotes where applicable, trailing commas where valid. Keep files TS/TSX.
- Keep components in components/ with colocated UI logic; non-UI utilities in lib/; server-only logic in server/.

Types & naming
- Strict TypeScript: type all function params/returns where not obvious; use zod schemas for input validation.
- Use PascalCase for components/types, camelCase for variables/functions, UPPER_SNAKE for env constants.
- Reuse shared types from lib/types.ts when possible.

React & Next
- Use Server Components by default in app/; add 'use client' only when needed.
- Prefer async server functions in app/api routes; return typed JSON; never leak secrets to the client.
- For forms, use react-hook-form with zod resolvers; surface errors via components/ui/alert or toast.

Error handling
- Wrap API handlers with try/catch; return NextResponse.json({ error }, { status }). Never console.log secrets.
- Centralize user-facing messages; log internal details on the server only.

Styling & UI
- Tailwind with shadcn/ui patterns. Compose classes with clsx and tailwind-merge; keep variants using class-variance-authority.

Git & project hygiene
- Commit generated artifacts never: .next, build, out, .vercel, node_modules, .crush.
- Before PRs: run lint and build. Add tests when introducing logic in lib/ or server/.

Cursor/Copilot rules
- No Cursor or Copilot rules detected (.cursor/rules or .cursorrules or .github/copilot-instructions.md). If added later, mirror key constraints here.
