import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.redirect(new URL('/shop', request.url));
    }

    // Verify transaction with Paystack
    const verifyResponse = await fetch(\https://api.paystack.co/transaction/verify/\\, {
      method: 'GET',
      headers: {
        Authorization: \Bearer \\
      }
    });

    const verifyData = await verifyResponse.json();

    if (verifyData.status && verifyData.data.status === 'success') {
      const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      
      // Update the order status in Supabase
      const { error } = await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'paid',
          order_status: 'processing'
        })
        .eq('id', reference); // Our checkout uses order id as reference

      if (error) {
        console.error('Error updating order:', error);
      }
    }

    // Redirect to a success or orders page
    return NextResponse.redirect(new URL('/account/orders', request.url));
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(new URL('/shop', request.url));
  }
}
