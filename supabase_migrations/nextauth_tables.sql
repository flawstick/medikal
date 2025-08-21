-- NextAuth.js tables for Supabase Postgres
-- Run this script in your Supabase SQL editor or via psql

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text UNIQUE NOT NULL,
  email_verified timestamp with time zone,
  image text,
  password_hash text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Accounts table (for OAuth or credentials linkage)
CREATE TABLE IF NOT EXISTS public.accounts (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  provider text NOT NULL,
  provider_account_id text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  created_at timestamp with time zone DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS accounts_provider_account_idx
  ON public.accounts(provider, provider_account_id);

-- Sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id serial PRIMARY KEY,
  session_token text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Verification Tokens table (for Email/Magic Link)
CREATE TABLE IF NOT EXISTS public.verification_tokens (
  identifier text NOT NULL,
  token text NOT NULL,
  expires timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (identifier, token)
);

-- Optional: add indexes to speed lookups
CREATE INDEX IF NOT EXISTS sessions_user_idx ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS verification_tokens_token_idx ON public.verification_tokens(token);