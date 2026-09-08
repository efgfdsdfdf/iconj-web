import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth/admin';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;
  const id = resolvedParams.id;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data, error } = await supabase
    .from('ddp_rates')
    .update({ 
      is_active: false, 
      effective_to: new Date().toISOString() 
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;
  const id = resolvedParams.id;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Check if used in shipping_calculations
  const { data: usage, error: usageErr } = await supabase
    .from('shipping_calculations')
    .select('id')
    .eq('ddp_rate_id', id)
    .limit(1);

  if (usageErr) return NextResponse.json({ error: usageErr.message }, { status: 500 });
  if (usage && usage.length > 0) {
    return NextResponse.json({ error: 'Rate cannot be deleted as it is used in existing shipping calculations. Please deactivate it instead.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('ddp_rates')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
