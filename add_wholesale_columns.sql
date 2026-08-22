-- Add Minimum Order Quantity (MOQ)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS moq INTEGER DEFAULT 1;

-- Add Pricing Tiers
-- Format: [{"minQty": 1, "maxQty": 5, "price": 8000}, ...]
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS pricing_tiers JSONB DEFAULT '[]'::jsonb;
