import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdmin } from "@/lib/auth/admin";

export async function POST(request: Request) {
  try {
    const { isAdmin, userId } = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, note } = await request.json();
    if (!orderId || !note) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    const { error } = await supabaseAdmin.from("admin_notes").insert({
      order_id: orderId,
      note,
      admin_id: userId
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
