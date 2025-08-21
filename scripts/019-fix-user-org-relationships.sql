-- Create user_organizations junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS user_organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- member, admin, owner
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, organization_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_organization_id ON user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_role ON user_organizations(role);

-- Migrate existing user_profiles to user_organizations
INSERT INTO user_organizations (user_id, organization_id, role)
SELECT id, organization_id, 'admin'
FROM user_profiles 
WHERE organization_id IS NOT NULL
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- Drop the wrong RLS policy on organizations
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;

-- Create new RLS policy for organizations (users can see orgs they belong to)
CREATE POLICY "Users can view organizations they belong to" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- Enable RLS on user_organizations table
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- Users can see their own org memberships
CREATE POLICY "Users can view their org memberships" ON user_organizations
    FOR SELECT USING (user_id = auth.uid());

-- Admins can manage memberships in their orgs
CREATE POLICY "Admins can manage org memberships" ON user_organizations
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

-- Update the helper function to get user's current org from URL or default
CREATE OR REPLACE FUNCTION get_user_current_organization_id()
RETURNS UUID AS $$
DECLARE
    current_org_id UUID;
BEGIN
    -- This will be set by the application based on the URL
    -- For now, return the first org the user belongs to
    SELECT organization_id INTO current_org_id
    FROM user_organizations 
    WHERE user_id = auth.uid()
    ORDER BY created_at ASC
    LIMIT 1;
    
    RETURN current_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for other tables to use the many-to-many relationship
-- For missions table
DROP POLICY IF EXISTS "Users can view missions in their organization" ON missions;
DROP POLICY IF EXISTS "Users can insert missions in their organization" ON missions;
DROP POLICY IF EXISTS "Users can update missions in their organization" ON missions;
DROP POLICY IF EXISTS "Users can delete missions in their organization" ON missions;

-- Missions: Users can only see/modify missions in organizations they belong to
CREATE POLICY "Users can view missions in their organizations" ON missions
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert missions in their organizations" ON missions
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update missions in their organizations" ON missions
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete missions in their organizations" ON missions
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- Similar updates for drivers
DROP POLICY IF EXISTS "Users can view drivers in their organization" ON drivers;
DROP POLICY IF EXISTS "Users can manage drivers in their organization" ON drivers;

CREATE POLICY "Users can view drivers in their organizations" ON drivers
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage drivers in their organizations" ON drivers
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- Similar updates for cars
DROP POLICY IF EXISTS "Users can view cars in their organization" ON cars;
DROP POLICY IF EXISTS "Users can manage cars in their organization" ON cars;

CREATE POLICY "Users can view cars in their organizations" ON cars
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage cars in their organizations" ON cars
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );