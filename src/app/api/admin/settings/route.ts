import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth/admin';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET /api/admin/settings
export async function GET(request: Request) {
  const adminError = await verifyAdmin();
  if (adminError) return adminError;

  const { data } = await supabaseAdmin
    .from('store_settings')
    .select('id, value');

  const settings: Record<string, string> = {};
  (data || []).forEach(row => {
    settings[row.id] = row.value;
  });

  return NextResponse.json({ settings });
}

// POST /api/admin/settings
export async function POST(request: Request) {
  const adminError = await verifyAdmin();
  if (adminError) return adminError;

  const updates = await request.json();
  const upserts = Object.entries(updates).map(([id, value]) => ({ id, value: String(value) }));

  const { error } = await supabaseAdmin
    .from('store_settings')
    .upsert(upserts, { onConflict: 'id' });

  if (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
