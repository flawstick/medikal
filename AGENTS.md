# AGENTS.md - Medikal Logistics System

## Build/Lint/Test Commands

```bash
bun dev                 # Start development server
bun build              # Build for production
bun start              # Start production server
bun lint               # Run ESLint
```

**Note:** No testing framework is currently configured. Run `bun lint` after code changes.

## Code Style Guidelines

### Imports
- Use absolute imports with `@/` alias for internal modules
- Group imports: external libraries first, then internal imports
- Sort imports alphabetically within groups

```typescript
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
```

### TypeScript Types & Interfaces
- Use strict TypeScript with proper type definitions
- Define interfaces for component props and API responses
- Use union types for status enums
- Prefer `interface` over `type` for object shapes

```typescript
export interface Mission {
  id: number
  status: MissionStatus
  // ...
}

export type MissionStatus = "unassigned" | "waiting" | "in_progress" | "completed" | "problem"
```

### Naming Conventions
- **Components:** PascalCase (`AppHeader`, `MissionCard`)
- **Functions/Variables:** camelCase (`handleSubmit`, `isLoading`)
- **Types/Interfaces:** PascalCase (`MissionProps`, `APIResponse`)
- **Files:** kebab-case for components (`app-header.tsx`), camelCase for utilities (`utils.ts`)

### Component Patterns
- Use functional components with hooks
- Define props interfaces for all components
- Use `React.forwardRef` for components that need refs
- Include `displayName` for forwarded components

```typescript
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return <button className={cn(buttonVariants({ variant }), className)} ref={ref} {...props} />
  }
)
Button.displayName = "Button"
```

### Error Handling
- Use try-catch blocks for async operations
- Implement error boundaries for React components
- Log errors to console in development
- Provide user-friendly error messages in Hebrew

```typescript
try {
  const data = await fetchMission(id)
  // handle success
} catch (error) {
  console.error("Failed to fetch mission:", error)
  // handle error
}
```

### Styling
- Use Tailwind CSS classes
- Leverage shadcn/ui component variants
- Use `cn()` utility for conditional classes
- Follow RTL (right-to-left) patterns for Hebrew text

```typescript
<div className={cn(
  "flex items-center gap-4",
  isRTL && "flex-row-reverse"
)}>
```

### Form Validation
- Use React Hook Form with Zod schemas
- Define validation schemas separately
- Handle form errors gracefully

```typescript
const schema = z.object({
  name: z.string().min(1, "שם הוא שדה חובה")
})

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
})
```

### Database Operations
- Use direct SQL scripts in `/scripts` folder (not Drizzle ORM)
- Follow existing SQL naming conventions
- Include proper indexes and constraints

### File Organization
- `components/ui/` - shadcn/ui components (do not modify)
- `components/` - Custom application components
- `lib/` - Utilities, types, API helpers
- `hooks/` - Custom React hooks
- `app/` - Next.js App Router pages and layouts

### Performance
- Use React.memo for expensive components
- Implement proper loading states
- Optimize images and assets
- Use proper key props in lists

### Security
- Validate all user inputs with Zod
- Use proper authentication guards
- Sanitize data before database operations
- Follow Next.js security best practices

## Development Workflow

1. Run `bun dev` to start development server
2. Make changes following the style guidelines above
3. Run `bun lint` to check for issues
4. Test functionality manually
5. Commit changes with descriptive messages

## Key Dependencies

- **Next.js 15.2.4** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React Hook Form + Zod** - Form handling
- **Supabase** - Database (direct SQL)
- **NextAuth.js** - Authentication