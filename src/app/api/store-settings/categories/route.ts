import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data } = await supabaseAdmin
    .from("store_settings")
    .select("value")
    .eq("id", "homepage_categories")
    .single();

  if (data?.value && Array.isArray(data.value)) {
    return NextResponse.json(data.value);
  }
  return NextResponse.json([]);
}
