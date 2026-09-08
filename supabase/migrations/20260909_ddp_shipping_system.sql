-- ICONJ DDP Shipping Automation System
-- Migration: 20260909_ddp_shipping_system.sql
-- ADDITIVE ONLY — no existing columns, tables, or data are changed

-- ============================================================
-- 1. Extend products table with shipping fields
-- ============================================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS shipping_weight_kg       DECIMAL(10,3),
  ADD COLUMN IF NOT EXISTS shipping_length_cm       DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS shipping_width_cm        DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS shipping_height_cm       DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS shipping_packaging_type  TEXT,
  ADD COLUMN IF NOT EXISTS shipping_origin          TEXT DEFAULT 'China',
  ADD COLUMN IF NOT EXISTS shipping_notes           TEXT,
  ADD COLUMN IF NOT EXISTS shipping_data_status     TEXT DEFAULT 'MISSING'
    CHECK (shipping_data_status IN ('MISSING', 'PARTIAL', 'COMPLETE', 'CUSTOM_REQUIRED'));

COMMENT ON COLUMN public.products.shipping_weight_kg IS 'Per-unit actual weight in kg for DDP calculation';
COMMENT ON COLUMN public.products.shipping_data_status IS 'MISSING=no data, PARTIAL=weight only, COMPLETE=weight+dims, CUSTOM_REQUIRED=custom-size product';

