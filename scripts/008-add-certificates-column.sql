-- Clear existing data and add certificates column
DELETE FROM missions;

-- Add certificates column to missions table
ALTER TABLE missions ADD COLUMN certificates JSONB;
CREATE INDEX idx_missions_certificates ON missions USING GIN(certificates);

-- Insert sample data with proper certificates structure
INSERT INTO missions (type, subtype, address, driver, car_number, status, date_expected, completed_at, created_at, updated_at, certificates, metadata) VALUES

-- Delivery missions with certificates
('delivery', NULL, '{"address": "רחוב הרצל 15", "city": "תל אביב", "zip_code": "6436902"}', 'משה לוי', '12-345-67', 'completed', '2025-05-12 14:00:00+03', '2025-05-12 14:30:00+03', '2025-05-10 09:15:00+03', '2025-05-12 14:30:00+03', '[{"certificate_number": "12345", "package_count": 2, "certificate_images": ["https://r2.example.com/cert1.jpg"]}]', '{"delivery_images": ["https://r2.example.com/proof1.jpg"], "priority": "high", "notes": "דחוף - תרופות"}'),

('delivery', NULL, '{"address": "שדרות בן גוריון 42", "city": "חיפה", "zip_code": "3200003"}', 'אברהם דוד', '23-456-78', 'completed', '2025-05-13 16:00:00+03', '2025-05-13 16:45:00+03', '2025-05-11 11:20:00+03', '2025-05-13 16:45:00+03', '[{"certificate_number": "12346", "package_count": 1, "certificate_images": ["https://r2.example.com/cert2.jpg"]}]', '{"delivery_images": ["https://r2.example.com/proof2.jpg"], "delivery_instructions": "קומה 3, דלת ימין"}'),

('delivery', NULL, '{"address": "רחוב ירושלים 28", "city": "פתח תקווה", "zip_code": "4951028"}', 'יוסי מזרחי', '34-567-89', 'in_progress', '2025-06-20 10:00:00+03', NULL, '2025-05-12 08:30:00+03', '2025-06-18 09:15:00+03', '[{"certificate_number": "12347", "package_count": 3, "certificate_images": []}]', '{"fragile": true, "insurance": 500}'),

-- Delivery with multiple certificates
('delivery', NULL, '{"address": "כיכר רבין 8", "city": "ראשון לציון", "zip_code": "7546302"}', 'דני חדד', '45-678-90', 'completed', '2025-05-15 13:00:00+03', '2025-05-15 13:20:00+03', '2025-05-13 15:45:00+03', '2025-05-15 13:20:00+03', '[{"certificate_number": "12348", "package_count": 2, "certificate_images": ["https://r2.example.com/cert3a.jpg"]}, {"certificate_number": "12349", "package_count": 1, "certificate_images": ["https://r2.example.com/cert3b.jpg"]}]', '{"delivery_images": ["https://r2.example.com/proof3.jpg"], "customer_type": "vip"}'),

-- Manofeem missions (no certificates)
('manofeem', 'crane_setup', '{"address": "אזור תעשייה צפוני", "city": "אשדוד", "zip_code": "7760001"}', 'רונן ביטון', '56-789-01', 'waiting', '2025-06-21 08:00:00+03', NULL, '2025-06-18 10:30:00+03', '2025-06-18 10:30:00+03', NULL, '{"crane_type": "mobile", "capacity": "50_ton", "setup_duration": "4_hours"}'),

('manofeem', 'maintenance', '{"address": "נמל אשדוד", "city": "אשדוד", "zip_code": "7710001"}', 'עמוס כהן', '67-890-12', 'unassigned', '2025-06-22 06:00:00+03', NULL, '2025-06-18 11:45:00+03', '2025-06-18 11:45:00+03', NULL, '{"maintenance_type": "routine", "equipment_list": "crane_001,crane_002"}'),

-- Pickup missions (no certificates)
('pickup', NULL, '{"address": "מרכז לוגיסטי", "city": "רעננה", "zip_code": "4365025"}', NULL, NULL, 'unassigned', '2025-06-19 14:00:00+03', NULL, '2025-06-18 12:00:00+03', '2025-06-18 12:00:00+03', NULL, '{"pickup_items": "medical_supplies,urgent_documents", "contact_person": "דוד כהן", "contact_phone": "050-1234567"}'),

-- Survey mission (no certificates)
('survey', NULL, '{"address": "רחוב החרושת 45", "city": "הרצליה", "zip_code": "4672245"}', 'משה לוי', '12-345-67', 'in_progress', '2025-06-19 16:00:00+03', NULL, '2025-06-17 15:20:00+03', '2025-06-18 08:30:00+03', NULL, '{"survey_type": "site_assessment", "estimated_duration": "2_hours", "equipment_needed": "measuring_tools,camera"}');