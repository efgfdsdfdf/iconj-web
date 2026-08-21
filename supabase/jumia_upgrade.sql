-- ==========================================
-- PHASE 1: JUMIA-TIER REDESIGN MIGRATION
-- ==========================================

-- 1. Upgrade the Products Table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'In Stock',
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS requires_quote BOOLEAN DEFAULT FALSE;

-- 2. Setup Storage Bucket for Product Images
-- (Note: If this fails because the bucket exists, ignore it)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Row Level Security (RLS) Policies
-- Allow anyone to read images
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'product-images' );

-- Allow authenticated admins to upload images
CREATE POLICY "Admin Upload Access" 
ON storage.objects FOR INSERT 
WITH CHECK ( 
  bucket_id = 'product-images' 
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- Allow authenticated admins to delete/update images
CREATE POLICY "Admin Update Access" 
ON storage.objects FOR UPDATE 
USING ( 
  bucket_id = 'product-images' 
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);
CREATE POLICY "Admin Delete Access" 
ON storage.objects FOR DELETE 
USING ( 
  bucket_id = 'product-images' 
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);
