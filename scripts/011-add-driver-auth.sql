-- Empty drivers table first to avoid NULL constraint issues
TRUNCATE TABLE drivers RESTART IDENTITY CASCADE;

-- Add username and password columns to drivers table
ALTER TABLE drivers 
ADD COLUMN username VARCHAR(255) UNIQUE NOT NULL,
ADD COLUMN hashed_password TEXT NOT NULL;

-- Create index on username for faster lookups
CREATE INDEX idx_drivers_username ON drivers(username);