-- Change user_profiles to support multiple organizations via array
-- First drop all policies that depend on organization_id

-- Drop all existing policies that reference organization_id
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON user_profiles;
DROP POLICY IF EXISTS "Users update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users delete own profile" ON user_profiles;

-- Drop policies on other tables too
DROP POLICY IF EXISTS "Users can view missions in their organization" ON missions;
DROP POLICY IF EXISTS "Users can insert missions in their organization" ON missions;
DROP POLICY IF EXISTS "Users can update missions in their organization" ON missions;
DROP POLICY IF EXISTS "Users can delete missions in their organization" ON missions;

DROP POLICY IF EXISTS "Users can view drivers in their organization" ON drivers;
DROP POLICY IF EXISTS "Users can manage drivers in their organization" ON drivers;

DROP POLICY IF EXISTS "Users can view cars in their organization" ON cars;
DROP POLICY IF EXISTS "Users can manage cars in their organization" ON cars;

-- Now we can safely drop the column
ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS organization_id;

-- Add organization_ids as UUID array
ALTER TABLE user_profiles 
ADD COLUMN organization_ids UUID[] DEFAULT ARRAY['1c595cc2-0e29-4b19-84f3-ab4ec61f655c'::UUID];

-- Update existing users to have the default org in their array
UPDATE user_profiles 
SET organization_ids = ARRAY['1c595cc2-0e29-4b19-84f3-ab4ec61f655c'::UUID]
WHERE organization_ids IS NULL OR array_length(organization_ids, 1) IS NULL;

-- Add index for organization_ids array
CREATE INDEX IF NOT EXISTS idx_user_profiles_organization_ids ON user_profiles USING GIN(organization_ids);

-- Update RLS policies for user_profiles to work with arrays
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON user_profiles;
DROP POLICY IF EXISTS "Users update own profile only" ON user_profiles;
DROP POLICY IF EXISTS "Users insert own profile only" ON user_profiles;
DROP POLICY IF EXISTS "Users delete own profile only" ON user_profiles;

-- New policies that work with organization arrays
CREATE POLICY "Users can view profiles in shared organizations" ON user_profiles
    FOR SELECT USING (
        -- Users can see profiles if they share at least one organization
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.organization_ids && user_profiles.organization_ids
        )
    );

CREATE POLICY "Users update own profile only" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users insert own profile only" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users delete own profile only" ON user_profiles
    FOR DELETE USING (auth.uid() = id);

-- Update the organizations RLS policy to work with user arrays
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;

CREATE POLICY "Users can view their organizations" ON organizations
    FOR SELECT USING (
        id = ANY(
            SELECT unnest(organization_ids) 
            FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Update helper function for current org
CREATE OR REPLACE FUNCTION get_user_organization_ids()
RETURNS UUID[] AS $$
BEGIN
    RETURN (
        SELECT organization_ids 
        FROM user_profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update missions RLS policies to work with arrays
DROP POLICY IF EXISTS "Users can view missions in their organization" ON missions;
DROP POLICY IF EXISTS "Users can insert missions in their organization" ON missions;
DROP POLICY IF EXISTS "Users can update missions in their organization" ON missions;
DROP POLICY IF EXISTS "Users can delete missions in their organization" ON missions;
DROP POLICY IF EXISTS "Users can view missions in their organizations" ON missions;
DROP POLICY IF EXISTS "Users can insert missions in their organizations" ON missions;
DROP POLICY IF EXISTS "Users can update missions in their organizations" ON missions;
DROP POLICY IF EXISTS "Users can delete missions in their organizations" ON missions;

CREATE POLICY "Users can view missions in their organizations" ON missions
    FOR SELECT USING (
        organization_id = ANY(get_user_organization_ids())
    );

CREATE POLICY "Users can insert missions in their organizations" ON missions
    FOR INSERT WITH CHECK (
        organization_id = ANY(get_user_organization_ids())
    );

CREATE POLICY "Users can update missions in their organizations" ON missions
    FOR UPDATE USING (
        organization_id = ANY(get_user_organization_ids())
    );

CREATE POLICY "Users can delete missions in their organizations" ON missions
    FOR DELETE USING (
        organization_id = ANY(get_user_organization_ids())
    );

-- Update drivers RLS policies
DROP POLICY IF EXISTS "Users can view drivers in their organization" ON drivers;
DROP POLICY IF EXISTS "Users can manage drivers in their organization" ON drivers;
DROP POLICY IF EXISTS "Users can view drivers in their organizations" ON drivers;
DROP POLICY IF EXISTS "Users can manage drivers in their organizations" ON drivers;

CREATE POLICY "Users can view drivers in their organizations" ON drivers
    FOR SELECT USING (
        organization_id = ANY(get_user_organization_ids())
    );

CREATE POLICY "Users can manage drivers in their organizations" ON drivers
    FOR ALL USING (
        organization_id = ANY(get_user_organization_ids())
    );

-- Update cars RLS policies  
DROP POLICY IF EXISTS "Users can view cars in their organization" ON cars;
DROP POLICY IF EXISTS "Users can manage cars in their organization" ON cars;
DROP POLICY IF EXISTS "Users can view cars in their organizations" ON cars;
DROP POLICY IF EXISTS "Users can manage cars in their organizations" ON cars;

CREATE POLICY "Users can view cars in their organizations" ON cars
    FOR SELECT USING (
        organization_id = ANY(get_user_organization_ids())
    );

CREATE POLICY "Users can manage cars in their organizations" ON cars
    FOR ALL USING (
        organization_id = ANY(get_user_organization_ids())
    );