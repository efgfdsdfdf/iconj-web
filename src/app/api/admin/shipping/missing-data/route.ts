import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth/admin';

export async function GET() {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku, shipping_weight_kg, shipping_length_cm, shipping_width_cm, shipping_height_cm, shipping_data_status, is_configurable, category')
    .neq('shipping_data_status', 'COMPLETE')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const summary = {
    MISSING: 0,
    PARTIAL: 0,
    CUSTOM_REQUIRED: 0,
    COMPLETE: 0
  };

  data.forEach(p => {
    if (summary[p.shipping_data_status as keyof typeof summary] !== undefined) {
      summary[p.shipping_data_status as keyof typeof summary]++;
    }
  });

  return NextResponse.json({ products: data, summary });
}
