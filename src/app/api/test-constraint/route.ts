import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const statusesToTry = [
    "NEW",
    "PENDING_PAYMENT", 
    "pending_payment", 
    "PENDING",
    "PAYMENT_CONFIRMED",
    "payment_confirmed"
  ];

  const results: Record<string, any> = {};

  for (const status of statusesToTry) {
    const { error } = await supabase.from('orders').insert({
      user_id: null,
      total_amount: 100,
      delivery_address: {},
      payment_status: "PENDING",
      order_status: status
    });
    
    results[status] = error ? error.message : "SUCCESS";
  }

  return NextResponse.json(results);
}
