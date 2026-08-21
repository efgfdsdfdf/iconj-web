import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, email, name } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // 1. Calculate Total Price securely on the server
    // (In production, you fetch the prices from Supabase using the item IDs to prevent frontend tampering)
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const shippingFee = 15000;
    const totalAmount = subtotal + shippingFee;
    
    // Paystack expects amount in kobo (multiply Naira by 100)
    const amountInKobo = totalAmount * 100;

    // Extract origin dynamically so it works seamlessly on localhost and Vercel
    const origin = new URL(request.url).origin;

    // 2. Initialize Paystack Transaction
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        amount: amountInKobo,
        callback_url: `${origin}/checkout/verify`,
        metadata: {
          custom_fields: [
            { display_name: "Customer Name", variable_name: "customer_name", value: name },
            { display_name: "Cart Items", variable_name: "cart_items", value: JSON.stringify(items) }
          ]
        }
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      return NextResponse.json({ error: paystackData.message }, { status: 400 });
    }

    // 3. Return the secure checkout URL to the frontend
    return NextResponse.json({ 
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference 
    });

  } catch (error) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
