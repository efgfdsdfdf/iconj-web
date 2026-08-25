-- Ensure the product-images bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public View product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own product-images" ON storage.objects;

-- Create policies for product-images
CREATE POLICY "Public View product-images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product-images" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can update own product-images" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (bucket_id = 'product-images' AND owner = auth.uid())
WITH CHECK (bucket_id = 'product-images' AND owner = auth.uid());

CREATE POLICY "Authenticated users can delete own product-images" 
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id = 'product-images' AND owner = auth.uid());
