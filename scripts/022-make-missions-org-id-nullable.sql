-- Make organization_id nullable in missions table to allow creating missions without an organization
ALTER TABLE missions 
ALTER COLUMN organization_id DROP NOT NULL;

-- Update the foreign key constraint to keep the cascade delete behavior
-- (The foreign key constraint itself doesn't need to change, just the NOT NULL constraint)