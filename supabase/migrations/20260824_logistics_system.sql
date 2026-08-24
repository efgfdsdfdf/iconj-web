-- 1. Create Freight Forwarders Table
CREATE TABLE IF NOT EXISTS freight_forwarders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  china_warehouse_name TEXT,
  china_warehouse_address TEXT,
  china_warehouse_contact TEXT,
  china_warehouse_phone TEXT,
  iconj_account_code TEXT,
  air_freight_rate NUMERIC,
  sea_freight_rate NUMERIC,
  min_chargeable_weight NUMERIC,
  processing_time TEXT,
  transit_time TEXT,
  nigeria_delivery_method TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Alter Suppliers Table safely
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'alibaba_store_url') THEN
    ALTER TABLE suppliers ADD COLUMN alibaba_store_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'contact_name') THEN
    ALTER TABLE suppliers ADD COLUMN contact_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'default_shipping_method') THEN
    ALTER TABLE suppliers ADD COLUMN default_shipping_method TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'notes') THEN
    ALTER TABLE suppliers ADD COLUMN notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'status') THEN
    ALTER TABLE suppliers ADD COLUMN status TEXT DEFAULT 'ACTIVE';
  END IF;
END $$;

-- 3. Alter Orders Table for Dropshipping Logistics
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'supplier_order_number') THEN
    ALTER TABLE orders ADD COLUMN supplier_order_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'supplier_tracking_number') THEN
    ALTER TABLE orders ADD COLUMN supplier_tracking_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'forwarder_id') THEN
    ALTER TABLE orders ADD COLUMN forwarder_id UUID REFERENCES freight_forwarders(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'forwarder_tracking_number') THEN
    ALTER TABLE orders ADD COLUMN forwarder_tracking_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'china_warehouse_tracking') THEN
    ALTER TABLE orders ADD COLUMN china_warehouse_tracking TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'logistics_status') THEN
    ALTER TABLE orders ADD COLUMN logistics_status TEXT DEFAULT 'PENDING';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'logistics_cost') THEN
    ALTER TABLE orders ADD COLUMN logistics_cost NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'forwarder_chargeable_weight') THEN
    ALTER TABLE orders ADD COLUMN forwarder_chargeable_weight NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'expected_quantity') THEN
    ALTER TABLE orders ADD COLUMN expected_quantity INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'received_quantity') THEN
    ALTER TABLE orders ADD COLUMN received_quantity INTEGER;
  END IF;
END $$;

-- 4. Logistics Issues Table
CREATE TABLE IF NOT EXISTS logistics_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL,
  description TEXT,
  expected_data JSONB,
  received_data JSONB,
  status TEXT DEFAULT 'OPEN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
