-- Migration: Create clients table and add client_id to missions
-- This creates a proper clients table and links missions to clients

-- Create clients table
CREATE TABLE clients (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    contact_person TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Create indexes for clients
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_is_active ON clients(is_active);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_created_at ON clients(created_at);

-- Add client_id to missions table
ALTER TABLE missions ADD COLUMN client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;

-- Create index for client_id in missions
CREATE INDEX idx_missions_client_id ON missions(client_id);
CREATE INDEX idx_missions_client_id_status ON missions(client_id, status);

-- Migrate existing client_name data from metadata to clients table
-- and link missions to the new clients
DO $$
DECLARE
    mission_record RECORD;
    client_record RECORD;
    client_name_value TEXT;
BEGIN
    FOR mission_record IN
        SELECT id, metadata
        FROM missions
        WHERE metadata->>'client_name' IS NOT NULL
          AND metadata->>'client_name' != ''
    LOOP
        client_name_value := mission_record.metadata->>'client_name';

        -- Check if client already exists
        SELECT * INTO client_record
        FROM clients
        WHERE name = client_name_value;

        -- If client doesn't exist, create it
        IF client_record IS NULL THEN
            INSERT INTO clients (name, phone, metadata)
            VALUES (
                client_name_value,
                mission_record.metadata->>'phone_number',
                jsonb_build_object('migrated_from_mission', mission_record.id)
            )
            RETURNING * INTO client_record;
        END IF;

        -- Update mission to reference the client
        UPDATE missions
        SET client_id = client_record.id
        WHERE id = mission_record.id;
    END LOOP;
END $$;