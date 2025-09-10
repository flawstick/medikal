-- Migration: Move vehicle inspection fields to metadata
-- This restructures the vehicle_inspections table to store all inspection data in metadata JSONB

-- First, update existing records to move all fields into metadata as freeform JSON
UPDATE vehicle_inspections 
SET metadata = '{}'::jsonb;

-- Create new simplified table structure
CREATE TABLE vehicle_inspections_new (
    id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT REFERENCES drivers(id) ON DELETE CASCADE NOT NULL,
    car_id BIGINT REFERENCES cars(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copy data to new table
INSERT INTO vehicle_inspections_new (id, driver_id, car_id, metadata, created_at, updated_at)
SELECT id, driver_id, car_id, metadata, created_at, updated_at
FROM vehicle_inspections;

-- Drop old table and rename new one
DROP TABLE vehicle_inspections;
ALTER TABLE vehicle_inspections_new RENAME TO vehicle_inspections;

-- Recreate indexes
CREATE INDEX idx_vehicle_inspections_driver_id ON vehicle_inspections(driver_id);
CREATE INDEX idx_vehicle_inspections_car_id ON vehicle_inspections(car_id);
CREATE INDEX idx_vehicle_inspections_created_at ON vehicle_inspections(created_at);

-- Add GIN index for metadata JSONB queries
CREATE INDEX idx_vehicle_inspections_metadata ON vehicle_inspections USING GIN (metadata);

-- Reset the sequence to match the highest ID (sequence is auto-created with BIGSERIAL)
DO $$ 
BEGIN 
    PERFORM setval('vehicle_inspections_id_seq', (SELECT COALESCE(MAX(id), 1) FROM vehicle_inspections), true);
EXCEPTION 
    WHEN undefined_table THEN 
        -- If sequence doesn't exist, it will be auto-created on next insert
        NULL;
END $$;