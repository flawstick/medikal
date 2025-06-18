import type { Config } from 'drizzle-kit'
import 'dotenv/config'

export default {
  schema: './server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  },
} satisfies Config