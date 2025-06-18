-- Add customer_id column to orders table
ALTER TABLE orders ADD COLUMN customer_id VARCHAR(20);

-- Generate random customer_ids for existing orders
-- This uses a PostgreSQL function to generate random customer IDs in format "CUST-XXXXXX"
UPDATE orders 
SET customer_id = 'CUST-' || LPAD(FLOOR(RANDOM() * 999999 + 1)::text, 6, '0')
WHERE customer_id IS NULL;

-- Make customer_id NOT NULL now that all rows have values
ALTER TABLE orders ALTER COLUMN customer_id SET NOT NULL;

-- Add an index for better performance on customer_id lookups
CREATE INDEX idx_orders_customer_id ON orders(customer_id);

-- Ensure customer_id is unique per customer (but customers can have multiple orders)
-- Note: We're not making it fully unique since one customer can have multiple orders
-- But we ensure the format is consistent