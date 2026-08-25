-- Drop the potentially broken policies
DROP POLICY IF EXISTS "Public View product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own product-images" ON storage.objects;

-- Create highly permissive policies for product-images to resolve schema errors
CREATE POLICY "Public View product-images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product-images" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can update product-images" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can delete product-images" 
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id = 'product-images');
