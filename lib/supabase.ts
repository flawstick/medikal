import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

// Server-side client with service role key
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Client-side Supabase client
export const getSupabaseClient = () => {
  if (typeof window === "undefined") {
    // Server-side
    return createClient(supabaseUrl, supabaseServiceKey);
  } else {
    // Client-side
    return createClient(supabaseUrl, supabaseAnonKey);
  }
};
