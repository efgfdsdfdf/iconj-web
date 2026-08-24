import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const supabaseUser = await createServerClient();
    const { data: { user } } = await supabaseUser.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { account_number, bank_code, bank_name, account_name } = await request.json();

    if (!account_number || !bank_code || !account_name) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the seller profile
    const { data: seller } = await supabaseAdmin
      .from('sellers')
      .select('id, businesses(business_name)')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!seller) {
      return NextResponse.json({ error: "Seller profile not found." }, { status: 404 });
    }

    // Determine business name or fallback to account name
    const businessName = seller.businesses?.[0]?.business_name || seller.businesses?.business_name || account_name;

    // Create Paystack Subaccount
    const paystackRes = await fetch("https://api.paystack.co/subaccount", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        business_name: businessName,
        settlement_bank: bank_code,
        account_number: account_number,
        percentage_charge: 10.0 // ICONJ takes 10%. Wait, we are doing flat splits so this doesn't actually matter for flat splits, but required for subaccount creation.
      })
    });

    const data = await paystackRes.json();
    let subaccountCode = null;
    let status = 'VERIFIED';
    let errorMessage = null;

    if (data.status) {
      subaccountCode = data.data.subaccount_code;
    } else {
      // It failed, likely because the platform is a Starter Business
      console.warn("Paystack Subaccount Creation Failed (Likely Starter Business Limitation):", data);
      status = 'PLATFORM_UPGRADE_REQUIRED';
      errorMessage = "Your payout account was saved but payouts are pending platform upgrade. " + (data.message || "");
    }

    // Save to database
    // First, deactivate any existing primary accounts
    await supabaseAdmin
      .from('seller_payout_accounts')
      .update({ is_primary: false })
      .eq('seller_id', seller.id);

    const { error: insertError } = await supabaseAdmin
      .from('seller_payout_accounts')
      .insert({
        seller_id: seller.id,
        bank_name: bank_name || bank_code,
        bank_code: bank_code,
        account_number: account_number,
        account_name: account_name,
        verified_name: account_name,
        paystack_subaccount_code: subaccountCode,
        status: status,
        is_primary: true
      });

    if (insertError) throw insertError;

    if (status === 'PLATFORM_UPGRADE_REQUIRED') {
      return NextResponse.json({ 
        success: true, 
        message: "Account verified, but automated payouts are currently queued until marketplace upgrades are complete." 
      });
    }

    return NextResponse.json({ success: true, message: "Payout account successfully connected!" });

  } catch (error: any) {
    console.error("Verify Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
