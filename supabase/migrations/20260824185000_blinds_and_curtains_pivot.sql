-- =======================================================================================
-- ICONJ PIVOT: BLINDS, CURTAINS & WINDOW TREATMENTS
-- 20260824185000_blinds_and_curtains_pivot.sql
-- =======================================================================================

-- 1. CLEAN UP BABY PRODUCTS & TEST ORDERS
-- We must clear orders first to avoid foreign key violations on order_items
DELETE FROM public.order_items;
DELETE FROM public.seller_orders;
DELETE FROM public.payments;
DELETE FROM public.orders;
DELETE FROM public.categories;
DELETE FROM public.products;

-- 2. NEW CATEGORIES FOR WINDOW TREATMENTS
INSERT INTO public.categories (id, name, slug, is_active) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Roller Blinds', 'roller-blinds', TRUE),
  ('c2222222-2222-2222-2222-222222222222', 'Zebra Blinds', 'zebra-blinds', TRUE),
  ('c3333333-3333-3333-3333-333333333333', 'Venetian Blinds', 'venetian-blinds', TRUE),
  ('c4444444-4444-4444-4444-444444444444', 'Roman Blinds', 'roman-blinds', TRUE),
  ('c5555555-5555-5555-5555-555555555555', 'Curtains', 'curtains', TRUE);

-- 3. PRODUCT CONFIGURATION RULES
-- This allows sellers to define min/max sizes and pricing models (e.g. per square meter)
CREATE TABLE IF NOT EXISTS public.product_configuration_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    pricing_model TEXT DEFAULT 'per_sqm' CHECK (pricing_model IN ('fixed', 'per_sqm', 'per_meter')),
    min_width_cm DECIMAL(10,2),
    max_width_cm DECIMAL(10,2),
    min_height_cm DECIMAL(10,2),
    max_height_cm DECIMAL(10,2),
    motorization_available BOOLEAN DEFAULT FALSE,
    motorization_fee DECIMAL(12,2) DEFAULT 0,
    installation_available BOOLEAN DEFAULT TRUE,
    base_installation_fee DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. INSTALLERS SYSTEM
CREATE TABLE IF NOT EXISTS public.installers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) NOT NULL,
    business_name TEXT,
    service_areas TEXT[], -- e.g., ['Lagos', 'Abuja']
    is_verified BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. MEASUREMENT REQUESTS
CREATE TABLE IF NOT EXISTS public.measurement_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id), -- Nullable if guest
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address JSONB NOT NULL, -- { street, city, state }
    window_count INTEGER,
    preferred_date DATE,
    preferred_time TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'completed', 'cancelled')),
    installer_id UUID REFERENCES public.installers(id),
    final_measurements JSONB, -- Stored by installer after visit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. INSTALLATION JOBS
CREATE TABLE IF NOT EXISTS public.installation_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    installer_id UUID REFERENCES public.installers(id),
    fee_amount DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'pending_assignment' CHECK (status IN ('pending_assignment', 'assigned', 'accepted', 'scheduled', 'in_progress', 'completed', 'cancelled')),
    scheduled_date TIMESTAMP WITH TIME ZONE,
    completion_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. UPDATE ORDER ITEMS FOR CUSTOM MEASUREMENTS
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS custom_width_cm DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS custom_height_cm DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS is_motorized BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS requires_installation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS installation_fee DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS measurement_notes TEXT;

-- 8. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.product_configuration_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installation_jobs ENABLE ROW LEVEL SECURITY;

-- Public can read config rules for active products
CREATE POLICY "Public can view active product rules" ON public.product_configuration_rules FOR SELECT USING (TRUE);

-- Installers policies
CREATE POLICY "Public can view verified installers" ON public.installers FOR SELECT USING (is_verified = TRUE AND status = 'active');
CREATE POLICY "Installers view own profile" ON public.installers FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Installers view assigned jobs" ON public.installation_jobs FOR SELECT USING (installer_id IN (SELECT id FROM public.installers WHERE profile_id = auth.uid()));

-- Measurement requests
CREATE POLICY "Users view own measurement requests" ON public.measurement_requests FOR SELECT USING (user_id = auth.uid());

-- Admin fallback policies
CREATE POLICY "Admins manage configuration_rules" ON public.product_configuration_rules FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
CREATE POLICY "Admins manage installers" ON public.installers FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
CREATE POLICY "Admins manage measurement_requests" ON public.measurement_requests FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
CREATE POLICY "Admins manage installation_jobs" ON public.installation_jobs FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));

-- 9. DUMMY PRODUCT SEED
INSERT INTO public.products (id, name, sku, category_id, base_supplier_cost, base_selling_price, is_active, is_retail_enabled, is_wholesale_enabled) VALUES 
('f1111111-1111-1111-1111-111111111111', 'Premium Motorized Zebra Blinds', 'ICON-ZEB-001', 'c2222222-2222-2222-2222-222222222222', 25000, 35000, TRUE, TRUE, TRUE),
('f2222222-2222-2222-2222-222222222222', '100% Blackout Roller Blinds', 'ICON-ROL-002', 'c1111111-1111-1111-1111-111111111111', 18000, 25000, TRUE, TRUE, TRUE);

INSERT INTO public.product_configuration_rules (product_id, pricing_model, min_width_cm, max_width_cm, min_height_cm, max_height_cm, motorization_available, motorization_fee, installation_available, base_installation_fee) VALUES
('f1111111-1111-1111-1111-111111111111', 'per_sqm', 50, 300, 50, 400, TRUE, 75000, TRUE, 10000),
('f2222222-2222-2222-2222-222222222222', 'per_sqm', 30, 250, 30, 300, FALSE, 0, TRUE, 10000);
