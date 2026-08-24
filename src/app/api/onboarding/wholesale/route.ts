import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabaseUser = await createServerClient();
    const { data: { user } } = await supabaseUser.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { businessName, registrationNumber, taxId, address } = body;

    // Use service role to bypass RLS for onboarding
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: dbError } = await supabaseAdmin.from('businesses').insert({
      owner_id: user.id,
      business_name: businessName,
      registration_number: registrationNumber,
      tax_id: taxId,
      business_type: 'wholesale',
      address: { street: address }
    });

    if (dbError) throw dbError;

    // Update user_roles
    await supabaseAdmin.from('user_roles').insert({
      user_id: user.id,
      role: 'wholesale'
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Onboarding Error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit wholesale application" }, { status: 500 });
  }
}
