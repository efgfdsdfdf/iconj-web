-- 1. Enhance products table with baby-specific drop-shipping columns
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS supplier_id TEXT,
ADD COLUMN IF NOT EXISTS supplier_sku TEXT,
ADD COLUMN IF NOT EXISTS supplier_cost NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS age_range TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS safety_info TEXT,
ADD COLUMN IF NOT EXISTS is_bundle BOOLEAN DEFAULT FALSE;

-- 2. Update the homepage categories in store_settings to Mother & Baby
INSERT INTO public.store_settings (id, value) VALUES (
  'homepage_categories',
  '[
    {"name": "Newborn Essentials", "icon": "https://images.unsplash.com/photo-1555252834-406eb1be18f4?w=200&q=80"},
    {"name": "Baby Feeding", "icon": "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=200&q=80"},
    {"name": "Baby Bath & Care", "icon": "https://images.unsplash.com/photo-1544640808-32cb4fbaee4d?w=200&q=80"},
    {"name": "Toys & Development", "icon": "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=200&q=80"},
    {"name": "Maternity & Mother Care", "icon": "https://images.unsplash.com/photo-1517590858763-7e61a6b412ee?w=200&q=80"},
    {"name": "Gifts & Bundles", "icon": "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=200&q=80"}
  ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value;

-- OPTIONAL: If you want to delete all the old Blinds/Curtains products, uncomment the line below:
-- DELETE FROM public.products;

