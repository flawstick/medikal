-- Enable realtime for missions table
-- Run this in your Supabase SQL Editor

-- 1. Add missions table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE missions;

-- 2. Enable RLS if not already enabled  
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- 3. Create policy for authenticated users to receive realtime updates
DROP POLICY IF EXISTS "Allow authenticated realtime access" ON missions;
CREATE POLICY "Allow authenticated realtime access"
ON missions
FOR SELECT
TO authenticated
USING (true);

-- 4. Verify the setup
SELECT 'Tables in realtime publication:' as info;
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

SELECT 'RLS policies on missions:' as info;
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'missions';

-- 5. Check if realtime is enabled globally
SELECT 'Realtime extensions:' as info;
SELECT * FROM pg_extension WHERE extname = 'supabase_realtime';