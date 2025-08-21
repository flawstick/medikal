-- Simplify the user_profiles table structure and policies
-- First, let's ensure the table exists with proper structure

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can update profiles" ON user_profiles;

-- Disable RLS temporarily to avoid issues
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies

-- 1. Anyone authenticated can read all profiles (for team page)
CREATE POLICY "Anyone can read profiles" ON user_profiles
    FOR SELECT
    USING (true);

-- 2. Users can update their own profile only
CREATE POLICY "Users update own profile" ON user_profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- 3. Users can insert their own profile only
CREATE POLICY "Users insert own profile" ON user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 4. Users can delete their own profile only
CREATE POLICY "Users delete own profile" ON user_profiles
    FOR DELETE
    USING (auth.uid() = id);

-- Note: We'll handle the approval logic in the application layer
-- This avoids any recursive policy issues