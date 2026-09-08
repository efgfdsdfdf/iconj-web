import { NextResponse } from 'next/server';
import { calculateDDPShipping } from '@/lib/shipping';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { product_id, quantity, is_custom_size } = await req.json();

    if (!product_id || !quantity) {
      return NextResponse.json({ error: 'Missing product_id or quantity' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: product } = await supabase
      .from('products')
      .select('id, shipping_weight_kg, shipping_length_cm, shipping_width_cm, shipping_height_cm, is_configurable')
      .eq('id', product_id)
      .single();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const shippingResult = await calculateDDPShipping({
      id: product.id,
      shippingWeightKg: product.shipping_weight_kg,
      shippingLengthCm: product.shipping_length_cm,
      shippingWidthCm: product.shipping_width_cm,
      shippingHeightCm: product.shipping_height_cm,
      shippingDataStatus: 'COMPLETE', 
      isConfigurable: is_custom_size,
    }, quantity);

    return NextResponse.json({
      status: shippingResult.status,
      customerShippingPrice: shippingResult.customerShippingPrice,
      currency: shippingResult.currency,
      label: shippingResult.label,
      note: shippingResult.note,
    });
  } catch (error: any) {
    console.error('Shipping calculation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
