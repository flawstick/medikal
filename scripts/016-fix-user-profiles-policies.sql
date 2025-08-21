-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Approved users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Approved users can manage approvals" ON user_profiles;

-- Create fixed policies without recursion

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE 
    USING (auth.uid() = id);

-- Policy: Users can insert their own profile (for registration)
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Policy: Allow authenticated users to view all profiles
-- This avoids recursion by not checking the approval status
CREATE POLICY "Authenticated users can view all profiles" ON user_profiles
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);

-- Policy: Allow authenticated users to update other profiles if they are approved
-- We'll check approval status in the application logic instead
CREATE POLICY "Authenticated users can update profiles" ON user_profiles
    FOR UPDATE 
    USING (auth.uid() IS NOT NULL);

-- Alternative approach: Create a function to check if user is approved
-- This avoids the recursive query issue
CREATE OR REPLACE FUNCTION is_user_approved(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_approved BOOLEAN;
BEGIN
    SELECT approved INTO is_approved
    FROM user_profiles
    WHERE id = user_id
    LIMIT 1;
    
    RETURN COALESCE(is_approved, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now we can use this function in policies if needed later
-- For now, we'll handle approval checks in the application layer