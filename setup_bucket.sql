-- Create the product-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to product images
DROP POLICY IF EXISTS "Public Product Images Read" ON storage.objects;
CREATE POLICY "Public Product Images Read" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

-- Allow authenticated admins to upload (or just authenticated users for now)
DROP POLICY IF EXISTS "Authenticated Product Image Upload" ON storage.objects;
CREATE POLICY "Authenticated Product Image Upload" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'product-images');
