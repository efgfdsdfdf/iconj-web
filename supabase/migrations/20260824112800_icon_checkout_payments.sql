-- ICON Marketplace Architecture - Stage 3 Checkout & Payments Schema Update

-- 1. MODIFY ORDERS (Parent Order)
-- Remove the single supplier_id since an order can contain items from multiple sellers/suppliers
ALTER TABLE public.orders 
DROP COLUMN IF EXISTS supplier_id,
DROP COLUMN IF EXISTS supplier_cost,
DROP COLUMN IF EXISTS estimated_profit,
DROP COLUMN IF EXISTS supplier_order_status,
DROP COLUMN IF EXISTS supplier_sent,
DROP COLUMN IF EXISTS supplier_sent_at;

-- Ensure payment_status has right constraints
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders 
ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'DISPUTED'));

-- 2. SELLER ORDERS (Sub-orders)
CREATE TABLE IF NOT EXISTS public.seller_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    parent_order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    seller_id UUID REFERENCES public.sellers(id) NOT NULL,
    subtotal_amount DECIMAL(12, 2) NOT NULL,
    shipping_cost DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    status TEXT DEFAULT 'PENDING_PAYMENT' CHECK (status IN (
        'PENDING_PAYMENT', 'PAID', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED', 
        'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link order_items to seller_orders (optional but good for strict relation)
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS seller_order_id UUID REFERENCES public.seller_orders(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.sellers(id);

-- 3. PAYMENTS & WEBHOOKS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id),
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    provider TEXT DEFAULT 'PAYSTACK',
    provider_reference TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'REVERSED')),
    verification_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_id UUID REFERENCES public.payments(id),
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. COMMISSIONS
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_order_id UUID REFERENCES public.seller_orders(id) ON DELETE CASCADE NOT NULL,
    seller_id UUID REFERENCES public.sellers(id) NOT NULL,
    gross_amount DECIMAL(12, 2) NOT NULL,
    commission_rate DECIMAL(5, 2) NOT NULL, -- e.g., 10.00 for 10%
    commission_amount DECIMAL(12, 2) NOT NULL,
    seller_net_amount DECIMAL(12, 2) NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'AVAILABLE', 'PAID_OUT', 'CANCELLED', 'REFUNDED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. RLS POLICIES
ALTER TABLE public.seller_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Customers can view their own payments
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (user_id = auth.uid());

-- Sellers can view their own sub-orders and commissions
CREATE POLICY "Sellers can view own sub-orders" ON public.seller_orders FOR SELECT USING (
    seller_id IN (SELECT id FROM public.sellers WHERE profile_id = auth.uid())
);
CREATE POLICY "Sellers can update own sub-orders" ON public.seller_orders FOR UPDATE USING (
    seller_id IN (SELECT id FROM public.sellers WHERE profile_id = auth.uid())
);
CREATE POLICY "Sellers can view own commissions" ON public.commissions FOR SELECT USING (
    seller_id IN (SELECT id FROM public.sellers WHERE profile_id = auth.uid())
);

-- Admins manage everything
CREATE POLICY "Admins manage seller_orders" ON public.seller_orders FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
CREATE POLICY "Admins manage payments" ON public.payments FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
CREATE POLICY "Admins manage payment_events" ON public.payment_events FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
CREATE POLICY "Admins manage commissions" ON public.commissions FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));
