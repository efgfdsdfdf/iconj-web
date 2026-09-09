-- ICONJ Phase 3: Referrals, Wishlists, and Coupons
-- This migration is ADDITIVE — it does NOT touch existing tables

-- ==========================================
-- 1. REFERRAL PARTNERS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.referral_partners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    partner_type TEXT NOT NULL DEFAULT 'affiliate', -- 'affiliate', 'influencer', 'customer'
    referral_code TEXT UNIQUE NOT NULL,
    commission_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage', 'fixed'
    commission_value DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    is_active BOOLEAN DEFAULT true,
    total_referrals INTEGER DEFAULT 0,
    total_earned DECIMAL(12,2) DEFAULT 0,
    total_paid DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_partners_user ON public.referral_partners(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_partners_code ON public.referral_partners(referral_code);

-- ==========================================
-- 2. REFERRAL TRACKING
-- ==========================================
CREATE TABLE IF NOT EXISTS public.referral_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    partner_id UUID NOT NULL REFERENCES public.referral_partners(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, CONVERTED, REJECTED
    commission_earned DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    converted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referral_tracking_partner ON public.referral_tracking(partner_id);

-- ==========================================
-- 3. WISHLISTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);

-- ==========================================
-- 4. COUPONS & DISCOUNTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage', 'fixed_amount', 'free_shipping'
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2),
    max_discount_amount DECIMAL(10,2),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    usage_limit INTEGER,
    times_used INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- ==========================================
-- 5. COUPON USAGE TRACKING
-- ==========================================
CREATE TABLE IF NOT EXISTS public.coupon_usages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    discount_applied DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(coupon_id, order_id)
);

-- ==========================================
-- 6. EXTEND PROFILES FOR PREFERENCES
-- ==========================================
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS marketing_frequency TEXT DEFAULT 'all', -- 'all', 'weekly', 'monthly'
    ADD COLUMN IF NOT EXISTS accepts_sms BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS accepts_whatsapp BOOLEAN DEFAULT false;

-- ==========================================
-- 7. RLS POLICIES
-- ==========================================
ALTER TABLE public.referral_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "Users can view their own partner account" ON public.referral_partners FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can manage their own wishlist" ON public.wishlists FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING (is_active = true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Service role full access
DO $$ BEGIN CREATE POLICY "Service role manages referrals" ON public.referral_partners FOR ALL USING (TRUE); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role manages referral tracking" ON public.referral_tracking FOR ALL USING (TRUE); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role manages wishlists" ON public.wishlists FOR ALL USING (TRUE); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role manages coupons" ON public.coupons FOR ALL USING (TRUE); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role manages coupon usages" ON public.coupon_usages FOR ALL USING (TRUE); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
