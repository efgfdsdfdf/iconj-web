-- ICON Marketplace Architecture - Stage 1 Core Schema Update

-- 1. ROLES & CAPABILITIES
-- Expanding role system to allow multiple roles per user
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('customer', 'wholesale', 'seller', 'admin', 'superadmin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Note: We retain public.profiles.role as the "primary" role for backward compatibility,
-- but the platform should eventually use user_roles for multi-role capabilities.

-- 2. BUSINESS & SELLER ENTITIES
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id) NOT NULL,
    business_name TEXT NOT NULL,
    registration_number TEXT,
    tax_id TEXT,
    business_type TEXT, -- e.g., 'retail', 'manufacturer', 'distributor'
    address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sellers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) NOT NULL,
    business_id UUID REFERENCES public.businesses(id),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_verification', 'approved', 'suspended', 'rejected')),
    seller_type TEXT DEFAULT 'third_party' CHECK (seller_type IN ('third_party', 'icon_official', 'reseller')),
    commission_rate DECIMAL(5, 2), -- Optional specific commission rate
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.seller_verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.seller_payout_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    store_name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    return_policy TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SUPPLIER ENTITIES (Dropshipping/Sourcing)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    country TEXT,
    platform TEXT, -- e.g., 'Alibaba', '1688', 'Direct'
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    reliability_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. MARKETPLACE PRODUCTS UPDATE
-- Create Categories for hierarchical organization
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    parent_id UUID REFERENCES public.categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modify existing products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.sellers(id),
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id),
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id),
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id),
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('draft', 'pending', 'approved', 'rejected', 'changes_required')),
ADD COLUMN IF NOT EXISTS fulfillment_type TEXT DEFAULT 'icon_fulfilled' CHECK (fulfillment_type IN ('icon_fulfilled', 'seller_fulfilled', 'seller_logistics', 'dropship')),
ADD COLUMN IF NOT EXISTS is_wholesale_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_retail_enabled BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    sku TEXT UNIQUE,
    barcode TEXT,
    name TEXT NOT NULL, -- e.g., "Red - Large"
    attributes JSONB, -- {"color": "red", "size": "L"}
    price_adjustment DECIMAL(12, 2) DEFAULT 0, -- added to base price
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wholesale_pricing (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    min_quantity INTEGER NOT NULL,
    max_quantity INTEGER,
    price_per_unit DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    available_quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    location TEXT, -- e.g., 'ICON Warehouse A', 'Seller Premise'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.supplier_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    supplier_sku TEXT,
    cost_price DECIMAL(12, 2) NOT NULL,
    moq INTEGER DEFAULT 1,
    lead_time_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wholesale_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- User Roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
-- Sellers/Businesses
CREATE POLICY "Users can view own business" ON public.businesses FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Users can update own business" ON public.businesses FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Users can view own seller profile" ON public.sellers FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Public can view active stores" ON public.stores FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Sellers can manage own store" ON public.stores FOR ALL USING (
    seller_id IN (SELECT id FROM public.sellers WHERE profile_id = auth.uid())
);
-- Products & Marketplace
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can view variants of active products" ON public.product_variants FOR SELECT USING (
    product_id IN (SELECT id FROM public.products WHERE is_active = TRUE AND approval_status = 'approved')
);
CREATE POLICY "Public can view wholesale pricing" ON public.wholesale_pricing FOR SELECT USING (
    product_id IN (SELECT id FROM public.products WHERE is_active = TRUE AND is_wholesale_enabled = TRUE AND approval_status = 'approved')
);
-- Inventory
CREATE POLICY "Public can view inventory" ON public.inventory FOR SELECT USING (TRUE);

-- Ensure Admins have access to everything (Fallback Policy)
CREATE POLICY "Admins manage user_roles" ON public.user_roles FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
CREATE POLICY "Admins manage businesses" ON public.businesses FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
CREATE POLICY "Admins manage sellers" ON public.sellers FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
CREATE POLICY "Admins manage seller_verifications" ON public.seller_verifications FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
CREATE POLICY "Admins manage payout_accounts" ON public.seller_payout_accounts FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
CREATE POLICY "Admins manage stores" ON public.stores FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
CREATE POLICY "Admins manage product_variants" ON public.product_variants FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
CREATE POLICY "Admins manage wholesale_pricing" ON public.wholesale_pricing FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
CREATE POLICY "Admins manage inventory" ON public.inventory FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
CREATE POLICY "Admins manage suppliers" ON public.suppliers FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
CREATE POLICY "Admins manage supplier_products" ON public.supplier_products FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
