-- ICONJ Phase 4: Landing Pages for Ad Campaigns
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.landing_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    hero_image_url TEXT,
    headline TEXT NOT NULL,
    subheadline TEXT,
    body_content TEXT,
    product_id UUID REFERENCES public.products(id),
    theme_color VARCHAR(50) DEFAULT '#f97316',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Public can view active landing pages" ON public.landing_pages FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admin can manage landing pages" ON public.landing_pages FOR ALL USING (auth.jwt() ->> 'email' = 'ezeilodavid292@gmail.com');
EXCEPTION WHEN duplicate_object THEN null; END $$;
