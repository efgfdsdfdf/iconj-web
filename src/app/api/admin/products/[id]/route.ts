import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();

    const { error } = await supabaseAdmin.from("products").update(data).eq("id", id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Update product error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to update product" }, { status: 500 });
  }
}
