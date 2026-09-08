import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth/admin';

export async function GET() {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data, error } = await supabase
    .from('ddp_rates')
    .select('*')
    .order('effective_from', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { weight_min_kg, weight_max_kg, rate_type, rate_per_kg, flat_rate, currency, destination, shipping_method, supplier_id, notes } = body;

    if (rate_type === 'per_kg' && rate_per_kg === undefined) {
      return NextResponse.json({ error: 'rate_per_kg is required for per_kg type' }, { status: 400 });
    }
    if (rate_type === 'flat' && flat_rate === undefined) {
      return NextResponse.json({ error: 'flat_rate is required for flat type' }, { status: 400 });
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    const { data, error } = await supabase
      .from('ddp_rates')
      .insert([{
        weight_min_kg,
        weight_max_kg,
        rate_type,
        rate_per_kg: rate_type === 'per_kg' ? rate_per_kg : null,
        flat_rate: rate_type === 'flat' ? flat_rate : null,
        currency: currency || 'CNY',
        destination: destination || 'NG',
        shipping_method: shipping_method || 'AIR_CARGO',
        supplier_id,
        notes,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
