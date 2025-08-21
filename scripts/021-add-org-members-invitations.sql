-- Add members and invitations to organizations table
-- Members: array of JSONB objects with {id, email, role}
-- Invitations: array of JSONB objects with {email, role, invited_at, invited_by}

-- Add members array to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS members JSONB[] DEFAULT '{}';

-- Add invitations array to organizations  
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS invitations JSONB[] DEFAULT '{}';

-- Add indexes for better performance on JSONB arrays
CREATE INDEX IF NOT EXISTS idx_organizations_members ON organizations USING GIN(members);
CREATE INDEX IF NOT EXISTS idx_organizations_invitations ON organizations USING GIN(invitations);

-- Migrate existing user_profiles to organization members
-- This will populate the members array with existing users
UPDATE organizations 
SET members = (
    SELECT array_agg(
        jsonb_build_object(
            'id', up.id,
            'email', up.email,
            'role', CASE 
                WHEN up.approved = true THEN 'admin'
                ELSE 'member'
            END,
            'joined_at', up.created_at
        )
    )
    FROM user_profiles up 
    WHERE up.organization_ids @> ARRAY[organizations.id]
)
WHERE EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.organization_ids @> ARRAY[organizations.id]
);

-- Create helper functions for member management
CREATE OR REPLACE FUNCTION add_organization_member(
    org_id UUID,
    user_id UUID,
    user_email TEXT,
    user_role TEXT DEFAULT 'member'
)
RETURNS BOOLEAN AS $$
DECLARE
    member_exists BOOLEAN;
    new_member JSONB;
BEGIN
    -- Check if member already exists
    SELECT EXISTS(
        SELECT 1 FROM organizations
        WHERE id = org_id
        AND members @> ARRAY[jsonb_build_object('id', user_id)]
    ) INTO member_exists;
    
    IF member_exists THEN
        RETURN FALSE; -- Member already exists
    END IF;
    
    -- Build new member object
    new_member := jsonb_build_object(
        'id', user_id,
        'email', user_email,
        'role', user_role,
        'joined_at', NOW()
    );
    
    -- Add member to organization
    UPDATE organizations 
    SET members = array_append(members, new_member)
    WHERE id = org_id;
    
    -- Add organization to user's organization_ids
    UPDATE user_profiles 
    SET organization_ids = array_append(organization_ids, org_id)
    WHERE id = user_id 
    AND NOT (organization_ids @> ARRAY[org_id]);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION remove_organization_member(
    org_id UUID,
    user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Remove member from organization
    UPDATE organizations 
    SET members = (
        SELECT array_agg(member)
        FROM unnest(members) AS member
        WHERE (member->>'id')::UUID != user_id
    )
    WHERE id = org_id;
    
    -- Remove organization from user's organization_ids
    UPDATE user_profiles 
    SET organization_ids = array_remove(organization_ids, org_id)
    WHERE id = user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_member_role(
    org_id UUID,
    user_id UUID,
    new_role TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE organizations 
    SET members = (
        SELECT array_agg(
            CASE 
                WHEN (member->>'id')::UUID = user_id 
                THEN jsonb_set(member, '{role}', to_jsonb(new_role))
                ELSE member
            END
        )
        FROM unnest(members) AS member
    )
    WHERE id = org_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_organization_invitation(
    org_id UUID,
    invite_email TEXT,
    invited_by_id UUID,
    invite_role TEXT DEFAULT 'member'
)
RETURNS BOOLEAN AS $$
DECLARE
    invitation_exists BOOLEAN;
    new_invitation JSONB;
BEGIN
    -- Check if invitation already exists
    SELECT EXISTS(
        SELECT 1 FROM organizations
        WHERE id = org_id
        AND invitations @> ARRAY[jsonb_build_object('email', invite_email)]
    ) INTO invitation_exists;
    
    IF invitation_exists THEN
        RETURN FALSE; -- Invitation already exists
    END IF;
    
    -- Build new invitation object
    new_invitation := jsonb_build_object(
        'email', invite_email,
        'role', invite_role,
        'invited_at', NOW(),
        'invited_by', invited_by_id
    );
    
    -- Add invitation to organization
    UPDATE organizations 
    SET invitations = array_append(invitations, new_invitation)
    WHERE id = org_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION remove_organization_invitation(
    org_id UUID,
    invite_email TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE organizations 
    SET invitations = (
        SELECT array_agg(invitation)
        FROM unnest(invitations) AS invitation
        WHERE invitation->>'email' != invite_email
    )
    WHERE id = org_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for member management
-- Only admins can manage members
CREATE POLICY "Admins can manage organization members" ON organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM unnest(members) AS member
            WHERE (member->>'id')::UUID = auth.uid()
            AND member->>'role' = 'admin'
        )
    );

-- Users can view organizations they're members of (existing policy should cover this)
-- But let's make sure the policy accounts for the new member structure
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;

CREATE POLICY "Users can view their organizations" ON organizations
    FOR SELECT USING (
        -- User is in organization_ids of their profile OR they're in the members array
        id = ANY(
            SELECT unnest(organization_ids) 
            FROM user_profiles 
            WHERE id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM unnest(members) AS member
            WHERE (member->>'id')::UUID = auth.uid()
        )
    );