-- ICONJ Phase 2: Campaign Engine V2, Segmentation & Automation
-- This migration is ADDITIVE — it does NOT touch existing tables

-- ==========================================
-- 1. CUSTOMER SEGMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.customer_segments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    filter_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- filter_rules is an array of rule objects:
    -- [{ "field": "total_spent", "operator": "gte", "value": 50000 },
    --  { "field": "order_count", "operator": "gte", "value": 2 }]
    is_active BOOLEAN DEFAULT true,
    cached_count INTEGER DEFAULT 0,
    last_evaluated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 2. ENHANCED CAMPAIGNS (campaigns_v2)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.campaigns_v2 (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    preview_text TEXT,
    -- Targeting
    segment_id UUID REFERENCES public.customer_segments(id) ON DELETE SET NULL,
    target_audience TEXT DEFAULT 'all', -- 'all', 'segment', 'manual'
    manual_emails TEXT[], -- for manual targeting
    -- Scheduling
    status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, SCHEDULED, SENDING, SENT, PAUSED, CANCELLED
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    -- Approval
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    -- Metrics (denormalized for fast dashboard reads)
    total_recipients INTEGER DEFAULT 0,
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    total_bounced INTEGER DEFAULT 0,
    total_unsubscribed INTEGER DEFAULT 0,
    -- Seasonal templates
    is_template BOOLEAN DEFAULT false,
    template_category TEXT, -- 'christmas', 'easter', 'black_friday', 'new_year', etc.
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_v2_status ON public.campaigns_v2(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_v2_scheduled ON public.campaigns_v2(scheduled_for);

-- ==========================================
-- 3. CAMPAIGN SENDS (individual delivery log)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.campaign_sends (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.campaigns_v2(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'QUEUED', -- QUEUED, SENT, DELIVERED, OPENED, CLICKED, BOUNCED, FAILED
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_sends_campaign ON public.campaign_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_user ON public.campaign_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_status ON public.campaign_sends(status);

-- ==========================================
-- 4. AUTOMATION FLOWS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.automation_flows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    trigger_event TEXT NOT NULL,
    -- Trigger events: 'signup', 'abandoned_cart', 'checkout_abandoned',
    -- 'post_purchase', 'win_back', 'browse_abandon', 'review_request',
    -- 'birthday', 'milestone'
    is_active BOOLEAN DEFAULT false,
    -- Steps define the automation sequence as JSON array:
    -- [{ "type": "wait", "delay_hours": 24 },
    --  { "type": "email", "subject": "...", "template": "..." },
    --  { "type": "condition", "field": "has_purchased", "then_step": 3, "else_step": 4 }]
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Suppression rules
    suppress_if_purchased BOOLEAN DEFAULT true,
    suppress_if_emailed_within_hours INTEGER DEFAULT 24,
    max_enrollments_per_user INTEGER DEFAULT 1,
    -- Stats
    total_enrolled INTEGER DEFAULT 0,
    total_completed INTEGER DEFAULT 0,
    total_converted INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_flows_trigger ON public.automation_flows(trigger_event);

-- ==========================================
-- 5. AUTOMATION ENROLLMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.automation_enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    flow_id UUID NOT NULL REFERENCES public.automation_flows(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, CANCELLED, SUPPRESSED
    current_step INTEGER DEFAULT 0,
    next_action_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Idempotency: one enrollment per user per flow (unless max_enrollments allows more)
    UNIQUE(flow_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_automation_enrollments_flow ON public.automation_enrollments(flow_id);
CREATE INDEX IF NOT EXISTS idx_automation_enrollments_user ON public.automation_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_enrollments_next ON public.automation_enrollments(next_action_at);
CREATE INDEX IF NOT EXISTS idx_automation_enrollments_status ON public.automation_enrollments(status);

-- ==========================================
-- 6. MARKETING CONTENT PLANNER
-- ==========================================
CREATE TABLE IF NOT EXISTS public.marketing_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'social', -- 'social', 'email', 'blog', 'education', 'promo'
    channel TEXT, -- 'instagram', 'tiktok', 'facebook', 'whatsapp', 'email', 'website'
    body TEXT,
    image_url TEXT,
    scheduled_date DATE,
    status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, SCHEDULED, PUBLISHED
    tags TEXT[],
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_content_type ON public.marketing_content(content_type);
CREATE INDEX IF NOT EXISTS idx_marketing_content_date ON public.marketing_content(scheduled_date);

-- ==========================================
-- 7. RLS POLICIES
-- ==========================================
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_content ENABLE ROW LEVEL SECURITY;

-- Service role full access (all admin operations go through server actions)
DO $$ BEGIN
  CREATE POLICY "Service role manages segments" ON public.customer_segments FOR ALL USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages campaigns_v2" ON public.campaigns_v2 FOR ALL USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages campaign_sends" ON public.campaign_sends FOR ALL USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages automation_flows" ON public.automation_flows FOR ALL USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages automation_enrollments" ON public.automation_enrollments FOR ALL USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages marketing_content" ON public.marketing_content FOR ALL USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
