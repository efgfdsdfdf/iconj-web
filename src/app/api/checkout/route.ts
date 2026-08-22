import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, email, name, userId } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // 1. Calculate Total Price securely on the server
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const shippingFee = 0;
    const totalAmount = subtotal + shippingFee;
    
    // Create a server Supabase client using Service Role to bypass RLS
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch actual supplier costs and metadata from the database securely
    const productIds = items.map((i: any) => i.id);
    const { data: dbProducts } = await supabaseAdmin
      .from("products")
      .select("id, base_supplier_cost, metadata")
      .in("id", productIds);
      
    let actualSupplierCost = 0;
    let mainSupplierId: string | null = null;
    
    items.forEach((item: any, index: number) => {
      const dbProduct = dbProducts?.find((p: any) => p.id === item.id);
      const unitCost = dbProduct ? Number(dbProduct.base_supplier_cost) || 0 : 0;
      actualSupplierCost += (unitCost * item.quantity);
      
      // Assign the order to the supplier of the first product in the cart
      if (index === 0 && dbProduct?.metadata?.supplier_id) {
        mainSupplierId = dbProduct.metadata.supplier_id;
      }
    });
    
    const estimatedProfit = subtotal - actualSupplierCost;

    // If the user checked out with a new address and they are logged in, save it to their addresses table
    if (body.saveAddress && userId) {
      await supabaseAdmin.from('addresses').insert([{
        user_id: userId,
        label: 'Recent Delivery',
        street: body.address?.street,
        city: body.address?.city,
        state: body.address?.state,
        phone: body.phone,
        is_default: true
      }]);
    }

    // 2. Save the pending order to the database
    const { data: orderData, error: orderError } = await supabaseAdmin.from("orders").insert([{
      supplier_id: mainSupplierId || null,
      user_id: userId || null,
      total_amount: totalAmount,
      shipping_cost: shippingFee,
      supplier_cost: actualSupplierCost,
      estimated_profit: estimatedProfit,
      payment_status: "PENDING",
      order_status: "NEW",
      delivery_address: {
        ...body.address,
        name: body.name,
        phone: body.phone
      },
    }]).select().single();

    if (orderError) throw new Error("Failed to create order: " + orderError.message);

    // 3. Save Order Items
    const orderItems = items.map((item: any) => ({
      order_id: orderData.id,
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price
    }));
    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(orderItems);
    if (itemsError) {
      console.error("Order items insert error:", itemsError);
    }
    
    // Paystack expects amount in kobo (multiply Naira by 100)
    const amountInKobo = totalAmount * 100;

    // Extract origin dynamically so it works seamlessly on localhost and Vercel
    const origin = new URL(request.url).origin;

    // 4. Initialize Paystack Transaction
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        amount: amountInKobo,
        reference: orderData.id,
        callback_url: `${origin}/api/callback`,
        metadata: {
          custom_fields: [
            { display_name: "Customer Name", variable_name: "customer_name", value: name },
            { display_name: "Phone", variable_name: "phone", value: body.phone }
          ]
        }
      })
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      throw new Error("Paystack initialization failed: " + paystackData.message);
    }

    return NextResponse.json({ 
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference 
    });

  } catch (error: any) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
