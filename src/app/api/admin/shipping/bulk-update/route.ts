import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth/admin';

export async function POST(req: Request) {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { updates } = body;
    if (!Array.isArray(updates)) return NextResponse.json({ error: 'updates must be an array' }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    let successCount = 0;
    const failures = [];

    for (const update of updates) {
      const { product_id, shipping_weight_kg, shipping_length_cm, shipping_width_cm, shipping_height_cm, shipping_packaging_type, shipping_notes } = update;
      
      const toUpdate: any = {};
      if (shipping_weight_kg !== undefined) toUpdate.shipping_weight_kg = shipping_weight_kg;
      if (shipping_length_cm !== undefined) toUpdate.shipping_length_cm = shipping_length_cm;
      if (shipping_width_cm !== undefined) toUpdate.shipping_width_cm = shipping_width_cm;
      if (shipping_height_cm !== undefined) toUpdate.shipping_height_cm = shipping_height_cm;
      if (shipping_packaging_type !== undefined) toUpdate.shipping_packaging_type = shipping_packaging_type;
      if (shipping_notes !== undefined) toUpdate.shipping_notes = shipping_notes;

      // Determine new status based on data
      const hasWeight = toUpdate.shipping_weight_kg > 0;
      const hasDims = toUpdate.shipping_length_cm > 0 && toUpdate.shipping_width_cm > 0 && toUpdate.shipping_height_cm > 0;
      
      if (hasWeight && hasDims) {
        toUpdate.shipping_data_status = 'COMPLETE';
      } else if (hasWeight || hasDims) {
        toUpdate.shipping_data_status = 'PARTIAL';
      } else {
        toUpdate.shipping_data_status = 'MISSING';
      }

      const { error } = await supabase
        .from('products')
        .update(toUpdate)
        .eq('id', product_id);

      if (error) {
        failures.push({ product_id, error: error.message });
      } else {
        successCount++;
      }
    }

    return NextResponse.json({ successCount, failures });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
