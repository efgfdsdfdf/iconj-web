DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', pol.policyname);
    END LOOP;
END
$$;

-- Create minimal necessary policies
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (true);

CREATE POLICY "Authenticated Insert" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated Update" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated Delete" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (true);
