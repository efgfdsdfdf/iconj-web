-- ICONJ Phase 3: Helper Postgres functions
-- Run this in Supabase SQL Editor

-- Increments coupon usage counter safely
CREATE OR REPLACE FUNCTION increment_coupon_usage(c_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.coupons
  SET times_used = times_used + 1
  WHERE id = c_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
