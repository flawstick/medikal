-- Drop the existing orders table and create new missions table
DROP TABLE IF EXISTS orders CASCADE;

-- Create the new missions table
CREATE TABLE missions (
    id BIGSERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    subtype TEXT,
    address JSONB NOT NULL,
    driver TEXT,
    car_number TEXT,
    status TEXT NOT NULL DEFAULT 'unassigned' 
        CHECK (status IN ('unassigned', 'waiting', 'in_progress', 'completed', 'problem')),
    date_expected TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Create indexes for better performance
CREATE INDEX idx_missions_type ON missions(type);
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_missions_driver ON missions(driver);
CREATE INDEX idx_missions_date_expected ON missions(date_expected);
CREATE INDEX idx_missions_created_at ON missions(created_at);
CREATE INDEX idx_missions_address ON missions USING GIN(address);
CREATE INDEX idx_missions_metadata ON missions USING GIN(metadata);

-- Add some sample data to test the new structure
INSERT INTO missions (type, subtype, address, driver, car_number, status, date_expected, completed_at, created_at, updated_at, metadata) VALUES

-- Delivery missions
('delivery', NULL, '{"address": "רחוב הרצל 15", "city": "תל אביב", "zip_code": "6436902"}', 'משה לוי', '12-345-67', 'completed', '2025-05-12 14:00:00+03', '2025-05-12 14:30:00+03', '2025-05-10 09:15:00+03', '2025-05-12 14:30:00+03', '{"certificates": [{"certificate_number": "12345", "package_count": 2, "certificate_images": ["https://r2.example.com/cert1.jpg"]}], "delivery_images": ["https://r2.example.com/proof1.jpg"], "priority": "high", "notes": "דחוף - תרופות"}'),

('delivery', NULL, '{"address": "שדרות בן גוריון 42", "city": "חיפה", "zip_code": "3200003"}', 'אברהם דוד', '23-456-78', 'completed', '2025-05-13 16:00:00+03', '2025-05-13 16:45:00+03', '2025-05-11 11:20:00+03', '2025-05-13 16:45:00+03', '{"certificates": [{"certificate_number": "12346", "package_count": 1, "certificate_images": ["https://r2.example.com/cert2.jpg"]}], "delivery_images": ["https://r2.example.com/proof2.jpg"], "delivery_instructions": "קומה 3, דלת ימין"}'),

('delivery', NULL, '{"address": "רחוב ירושלים 28", "city": "פתח תקווה", "zip_code": "4951028"}', 'יוסי מזרחי', '34-567-89', 'in_progress', '2025-06-20 10:00:00+03', NULL, '2025-05-12 08:30:00+03', '2025-06-18 09:15:00+03', '{"certificates": [{"certificate_number": "12347", "package_count": 3, "certificate_images": []}], "fragile": true, "insurance": 500}'),

-- Manofeem missions with subtypes
('manofeem', 'crane_setup', '{"address": "אזור תעשייה צפוני", "city": "אשדוד", "zip_code": "7760001"}', 'רונן ביטון', '56-789-01', 'waiting', '2025-06-21 08:00:00+03', NULL, '2025-06-18 10:30:00+03', '2025-06-18 10:30:00+03', '{"crane_type": "mobile", "capacity": "50_ton", "setup_duration": "4_hours"}'),

('manofeem', 'maintenance', '{"address": "נמל אשדוד", "city": "אשדוד", "zip_code": "7710001"}', 'עמוס כהן', '67-890-12', 'unassigned', '2025-06-22 06:00:00+03', NULL, '2025-06-18 11:45:00+03', '2025-06-18 11:45:00+03', '{"maintenance_type": "routine", "equipment_ids": "crane_001,crane_002"}'),

-- Pickup missions
('pickup', NULL, '{"address": "מרכז לוגיסטי", "city": "רעננה", "zip_code": "4365025"}', NULL, NULL, 'unassigned', '2025-06-19 14:00:00+03', NULL, '2025-06-18 12:00:00+03', '2025-06-18 12:00:00+03', '{"pickup_items": "medical_supplies,urgent_documents", "contact_person": "דוד כהן", "contact_phone": "050-1234567"}'),

-- Survey mission
('survey', NULL, '{"address": "רחוב החרושת 45", "city": "הרצליה", "zip_code": "4672245"}', 'משה לוי', '12-345-67', 'in_progress', '2025-06-19 16:00:00+03', NULL, '2025-06-17 15:20:00+03', '2025-06-18 08:30:00+03', '{"survey_type": "site_assessment", "estimated_duration": "2_hours", "equipment_needed": "measuring_tools,camera"}');