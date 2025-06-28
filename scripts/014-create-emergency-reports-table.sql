
CREATE TABLE emergency_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id BIGINT REFERENCES drivers(id) ON DELETE CASCADE,
    car_id BIGINT REFERENCES cars(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'general',
    form_completion_date TEXT,
    identifier_name TEXT,
    incident_date TEXT,
    incident_time TEXT,
    incident_description TEXT,
    vehicle_number TEXT,
    driver_at_time TEXT,
    employee_involved TEXT,
    identifier_signature TEXT,
    crash_data JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_emergency_reports_driver_id ON emergency_reports (driver_id);
CREATE INDEX idx_emergency_reports_car_id ON emergency_reports (car_id);
CREATE INDEX idx_emergency_reports_created_at ON emergency_reports (created_at);
