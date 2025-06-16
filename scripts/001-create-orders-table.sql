-- Create orders table for Medi-Kal logistics in Supabase
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    client_name TEXT,
    client_phone TEXT,
    address TEXT NOT NULL,
    packages_count INTEGER NOT NULL CHECK (packages_count > 0),
    driver TEXT,
    car_number TEXT,
    status TEXT NOT NULL DEFAULT 'unassigned' CHECK (status IN ('unassigned', 'waiting', 'in_progress', 'completed', 'problem')),
    time_delivered TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON orders(driver);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on orders" ON orders
FOR ALL USING (true);
