-- 1. Create a sequence for seller IDs
CREATE SEQUENCE IF NOT EXISTS seller_id_seq START 1;

-- 2. Add the column to the sellers table
ALTER TABLE public.sellers 
ADD COLUMN IF NOT EXISTS seller_identifier TEXT UNIQUE;

-- 3. Backfill existing sellers
DO $$
DECLARE
    r RECORD;
    v_id INT;
BEGIN
    FOR r IN SELECT id FROM public.sellers WHERE seller_identifier IS NULL ORDER BY created_at ASC LOOP
        v_id := nextval('seller_id_seq');
        UPDATE public.sellers 
        SET seller_identifier = 'ICONJ-SELL-' || LPAD(v_id::text, 6, '0')
        WHERE id = r.id;
    END LOOP;
END;
$$;

-- 4. Create a function and trigger to automatically assign on new inserts
CREATE OR REPLACE FUNCTION assign_seller_identifier()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.seller_identifier IS NULL THEN
        NEW.seller_identifier := 'ICONJ-SELL-' || LPAD(nextval('seller_id_seq')::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_assign_seller_identifier ON public.sellers;
CREATE TRIGGER trigger_assign_seller_identifier
BEFORE INSERT ON public.sellers
FOR EACH ROW
EXECUTE FUNCTION assign_seller_identifier();
