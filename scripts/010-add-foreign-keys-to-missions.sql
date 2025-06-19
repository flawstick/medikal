-- Migration: Add foreign key relationships for car_id and driver_id in missions table
-- This script replaces the text fields with proper foreign key relationships

-- Step 1: Add new foreign key columns
ALTER TABLE missions ADD COLUMN car_id BIGINT;
ALTER TABLE missions ADD COLUMN driver_id BIGINT;

-- Step 2: Create a mapping function to find car IDs by plate number
-- Update car_id based on existing car_number (plate_number)
UPDATE missions 
SET car_id = (
    SELECT c.id 
    FROM cars c 
    WHERE c.plate_number = missions.car_number 
    AND c.is_active = true
    LIMIT 1
)
WHERE missions.car_number IS NOT NULL 
AND missions.car_number != '';

-- Step 3: Create a mapping function to find driver IDs by name
-- Update driver_id based on existing driver name
UPDATE missions 
SET driver_id = (
    SELECT d.id 
    FROM drivers d 
    WHERE d.name = missions.driver 
    AND d.is_active = true
    LIMIT 1
)
WHERE missions.driver IS NOT NULL 
AND missions.driver != '';

-- Step 4: Add foreign key constraints
ALTER TABLE missions 
ADD CONSTRAINT fk_missions_car_id 
FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE SET NULL;

ALTER TABLE missions 
ADD CONSTRAINT fk_missions_driver_id 
FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;

-- Step 5: Create indexes for the new foreign key columns
CREATE INDEX idx_missions_car_id ON missions(car_id);
CREATE INDEX idx_missions_driver_id ON missions(driver_id);

-- Step 6: Drop the old text columns (backup data first if needed)
-- Note: Uncomment these lines after verifying the migration worked correctly
-- ALTER TABLE missions DROP COLUMN car_number;
-- ALTER TABLE missions DROP COLUMN driver;

-- Step 7: Add NOT NULL constraint to car_id to make it mandatory
-- Note: Uncomment this after ensuring all missions have a car assigned
-- ALTER TABLE missions ALTER COLUMN car_id SET NOT NULL;

-- Verification queries (run these to check the migration)
-- SELECT COUNT(*) as total_missions FROM missions;
-- SELECT COUNT(*) as missions_with_car FROM missions WHERE car_id IS NOT NULL;
-- SELECT COUNT(*) as missions_with_driver FROM missions WHERE driver_id IS NOT NULL;
-- SELECT COUNT(*) as missions_without_car FROM missions WHERE car_id IS NULL;
-- SELECT COUNT(*) as missions_without_driver FROM missions WHERE driver_id IS NULL;

COMMENT ON COLUMN missions.car_id IS 'Foreign key reference to cars table';
COMMENT ON COLUMN missions.driver_id IS 'Foreign key reference to drivers table';