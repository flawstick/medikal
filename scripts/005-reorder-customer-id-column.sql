-- Reorder customer_id column to be after id column
-- PostgreSQL doesn't support column reordering directly, so we need to recreate the table

-- Step 1: Create a new table with the desired column order
CREATE TABLE orders_new (
    id BIGSERIAL PRIMARY KEY,
    customer_id TEXT,
    client_name TEXT,
    client_phone TEXT,
    address TEXT NOT NULL,
    packages_count INTEGER NOT NULL CHECK (packages_count > 0),
    driver TEXT,
    car_number TEXT,
    status TEXT NOT NULL DEFAULT 'unassigned' CHECK (status IN ('unassigned', 'waiting', 'in_progress', 'completed', 'problem')),
    time_delivered TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Step 2: Copy data from old table to new table
INSERT INTO orders_new (id, customer_id, client_name, client_phone, address, packages_count, driver, car_number, status, time_delivered, created_at, updated_at, metadata)
SELECT id, customer_id, client_name, client_phone, address, packages_count, driver, car_number, status, time_delivered, created_at, updated_at, metadata
FROM orders;

-- Step 3: Drop old table and rename new table
DROP TABLE orders;
ALTER TABLE orders_new RENAME TO orders;

-- Step 4: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON orders(driver);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_metadata ON orders USING GIN (metadata);

-- Step 5: Reset sequence for id column
SELECT setval('orders_id_seq', COALESCE((SELECT MAX(id) FROM orders), 1));

-- Step 6: Enable Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Step 7: Recreate policy
CREATE POLICY "Allow all operations on orders" ON orders
FOR ALL USING (true);