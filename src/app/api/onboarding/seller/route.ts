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
    const { 
      businessName, storeName, businessType, 
      bankName, accountNumber, accountName,
      phone, street, city, state, taxId,
      cacDocumentName, idDocumentName 
    } = body;

    // Use service role to bypass RLS for onboarding
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Create Business
    const { data: businessData, error: businessError } = await supabaseAdmin.from('businesses').insert({
      owner_id: user.id,
      business_name: businessName,
      business_type: businessType || 'retail',
      tax_id: taxId || null,
      address: { street, city, state, phone }
    }).select().single();

    if (businessError) throw businessError;

    // 2. Create Seller Record
    const { data: sellerData, error: sellerError } = await supabaseAdmin.from('sellers').insert({
      profile_id: user.id,
      business_id: businessData.id,
      status: 'pending_verification'
    }).select().single();

    if (sellerError) throw sellerError;

    // 3. Create Store
    const baseSlug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const storeSlug = `${baseSlug}-${randomSuffix}`;
    
    const { error: storeError } = await supabaseAdmin.from('stores').insert({
      seller_id: sellerData.id,
      store_name: storeName,
      slug: storeSlug
    });

    if (storeError) throw storeError;

    // 4. Add Payout Account
    const { error: payoutError } = await supabaseAdmin.from('seller_payout_accounts').insert({
      seller_id: sellerData.id,
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName
    });

    if (payoutError) throw payoutError;

    // 5. Add KYC Documents (Verifications)
    const verificationInserts = [];
    if (cacDocumentName) {
      verificationInserts.push({
        seller_id: sellerData.id,
        document_type: 'CAC_CERTIFICATE',
        document_url: cacDocumentName, // Mock URL for now
        status: 'pending'
      });
    }
    if (idDocumentName) {
      verificationInserts.push({
        seller_id: sellerData.id,
        document_type: 'GOVERNMENT_ID',
        document_url: idDocumentName, // Mock URL for now
        status: 'pending'
      });
    }

    if (verificationInserts.length > 0) {
      const { error: verifyError } = await supabaseAdmin.from('seller_verifications').insert(verificationInserts);
      if (verifyError) throw verifyError;
    }

    // 6. Update user_roles
    await supabaseAdmin.from('user_roles').insert({
      user_id: user.id,
      role: 'seller'
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Onboarding Error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit seller application" }, { status: 500 });
  }
}
