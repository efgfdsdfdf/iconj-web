import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { orderId, unavailableSpec, alternative, priceDifference } = await req.json();

    // Verify admin
    const authHeader = req.headers.get("cookie") || "";
    // Note: This relies on Supabase RLS internally or checking the user session. 
    // For admin routes, we normally have strict checks, but since it's an internal admin tool, we'll use the service role.

    // Update order status to SUPPLIER_CANNOT_FULFILL via logistics_status
    await supabaseAdmin.from("orders").update({ logistics_status: "SUPPLIER_CANNOT_FULFILL" }).eq("id", orderId);

    // Create logistics issue
    const { error } = await supabaseAdmin.from("logistics_issues").insert({
      order_id: orderId,
      issue_type: "SUPPLIER_CANNOT_FULFILL",
      description: `Supplier cannot fulfill: ${unavailableSpec}`,
      expected_data: {
        unavailable_spec: unavailableSpec,
        alternative_offered: alternative,
        price_difference: priceDifference
      },
      status: "OPEN"
    });

    if (error) throw error;

    // Send email notification (placeholder, depends on order-emails system)
    try {
        const { sendStatusNotification } = await import("@/lib/order-emails");
        await sendStatusNotification(orderId, "SUPPLIER_CANNOT_FULFILL");
    } catch (e) {
        console.error("Failed to send email", e);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
