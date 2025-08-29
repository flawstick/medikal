-- Add logo URL field to organizations table for Supabase storage
-- This allows each organization to have their own logo displayed in the team switcher

ALTER TABLE organizations
ADD COLUMN logo_url TEXT;

-- Add comment explaining the field
COMMENT ON COLUMN organizations.logo_url IS 'URL to organization logo stored in Supabase storage bucket';

-- Create index for faster queries (optional but good practice)
CREATE INDEX IF NOT EXISTS idx_organizations_logo_url ON organizations (logo_url) WHERE logo_url IS NOT NULL;
