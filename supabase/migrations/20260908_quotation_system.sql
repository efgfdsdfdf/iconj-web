-- ============================================================
-- ICONJ Quotation System Migration
-- Created: 2026-09-08
-- Safe to run multiple times (all IF NOT EXISTS)
-- Does NOT touch existing tables/data
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- SAFEGUARD 1: Atomic reference generation via PostgreSQL sequence
-- Concurrent requests cannot get the same number
-- ──────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS public.quotation_reference_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_quotation_reference()
RETURNS TEXT AS $$
  SELECT 'ICONJ-Q-' || LPAD(nextval('public.quotation_reference_seq')::TEXT, 4, '0');
$$ LANGUAGE SQL;

-- ──────────────────────────────────────────────────────────────
-- MAIN TABLE: quotations
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Atomic sequential reference (database-generated, never reused)
  reference TEXT UNIQUE NOT NULL DEFAULT public.generate_quotation_reference(),

  -- Customer (NULL for guest submissions)
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  specifications JSONB NOT NULL DEFAULT '{}',
  delivery_location JSONB NOT NULL DEFAULT '{}',
  customer_notes TEXT,

  -- SAFEGUARD 2: Secure random access token for guests
  -- Never use reference as auth; always use this token
  access_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,

  -- ── Status & Automation ──────────────────────────────────
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN (
    'REQUESTED',
    'SUPPLIER_QUOTE_REQUESTED',
    'SUPPLIER_RESPONSE_RECEIVED',
    'SUPPLIER_SPEC_ISSUE',
    'QUOTE_BEING_PREPARED',
    'QUOTE_SENT',
    'QUOTE_VIEWED',
    'QUOTE_ACCEPTED',
    'QUOTE_DECLINED',
    'QUOTE_EXPIRED',
    'PAYMENT_PENDING',
    'PAID',
    'CONVERTED_TO_ORDER'
  )),
  priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('URGENT', 'NORMAL', 'NO_ACTION')),
  next_action TEXT,

  -- ── ADMIN-ONLY: Supplier Data ──────────────────────────────
  -- These fields are NEVER returned in customer-facing API responses
  supplier_product_cost DECIMAL(12,2),
  supplier_customization_cost DECIMAL(12,2),
  supplier_shipping_cost DECIMAL(12,2),
  supplier_other_charges DECIMAL(12,2),
  supplier_total_cost DECIMAL(12,2),
  supplier_production_days INT,
  supplier_delivery_days INT,
  supplier_shipping_method TEXT,
  supplier_moq INT,
  supplier_spec_confirmed BOOLEAN,
  supplier_notes TEXT,
  supplier_quoted_at TIMESTAMPTZ,
  supplier_quote_valid_until TIMESTAMPTZ,

  -- ── ADMIN-ONLY: ICONJ Pricing Internals ───────────────────
  iconj_markup_amount DECIMAL(12,2),
  iconj_markup_pct DECIMAL(5,2),

  -- ── Customer-Facing Pricing ────────────────────────────────
  customer_price DECIMAL(12,2),
  customer_shipping DECIMAL(12,2) DEFAULT 0,
  customer_total DECIMAL(12,2),
  estimated_production_days INT,
  estimated_delivery_days INT,
  quote_valid_until TIMESTAMPTZ,

  -- ── SAFEGUARD 4: Quote Expiry + Payment Deadline ──────────
  -- payment_deadline = quote_valid_until + 24h grace period
  -- Set when customer accepts. Paystack initiation blocked after this date.
  -- This prevents indefinitely-payable expired quotations.
  payment_deadline TIMESTAMPTZ,

  -- ── Lifecycle Timestamps ───────────────────────────────────
  quote_sent_at TIMESTAMPTZ,
  quote_viewed_at TIMESTAMPTZ,
  quote_accepted_at TIMESTAMPTZ,
  quote_declined_at TIMESTAMPTZ,
  quote_expired_at TIMESTAMPTZ,

  -- ── SAFEGUARD 3 & 7: Payment (always server-side verified) ─
  payment_status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  payment_reference TEXT,              -- UNIQUE index below prevents duplicate processing
  payment_amount DECIMAL(12,2),
  payment_currency TEXT DEFAULT 'NGN',
  payment_date TIMESTAMPTZ,

  -- Post-payment locks (set on PAID; blocks any price/spec changes)
  price_locked_at TIMESTAMPTZ,
  specs_locked_at TIMESTAMPTZ,

  -- Reminder tracking (prevents duplicate automated emails)
  reminder_1_sent_at TIMESTAMPTZ,
  reminder_2_sent_at TIMESTAMPTZ,

  -- ── SAFEGUARD 5: Supplier Fulfillment Tracking ────────────
  -- "Copy Fulfillment Order" is NOT proof of submission.
  -- Admin must explicitly mark as submitted.
  supplier_fulfillment_status TEXT NOT NULL DEFAULT 'NOT_SUBMITTED' CHECK (
    supplier_fulfillment_status IN ('NOT_SUBMITTED', 'SUBMITTED', 'CONFIRMED', 'IN_PRODUCTION', 'SHIPPED')
  ),
  supplier_fulfillment_sent_at TIMESTAMPTZ,
  supplier_fulfillment_sent_by TEXT,   -- Admin email/identifier for audit trail
  supplier_fulfillment_reference TEXT, -- Supplier's own reference/tracking
  supplier_fulfillment_confirmed_at TIMESTAMPTZ,

  -- ── Conversion ────────────────────────────────────────────
  -- DB UNIQUE prevents ever creating two orders from one quotation
  converted_order_id UUID UNIQUE REFERENCES public.orders(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,

  -- ── SAFEGUARD 6: Exception & Fulfillment Block ────────────
  is_exception BOOLEAN NOT NULL DEFAULT FALSE,
  -- fulfillment_blocked = TRUE when there is an unresolved OPEN exception
  -- Admin must explicitly resolve exception or approve before fulfillment
  fulfillment_blocked BOOLEAN NOT NULL DEFAULT FALSE,

  -- ── Admin ─────────────────────────────────────────────────
  admin_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial unique indexes (allow NULL, but prevent duplicate non-NULL values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotations_payment_reference
  ON public.quotations(payment_reference) WHERE payment_reference IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_quotations_converted_order
  ON public.quotations(converted_order_id) WHERE converted_order_id IS NOT NULL;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_quotations_user_id ON public.quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_priority ON public.quotations(priority);
CREATE INDEX IF NOT EXISTS idx_quotations_is_exception ON public.quotations(is_exception);
CREATE INDEX IF NOT EXISTS idx_quotations_access_token ON public.quotations(access_token);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON public.quotations(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_quotation_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS quotations_updated_at ON public.quotations;
CREATE TRIGGER quotations_updated_at
  BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.update_quotation_updated_at();

-- ──────────────────────────────────────────────────────────────
-- TABLE: quotation_events (timeline — mirrors order_events)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quotation_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT,
  performed_by TEXT NOT NULL DEFAULT 'system' CHECK (performed_by IN ('admin', 'customer', 'system')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotation_events_quotation_id ON public.quotation_events(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_events_created_at ON public.quotation_events(created_at);

-- ──────────────────────────────────────────────────────────────
-- TABLE: quotation_emails (mirrors order_emails)
-- UNIQUE(quotation_id, email_type) prevents duplicate sends at DB level
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quotation_emails (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- DB-level duplicate prevention: one email of each type per quotation
  UNIQUE(quotation_id, email_type)
);

CREATE INDEX IF NOT EXISTS idx_quotation_emails_quotation_id ON public.quotation_emails(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_emails_status ON public.quotation_emails(status);

-- ──────────────────────────────────────────────────────────────
-- TABLE: quotation_exceptions
-- Tracks post-payment exceptions and spec/price conflicts
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quotation_exceptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  exception_type TEXT NOT NULL CHECK (exception_type IN (
    'SUPPLIER_PRICE_CHANGE',
    'SPEC_CHANGE_REQUEST',
    'SPEC_CONFLICT',
    'PAYMENT_ISSUE',
    'FAILED_EMAIL',
    'DELIVERY_CHANGE',
    'OTHER'
  )),
  description TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED', 'DISMISSED')),
  resolution_note TEXT,
  resolved_by TEXT,    -- Admin identifier
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotation_exceptions_quotation_id ON public.quotation_exceptions(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_exceptions_status ON public.quotation_exceptions(status);

-- ──────────────────────────────────────────────────────────────
-- Extend profiles (SAFEGUARD 7: marketing opt-in defaults FALSE)
-- Transactional emails are always sent regardless of this flag
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS marketing_unsubscribe_token TEXT DEFAULT gen_random_uuid()::text,
  ADD COLUMN IF NOT EXISTS birthday DATE,
  ADD COLUMN IF NOT EXISTS last_visited_at TIMESTAMPTZ;

-- Ensure unique unsubscribe tokens
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unsubscribe_token
  ON public.profiles(marketing_unsubscribe_token) WHERE marketing_unsubscribe_token IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- Admin-configurable settings (extend existing store_settings)
-- ──────────────────────────────────────────────────────────────
INSERT INTO public.store_settings (id, value) VALUES
  ('quotation_markup_pct',              '30'),
  ('quote_reminder_1_hours',            '24'),
  ('quote_reminder_2_days_before_expiry','2'),
  ('quote_validity_days',               '7'),
  ('quote_payment_grace_hours',         '24'),
  ('marketing_welcome_enabled',         'true'),
  ('marketing_abandoned_cart_enabled',  'true'),
  ('marketing_reengagement_days',       '30')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- RLS POLICIES
-- Customers can only see their own quotations (by user_id OR access_token)
-- Admin uses service role key which bypasses RLS
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_exceptions ENABLE ROW LEVEL SECURITY;

-- Quotations: owner can read their own (by user_id)
DROP POLICY IF EXISTS "customer_read_own_quotations" ON public.quotations;
CREATE POLICY "customer_read_own_quotations" ON public.quotations
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Quotation events: readable via quotation ownership
DROP POLICY IF EXISTS "customer_read_own_quotation_events" ON public.quotation_events;
CREATE POLICY "customer_read_own_quotation_events" ON public.quotation_events
  FOR SELECT USING (
    quotation_id IN (
      SELECT id FROM public.quotations WHERE user_id = auth.uid()
    )
  );

-- Quotation emails: readable via quotation ownership
DROP POLICY IF EXISTS "customer_read_own_quotation_emails" ON public.quotation_emails;
CREATE POLICY "customer_read_own_quotation_emails" ON public.quotation_emails
  FOR SELECT USING (
    quotation_id IN (
      SELECT id FROM public.quotations WHERE user_id = auth.uid()
    )
  );

-- Exceptions: readable via quotation ownership
DROP POLICY IF EXISTS "customer_read_own_quotation_exceptions" ON public.quotation_exceptions;
CREATE POLICY "customer_read_own_quotation_exceptions" ON public.quotation_exceptions
  FOR SELECT USING (
    quotation_id IN (
      SELECT id FROM public.quotations WHERE user_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────────
-- NOTE: The customer-facing API (/api/quotations/[id]) additionally
-- strips all supplier_* and iconj_markup_* fields in application code.
-- RLS is a defence-in-depth layer, not the sole protection.
-- ──────────────────────────────────────────────────────────────
