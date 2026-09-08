import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth/admin';
import { invalidateSettingsCache } from '@/lib/shipping';

export async function GET() {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data, error } = await supabase
    .from('store_settings')
    .select('id, value')
    .like('id', 'ddp_%');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const settings: Record<string, any> = {};
  data.forEach(setting => {
    const cleanKey = setting.id.replace('ddp_', '');
    let val = setting.value;
    try { val = JSON.parse(val); } catch (e) {}
    settings[cleanKey] = val;
  });

  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    const allowedKeys = ['volumetricDivisor', 'divisorStatus', 'formulaStatus', 'markupPct', 'chargeableWeightMethod', 'roundingMethod'];
    
    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        const val = typeof body[key] === 'string' ? body[key] : JSON.stringify(body[key]);
        const { error } = await supabase
          .from('store_settings')
          .upsert({ id: `ddp_${key}`, value: val }, { onConflict: 'id' });
        if (error) throw error;
      }
    }

    await invalidateSettingsCache();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
