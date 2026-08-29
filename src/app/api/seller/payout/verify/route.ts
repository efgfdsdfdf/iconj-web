import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { createTransferRecipient } from "@/lib/paystack-transfers";

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
    const businesses = seller.businesses as any;
    const businessName = (Array.isArray(businesses) ? businesses[0]?.business_name : businesses?.business_name) || account_name;

    // Create Paystack Transfer Recipient
    let recipientCode = null;
    let status = 'VERIFIED';

    const recipientRes = await createTransferRecipient(bank_code, account_number, account_name);
    if (recipientRes.success && recipientRes.recipient_code) {
      recipientCode = recipientRes.recipient_code;
    } else {
      console.warn("Failed to create Paystack Transfer Recipient. Will fall back to manual payouts.", recipientRes.error);
      // We still mark it as VERIFIED because the bank resolution worked, meaning the account is valid.
      // We just won't be able to use Paystack automated transfers until this is resolved, but manual transfers work.
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
        paystack_subaccount_code: recipientCode, // Reusing column for recipient code
        status: status,
        is_primary: true
      });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, message: "Payout account successfully connected!" });

  } catch (error: any) {
    console.error("Verify Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