-- ============================================================
-- 2. Create ddp_rates table (versioned — rates never deleted)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ddp_rates (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  weight_min_kg     DECIMAL(10,3) NOT NULL,
  weight_max_kg     DECIMAL(10,3),                       -- NULL = no upper limit
  rate_per_kg       DECIMAL(12,2),                       -- used when rate_type = 'per_kg'
  flat_rate         DECIMAL(12,2),                       -- used when rate_type = 'flat'
  rate_type         TEXT        NOT NULL DEFAULT 'per_kg'
    CHECK (rate_type IN ('per_kg', 'flat')),
  currency          TEXT        NOT NULL DEFAULT 'NGN',
  destination       TEXT        NOT NULL DEFAULT 'Nigeria',
  shipping_method   TEXT        NOT NULL DEFAULT 'DDP',
  supplier_id       UUID        REFERENCES public.suppliers(id) ON DELETE SET NULL,
  effective_from    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to      TIMESTAMPTZ,                         -- NULL = currently active
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  formula_confirmed BOOLEAN     NOT NULL DEFAULT FALSE,  -- has supplier confirmed this formula?
  notes             TEXT,
  created_by        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ddp_rates_active
  ON public.ddp_rates (destination, shipping_method, is_active, effective_from, effective_to);

COMMENT ON TABLE public.ddp_rates IS 'Versioned DDP rate brackets. Rates are never deleted — new effective_from creates a new version.';
COMMENT ON COLUMN public.ddp_rates.effective_to IS 'NULL = currently active. Set to NOW() to deactivate.';

-- ============================================================
-- 3. Seed store_settings with DDP configuration
-- ============================================================
INSERT INTO public.store_settings (id, value) VALUES
  ('ddp_volumetric_divisor',        'null'),
  ('ddp_divisor_status',            '"PENDING_CONFIRMATION"'),
  ('ddp_formula_status',            '"PENDING_CONFIRMATION"'),
  ('ddp_chargeable_weight_method',  '"MAX"'),
  ('ddp_shipping_markup_pct',       '10'),
  ('ddp_default_origin',            '"China"'),
  ('ddp_default_destination',       '"Nigeria"'),
  ('ddp_rounding_method',           '"CEIL_0.5"')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Create shipping_calculations audit table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shipping_calculations (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id                  UUID        REFERENCES public.products(id) ON DELETE SET NULL,
  order_id                    UUID        REFERENCES public.orders(id) ON DELETE SET NULL,
  quantity                    INTEGER     NOT NULL DEFAULT 1,
  -- Weight breakdown
  actual_weight_kg            DECIMAL(10,3),
  volumetric_weight_kg        DECIMAL(10,3),
  chargeable_weight_kg        DECIMAL(10,3),
  total_chargeable_weight_kg  DECIMAL(10,3),
  volumetric_divisor_used     INTEGER,
  divisor_confirmed           BOOLEAN     NOT NULL DEFAULT FALSE,
  formula_confirmed           BOOLEAN     NOT NULL DEFAULT FALSE,
  -- Rate applied
  ddp_rate_id                 UUID        REFERENCES public.ddp_rates(id) ON DELETE SET NULL,
  rate_snapshot               JSONB,                       -- immutable copy of rate at calc time
  -- Financial (supplier_ddp_cost & markup NEVER returned from public APIs)
  supplier_ddp_cost           DECIMAL(12,2),
  markup_pct                  DECIMAL(5,2),
  markup_amount               DECIMAL(12,2),
  customer_shipping_price     DECIMAL(12,2),
  -- Metadata
  currency                    TEXT        NOT NULL DEFAULT 'NGN',
  destination                 TEXT        NOT NULL DEFAULT 'Nigeria',
  calculation_status          TEXT        NOT NULL DEFAULT 'ESTIMATED'
    CHECK (calculation_status IN (
      'ESTIMATED',
      'FORMULA_CONFIRMED',
      'CUSTOM_REQUIRED',
      'MISSING_DATA',
      'PARTIAL_DATA'
    )),
  dimensions_snapshot         JSONB,
  calculated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_calc_product ON public.shipping_calculations(product_id);
CREATE INDEX IF NOT EXISTS idx_shipping_calc_order   ON public.shipping_calculations(order_id);

-- ============================================================
-- 5. Create order_shipping_snapshots (frozen at order creation)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_shipping_snapshots (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                    UUID        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  shipping_calculation_id     UUID        REFERENCES public.shipping_calculations(id) ON DELETE SET NULL,
  -- Weight totals
  total_actual_weight_kg      DECIMAL(10,3),
  total_volumetric_weight_kg  DECIMAL(10,3),
  total_chargeable_weight_kg  DECIMAL(10,3),
  -- Rate snapshot (immutable — full copy preserved forever)
  ddp_rate_id                 UUID        REFERENCES public.ddp_rates(id) ON DELETE SET NULL,
  rate_snapshot               JSONB       NOT NULL DEFAULT '{}',
  -- Financial (admin-only columns)
  supplier_ddp_cost           DECIMAL(12,2),
  markup_pct                  DECIMAL(5,2),
  markup_amount               DECIMAL(12,2),
  -- Customer-facing
  customer_shipping_price     DECIMAL(12,2) NOT NULL DEFAULT 0,
  -- Status
  formula_confirmed_at_time   BOOLEAN     NOT NULL DEFAULT FALSE,
  shipping_status             TEXT        NOT NULL DEFAULT 'ESTIMATED'
    CHECK (shipping_status IN (
      'ESTIMATED',
      'FORMULA_CONFIRMED',
      'ADMIN_CONFIRMED',
      'ADJUSTED',
      'CUSTOM_REQUIRED',
      'FREE'
    )),
  confirmed_by                TEXT,
  confirmed_at                TIMESTAMPTZ,
  admin_notes                 TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id)
);

COMMENT ON TABLE public.order_shipping_snapshots IS 'Immutable shipping snapshot per order. Rate changes never affect this table.';

-- ============================================================
-- 6. Extend orders table
-- ============================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_status      TEXT DEFAULT 'ESTIMATED'
    CHECK (shipping_status IN (
      'ESTIMATED', 'FORMULA_CONFIRMED', 'ADMIN_CONFIRMED',
      'CUSTOM_REQUIRED', 'ADJUSTED', 'FREE'
    )),
  ADD COLUMN IF NOT EXISTS estimated_shipping   DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confirmed_shipping   DECIMAL(12,2);

-- ============================================================
-- 7. Create supplier_shipping_quotes table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.supplier_shipping_quotes (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID        REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id       UUID        REFERENCES public.products(id) ON DELETE SET NULL,
  supplier_id      UUID        REFERENCES public.suppliers(id) ON DELETE SET NULL,
  quantity         INTEGER,
  dimensions       JSONB,
  destination      TEXT        NOT NULL DEFAULT 'Nigeria',
  requested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  requested_by     TEXT,
  responded_at     TIMESTAMPTZ,
  quoted_amount    DECIMAL(12,2),
  status           TEXT        NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'RESPONDED', 'ACCEPTED', 'REJECTED')),
  notes            TEXT,
  idempotency_key  TEXT        UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_supplier_shipping_quotes_order ON public.supplier_shipping_quotes(order_id);

-- ============================================================
-- 8. RLS Policies
-- ============================================================

-- ddp_rates: admin read/write, public cannot access
ALTER TABLE public.ddp_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage DDP rates"
  ON public.ddp_rates FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- shipping_calculations: admin read/write only (contains supplier costs)
ALTER TABLE public.shipping_calculations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage shipping calculations"
  ON public.shipping_calculations FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- order_shipping_snapshots: admin full access, user can read own order snapshots (customer price only — enforced at API level)
ALTER TABLE public.order_shipping_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage order shipping snapshots"
  ON public.order_shipping_snapshots FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Users can read their own order shipping snapshot"
  ON public.order_shipping_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_shipping_snapshots.order_id
        AND o.user_id = auth.uid()
    )
  );

-- supplier_shipping_quotes: admin only
ALTER TABLE public.supplier_shipping_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage supplier shipping quotes"
  ON public.supplier_shipping_quotes FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
