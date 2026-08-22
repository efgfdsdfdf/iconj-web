import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdmin } from "@/lib/auth/admin";

export async function POST(request: Request) {
  try {
    const { isAdmin } = await verifyAdmin();
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, email, phone, currency } = await request.json();
    if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    const { data, error } = await supabaseAdmin.from("suppliers").insert({
      name,
      email,
      phone,
      currency: currency || 'NGN'
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ success: true, supplier: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
