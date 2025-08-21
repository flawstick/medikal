-- Create organizations table for multi-tenancy
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    address JSONB,
    tax_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at);

-- Create the default organization for existing data
INSERT INTO organizations (id, name, slug) 
VALUES ('1c595cc2-0e29-4b19-84f3-ab4ec61f655c', 'מדי-קל', 'medikal')
ON CONFLICT (slug) DO NOTHING;

-- Add organization_id to missions table
ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Update all existing missions to belong to the default organization
UPDATE missions 
SET organization_id = '1c595cc2-0e29-4b19-84f3-ab4ec61f655c'
WHERE organization_id IS NULL;

-- Make organization_id NOT NULL after updating existing records
ALTER TABLE missions 
ALTER COLUMN organization_id SET NOT NULL;

-- Add index for organization_id on missions
CREATE INDEX IF NOT EXISTS idx_missions_organization_id ON missions(organization_id);

-- Add organization_id to user_profiles table (users belong to organizations)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Update all existing users to belong to the default organization
UPDATE user_profiles 
SET organization_id = '1c595cc2-0e29-4b19-84f3-ab4ec61f655c'
WHERE organization_id IS NULL;

-- Make organization_id NOT NULL for user_profiles
ALTER TABLE user_profiles 
ALTER COLUMN organization_id SET NOT NULL;

-- Add index for organization_id on user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_organization_id ON user_profiles(organization_id);

-- Add organization_id to drivers table
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE drivers 
SET organization_id = '1c595cc2-0e29-4b19-84f3-ab4ec61f655c'
WHERE organization_id IS NULL;

ALTER TABLE drivers 
ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_drivers_organization_id ON drivers(organization_id);

-- Add organization_id to cars table
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE cars 
SET organization_id = '1c595cc2-0e29-4b19-84f3-ab4ec61f655c'
WHERE organization_id IS NULL;

ALTER TABLE cars 
ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cars_organization_id ON cars(organization_id);

-- Enable RLS on organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own organization
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Update RLS policies for missions table to respect organization boundaries
DROP POLICY IF EXISTS "Anyone can read profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users delete own profile" ON user_profiles;

-- New policies that respect organization boundaries
CREATE POLICY "Users can view profiles in their organization" ON user_profiles
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users update own profile only" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users insert own profile only" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users delete own profile only" ON user_profiles
    FOR DELETE USING (auth.uid() = id);

-- Create a function to get current user's organization_id
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM user_profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for missions table with organization filtering
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view missions in their organization" ON missions
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert missions in their organization" ON missions
    FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update missions in their organization" ON missions
    FOR UPDATE USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete missions in their organization" ON missions
    FOR DELETE USING (organization_id = get_user_organization_id());

-- Add RLS for drivers and cars
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view drivers in their organization" ON drivers
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage drivers in their organization" ON drivers
    FOR ALL USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can view cars in their organization" ON cars
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage cars in their organization" ON cars
    FOR ALL USING (organization_id = get_user_organization_id());