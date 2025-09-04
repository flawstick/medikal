-- Setup RLS policies for missions table realtime access
-- Run this in your Supabase SQL Editor

-- Enable RLS on missions table (if not already enabled)
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read all missions for realtime
CREATE POLICY "Allow authenticated users to read missions for realtime"
ON missions
FOR SELECT
TO authenticated
USING (true);

-- Policy to allow authenticated users to receive realtime updates
-- This is needed for realtime subscriptions to work properly
CREATE POLICY "Allow authenticated realtime access to missions"
ON missions
FOR ALL
TO authenticated
USING (true);

-- Verify policies were created
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'missions';

-- Verify realtime publication includes missions
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename = 'missions';