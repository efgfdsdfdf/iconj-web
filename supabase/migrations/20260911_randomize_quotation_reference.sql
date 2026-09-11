CREATE OR REPLACE FUNCTION public.generate_quotation_reference()
RETURNS TEXT AS $$
DECLARE
  result TEXT;
  done BOOLEAN := false;
BEGIN
  WHILE NOT done LOOP
    -- Generate 'ICONJ-Q-' followed by 6 random uppercase hex characters (e.g., ICONJ-Q-A7F93B)
    result := 'ICONJ-Q-' || upper(substr(md5(random()::text), 1, 6));
    
    -- Ensure absolute uniqueness
    PERFORM 1 FROM public.quotations WHERE reference = result;
    IF NOT FOUND THEN
      done := true;
    END IF;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
