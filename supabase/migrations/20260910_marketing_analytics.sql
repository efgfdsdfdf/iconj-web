-- ICONJ Marketing Analytics & Attribution Schema

-- ==========================================
-- 1. ANALYTICS EVENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    referrer TEXT,
    device TEXT,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON public.analytics_events(created_at);

-- ==========================================
-- 2. VISITOR SESSIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.visitor_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    first_touch_source TEXT,
    first_touch_medium TEXT,
    first_touch_campaign TEXT,
    last_touch_source TEXT,
    last_touch_medium TEXT,
    last_touch_campaign TEXT,
    landing_page TEXT,
    device TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visitor_sessions_session ON public.visitor_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_user ON public.visitor_sessions(user_id);

-- ==========================================
-- 3. EXTEND PROFILES FOR ATTRIBUTION & LIFETIME VALUE
-- ==========================================
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS first_touch_source TEXT,
    ADD COLUMN IF NOT EXISTS first_touch_medium TEXT,
    ADD COLUMN IF NOT EXISTS first_touch_campaign TEXT,
    ADD COLUMN IF NOT EXISTS total_spent DECIMAL(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS order_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_order_at TIMESTAMPTZ;

-- ==========================================
-- 4. EXTEND ORDERS FOR ORDER-LEVEL ATTRIBUTION
-- ==========================================
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS attribution_snapshot JSONB;

-- ==========================================
-- 5. RLS POLICIES
-- ==========================================
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;

-- Analytics and sessions are insert-only from the backend service role
CREATE POLICY "Service role can manage analytics" ON public.analytics_events FOR ALL USING (TRUE);
CREATE POLICY "Service role can manage sessions" ON public.visitor_sessions FOR ALL USING (TRUE);
