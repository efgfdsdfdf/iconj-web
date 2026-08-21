-- 1. Store Settings Table (For dynamic categories & configs)
CREATE TABLE public.store_settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS but allow anyone to read settings
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.store_settings FOR SELECT USING (true);

-- 2. Order Issues Table
CREATE TABLE public.order_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'Submitted',
  evidence_urls TEXT[],
  admin_notes TEXT,
  customer_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policies for Order Issues
ALTER TABLE public.order_issues ENABLE ROW LEVEL SECURITY;

-- Customers can view their own issues
CREATE POLICY "Customers can view own issues" 
ON public.order_issues FOR SELECT 
USING (auth.uid() = customer_id);

-- Customers can insert their own issues
CREATE POLICY "Customers can create issues" 
ON public.order_issues FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

-- Admins (via Service Role) bypass these policies naturally.

-- 3. Insert Default Categories into store_settings
INSERT INTO public.store_settings (id, value) VALUES (
  'homepage_categories',
  '[
    {"name": "Smart Motorized Blinds", "icon": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&q=80"},
    {"name": "Blackout Shades", "icon": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=200&q=80"},
    {"name": "Curtain Tracks", "icon": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&q=80"},
    {"name": "Honeycomb", "icon": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200&q=80"},
    {"name": "Outdoor Patio", "icon": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&q=80"},
    {"name": "Custom Sizes", "icon": "https://images.unsplash.com/photo-1600607688969-a5bfcd64bd40?w=200&q=80"}
  ]'::jsonb
);

-- 4. Storage Bucket for Issue Evidence (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('issue-evidence', 'issue-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read for evidence images
CREATE POLICY "Public Issue Evidence Read" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'issue-evidence');

-- Allow authenticated users to upload evidence
CREATE POLICY "Authenticated Issue Evidence Upload" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'issue-evidence' AND auth.role() = 'authenticated');

