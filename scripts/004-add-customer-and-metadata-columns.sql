-- Add customer_id and metadata columns to orders table
ALTER TABLE orders ADD COLUMN customer_id TEXT AFTER id;
ALTER TABLE orders ADD COLUMN metadata JSONB;

-- Create index for customer_id for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- Create index for metadata JSONB column for better querying
CREATE INDEX IF NOT EXISTS idx_orders_metadata ON orders USING GIN (metadata);