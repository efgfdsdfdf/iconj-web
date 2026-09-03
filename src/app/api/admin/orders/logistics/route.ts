import { verifyAdmin } from "@/lib/auth/admin";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { isAdmin } = await verifyAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const supabaseAdmin = await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { orderId, status } = await req.json();

    // Update logistics status
    const { error } = await supabaseAdmin.from("orders").update({ logistics_status: status }).eq("id", orderId);
    if (error) throw error;
    
    // Also update main order_status if it's SHIPPED or DELIVERED to keep other systems in sync
    if (status === "SHIPPED" || status === "DELIVERED") {
        await supabaseAdmin.from("orders").update({ order_status: status }).eq("id", orderId);
    }

    try {
        const { sendStatusNotification } = await import("@/lib/order-emails");
        await sendStatusNotification(orderId, status);
    } catch(e) {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
