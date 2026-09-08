import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth/admin';

export async function POST(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { admin, isAdmin } = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.orderId;
    const body = await req.json();
    const { confirmedShippingAmount, notes } = body;

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // 1. Fetch snapshot
    const { data: snapshot, error: snapErr } = await supabase
      .from('order_shipping_snapshots')
      .select('*')
      .eq('order_id', orderId)
      .single();
      
    if (snapErr) throw snapErr;

    const originalAmount = snapshot.customer_shipping_price || 0;
    const difference = confirmedShippingAmount - originalAmount;

    // 2. Update snapshot
    const { error: snapUpdErr } = await supabase
      .from('order_shipping_snapshots')
      .update({
        customer_shipping_price: confirmedShippingAmount,
        shipping_status: 'ADMIN_CONFIRMED',
        confirmed_by: admin?.email || 'admin',
        confirmed_at: new Date().toISOString(),
        admin_notes: notes
      })
      .eq('order_id', orderId);

    if (snapUpdErr) throw snapUpdErr;

    // 3 & 4. Update orders
    // Fetch order first to calculate new total
    const { data: order, error: orderFetchErr } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('id', orderId)
      .single();
      
    if (orderFetchErr) throw orderFetchErr;

    const newTotalAmount = (order.total_amount || 0) + difference;

    const { error: orderUpdErr } = await supabase
      .from('orders')
      .update({
        confirmed_shipping: confirmedShippingAmount,
        shipping_status: 'ADMIN_CONFIRMED',
        shipping_cost: confirmedShippingAmount,
        total_amount: newTotalAmount
      })
      .eq('id', orderId);

    if (orderUpdErr) throw orderUpdErr;

    return NextResponse.json({ success: true, oldAmount: originalAmount, newAmount: confirmedShippingAmount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
