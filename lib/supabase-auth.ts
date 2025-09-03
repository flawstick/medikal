import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Create auth client that uses cookies for session management
const createAuthClient = async () => {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore cookie setting errors in server components
          }
        },
      },
    }
  )
}

/**
 * Authenticated Supabase client for API routes
 * Usage: const client = await supabase()
 */
export const supabase = createAuthClient