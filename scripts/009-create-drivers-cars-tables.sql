-- Create drivers table
CREATE TABLE drivers (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    license_number TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Create cars table
CREATE TABLE cars (
    id BIGSERIAL PRIMARY KEY,
    plate_number TEXT NOT NULL UNIQUE,
    make TEXT,
    model TEXT,
    year TEXT,
    color TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Create indexes for drivers
CREATE INDEX idx_drivers_name ON drivers(name);
CREATE INDEX idx_drivers_is_active ON drivers(is_active);
CREATE INDEX idx_drivers_phone ON drivers(phone);

-- Create indexes for cars
CREATE INDEX idx_cars_plate_number ON cars(plate_number);
CREATE INDEX idx_cars_is_active ON cars(is_active);
CREATE INDEX idx_cars_make_model ON cars(make, model);

-- Insert sample drivers
INSERT INTO drivers (name, phone, email, license_number, is_active, metadata) VALUES
('משה לוי', '050-1234567', 'moshe.levi@company.com', '12345678', true, '{"experience_years": 5, "certifications": ["crane_operator"]}'),
('אברהם דוד', '052-9876543', 'abraham.david@company.com', '87654321', true, '{"experience_years": 8, "certifications": ["heavy_vehicle"]}'),
('יוסי מזרחי', '053-5555444', 'yossi.mizrahi@company.com', '11223344', true, '{"experience_years": 3, "certifications": ["delivery"]}'),
('דני חדד', '054-7777888', 'danny.hadad@company.com', '44332211', true, '{"experience_years": 6, "certifications": ["crane_operator", "heavy_vehicle"]}'),
('רונן ביטון', '055-9999000', 'ronen.biton@company.com', '55667788', true, '{"experience_years": 10, "certifications": ["crane_operator", "site_manager"]}'),
('עמוס כהן', '050-1111222', 'amos.cohen@company.com', '99887766', false, '{"experience_years": 2, "certifications": ["delivery"], "notes": "חופש ארוך"}');

-- Insert sample cars
INSERT INTO cars (plate_number, make, model, year, color, is_active, metadata) VALUES
('12-345-67', 'איווקו', 'Daily', '2020', 'לבן', true, '{"capacity": "3.5_ton", "fuel_type": "diesel", "last_service": "2024-12-01"}'),
('23-456-78', 'מרצדס', 'Sprinter', '2019', 'כחול', true, '{"capacity": "5_ton", "fuel_type": "diesel", "last_service": "2024-11-15"}'),
('34-567-89', 'פורד', 'Transit', '2021', 'אפור', true, '{"capacity": "2_ton", "fuel_type": "diesel", "last_service": "2024-12-10"}'),
('45-678-90', 'איווקו', 'Stralis', '2018', 'אדום', true, '{"capacity": "12_ton", "fuel_type": "diesel", "last_service": "2024-10-20"}'),
('56-789-01', 'מאן', 'TGX', '2022', 'שחור', true, '{"capacity": "25_ton", "fuel_type": "diesel", "crane_capacity": "50_ton"}'),
('67-890-12', 'וולוו', 'FH', '2017', 'כסף', false, '{"capacity": "20_ton", "fuel_type": "diesel", "notes": "בתיקון"}');