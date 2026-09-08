const SUPABASE_URL = 'https://zipybuvtmzaoerggkptu.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppcHlidXZ0bXphb2VyZ2drcHR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMxNTk4MCwiZXhwIjoyMTAyODkxOTgwfQ.-QckDViw1MKXNN1gwhqCZUy7C4DPtZad_KPcQIc9H_4';

async function runSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!response.ok) {
    const text = await response.text();
    return { error: text };
  }
  return { data: await response.json() };
}

async function main() {
  const statements = [
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthday DATE`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_spent DECIMAL(12,2) DEFAULT 0`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMPTZ`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_date TIMESTAMPTZ`,
    `CREATE TABLE IF NOT EXISTS public.marketing_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      html_content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SCHEDULED', 'SENT', 'CANCELLED')),
      scheduled_for TIMESTAMPTZ,
      sent_at TIMESTAMPTZ,
      target_audience TEXT NOT NULL DEFAULT 'ALL' CHECK (target_audience IN ('ALL', 'VIP', 'NO_PURCHASE')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  ];

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();
    console.log(`[${i+1}/${statements.length}] ${stmt.substring(0, 60)}...`);
    const { error } = await runSQL(stmt);
    if (error) {
      console.log(`  X  ${error.substring(0, 200)}`);
    } else {
      console.log(`  OK`);
    }
  }

  console.log('\nMigration complete.');
}

main().catch(console.error);
