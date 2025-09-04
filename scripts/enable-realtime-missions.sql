-- Enable realtime for missions table
-- Run this in your Supabase SQL Editor

-- Add missions table to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE missions;

-- Verify the table was added
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename = 'missions';