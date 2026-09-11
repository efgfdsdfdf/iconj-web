-- ICONJ DDP Management System
-- Additive tables and modifications for post-estimate workflow

-- 1. ADD DDP BUFFER TO PRODUCTS
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ddp_safety_buffer DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS alibaba_url TEXT;

-- 2. DDP ESTIMATES TABLE
CREATE TABLE IF NOT EXISTS public.ddp_estimates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id TEXT,
    standard_size TEXT,
    quantity_basis INTEGER DEFAULT 1,
    estimated_ddp DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    courier TEXT,
    supplier_notes TEXT,
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ddp_estimates_product ON public.ddp_estimates(product_id);
CREATE INDEX IF NOT EXISTS idx_ddp_estimates_current ON public.ddp_estimates(product_id) WHERE is_current = true;

-- 3. ORDER ACTUAL DDP TABLE
CREATE TABLE IF NOT EXISTS public.order_actual_ddp (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    actual_shipping DECIMAL(12,2) NOT NULL DEFAULT 0,
    actual_tax DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_actual_ddp DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    courier TEXT,
    invoice_reference TEXT,
    supplier_notes TEXT,
    variance DECIMAL(12,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_actual_ddp_order ON public.order_actual_ddp(order_id);

-- 4. SUPPLIER DEPOSITS TABLE
CREATE TABLE IF NOT EXISTS public.supplier_deposits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_type TEXT NOT NULL, -- 'CREDIT', 'DEBIT', 'REFUND'
    amount DECIMAL(12,2) NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    reference TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. RLS POLICIES (Admin Only)
ALTER TABLE public.ddp_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_actual_ddp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_deposits ENABLE ROW LEVEL SECURITY;

DO  BEGIN CREATE POLICY "Service role manages ddp_estimates" ON public.ddp_estimates FOR ALL USING (TRUE); EXCEPTION WHEN duplicate_object THEN NULL; END ;
DO  BEGIN CREATE POLICY "Service role manages order_actual_ddp" ON public.order_actual_ddp FOR ALL USING (TRUE); EXCEPTION WHEN duplicate_object THEN NULL; END ;
DO  BEGIN CREATE POLICY "Service role manages supplier_deposits" ON public.supplier_deposits FOR ALL USING (TRUE); EXCEPTION WHEN duplicate_object THEN NULL; END ;
