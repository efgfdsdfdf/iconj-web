-- ICONJ Supabase Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE (Extends Supabase Auth)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'superadmin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PRODUCTS TABLE
CREATE TABLE public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    description TEXT,
    category TEXT,
    base_supplier_cost DECIMAL(12, 2) NOT NULL,
    base_selling_price DECIMAL(12, 2) NOT NULL, -- Target 30% margin
    weight_kg DECIMAL(10, 2),
    is_configurable BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PRODUCT IMAGES (Optional extraction)
-- PRODUCT CONFIGURATIONS (For electrical/complex items)

-- ORDERS TABLE
CREATE TABLE public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    total_amount DECIMAL(12, 2) NOT NULL,
    shipping_cost DECIMAL(12, 2) DEFAULT 0,
    supplier_cost DECIMAL(12, 2) NOT NULL,
    estimated_profit DECIMAL(12, 2) NOT NULL,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    order_status TEXT DEFAULT 'pending_payment' CHECK (order_status IN ('pending_payment', 'payment_confirmed', 'awaiting_supplier', 'in_production', 'shipped', 'in_transit', 'delivered', 'cancelled')),
    tracking_number TEXT,
    paystack_reference TEXT UNIQUE,
    delivery_address JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ORDER ITEMS TABLE
CREATE TABLE public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    configuration_details JSONB, -- Stores selected variants/electrical options
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SUPPLIER BALANCE TABLE
CREATE TABLE public.supplier_balance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    current_balance DECIMAL(15, 2) DEFAULT 0,
    total_deposited DECIMAL(15, 2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SUPPLIER TRANSACTIONS
CREATE TABLE public.supplier_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    amount DECIMAL(12, 2) NOT NULL,
    transaction_type TEXT CHECK (transaction_type IN ('deposit', 'payment', 'refund')),
    order_id UUID REFERENCES public.orders(id), -- If applicable
    reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Customers can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- Everyone can view active products
CREATE POLICY "Everyone can view active products" ON public.products FOR SELECT USING (is_active = TRUE);

-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
-- Admins can manage all orders
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- ==========================================
-- SEED DATA: INITIAL PRODUCT CATALOG
-- (Qingyuan Leyou Household Products Co., Ltd.)
-- ==========================================

INSERT INTO public.products (id, name, sku, category, base_supplier_cost, base_selling_price, is_configurable)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Premium Motorized Roller Blinds', 'QL-MRB-001', 'Smart Motorized Blinds', 87500.00, 125000.00, TRUE),
  ('22222222-2222-2222-2222-222222222222', '100% Blackout Bedroom Shades', 'QL-BOS-002', 'Blackout Blinds', 59500.00, 85000.00, TRUE),
  ('33333333-3333-3333-3333-333333333333', 'Smart Curtain Track System (Wifi)', 'QL-SCT-003', 'Smart Curtain Systems', 105000.00, 150000.00, TRUE),
  ('44444444-4444-4444-4444-444444444444', 'Insulating Honeycomb Cellular Blinds', 'QL-HCB-004', 'Honeycomb Blinds', 77000.00, 110000.00, TRUE),
  ('55555555-5555-5555-5555-555555555555', 'Linen Roman Shades', 'QL-LRS-005', 'Curtains & Roman Shades', 66500.00, 95000.00, TRUE),
  ('66666666-6666-6666-6666-666666666666', 'Weatherproof Outdoor Patio Shades', 'QL-OPS-006', 'Outdoor Shades', 154000.00, 220000.00, TRUE);


