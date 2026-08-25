-- Run this in your Supabase SQL Editor to fix the Infinite Recursion error

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Get the role of the current user, bypassing RLS
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN v_role IN ('admin', 'superadmin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now update the policies to use this function instead of direct SELECTs
-- which trigger RLS and cause infinite recursion

DROP POLICY IF EXISTS "Admins manage user_roles" ON public.user_roles;
CREATE POLICY "Admins manage user_roles" ON public.user_roles FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage businesses" ON public.businesses;
CREATE POLICY "Admins manage businesses" ON public.businesses FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage sellers" ON public.sellers;
CREATE POLICY "Admins manage sellers" ON public.sellers FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage seller_verifications" ON public.seller_verifications;
CREATE POLICY "Admins manage seller_verifications" ON public.seller_verifications FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage payout_accounts" ON public.seller_payout_accounts;
CREATE POLICY "Admins manage payout_accounts" ON public.seller_payout_accounts FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage stores" ON public.stores;
CREATE POLICY "Admins manage stores" ON public.stores FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage product_variants" ON public.product_variants;
CREATE POLICY "Admins manage product_variants" ON public.product_variants FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage wholesale_pricing" ON public.wholesale_pricing;
CREATE POLICY "Admins manage wholesale_pricing" ON public.wholesale_pricing FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage inventory" ON public.inventory;
CREATE POLICY "Admins manage inventory" ON public.inventory FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage suppliers" ON public.suppliers;
CREATE POLICY "Admins manage suppliers" ON public.suppliers FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage supplier_products" ON public.supplier_products;
CREATE POLICY "Admins manage supplier_products" ON public.supplier_products FOR ALL USING (public.is_admin());
