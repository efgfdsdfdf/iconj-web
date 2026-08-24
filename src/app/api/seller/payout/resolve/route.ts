import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { account_number, bank_code } = await request.json();

    if (!account_number || !bank_code) {
      return NextResponse.json({ error: "Account number and bank code are required." }, { status: 400 });
    }

    // Call Paystack Resolve API
    const paystackRes = await fetch(`https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await paystackRes.json();

    if (!data.status) {
      return NextResponse.json({ error: data.message || "Failed to resolve account." }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      account_name: data.data.account_name,
      account_number: data.data.account_number,
      bank_id: data.data.bank_id
    });

  } catch (error: any) {
    console.error("Resolve Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
