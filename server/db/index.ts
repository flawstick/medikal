import { drizzle } from 'drizzle-orm/postgres-js'
import { createClient } from '@supabase/supabase-js'
import * as schema from './schema'

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase credentials are required')
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// For now, let's use the existing supabase client approach
// We can migrate to pure Drizzle later when we have the proper database URL
export { supabase as db }
export { schema }
export * from './schema'