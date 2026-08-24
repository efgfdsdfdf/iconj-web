import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, email, name, userId } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch actual products to verify prices and get seller mappings
    const productIds = items.map((i: any) => i.id);
    const { data: dbProducts, error: dbError } = await supabaseAdmin
      .from("products")
      .select("id, name, sku, base_selling_price, seller_id, wholesale_pricing(*)")
      .in("id", productIds);
      
    if (dbError || !dbProducts) throw new Error("Error verifying products.");

    let subtotal = 0;
    const itemsBySeller: Record<string, any[]> = {};

    const verifiedItems = items.map((item: any) => {
      const dbProduct = dbProducts.find((p: any) => p.id === item.id);
      if (!dbProduct) throw new Error(`Product ${item.id} not found.`);

      // Verify Pricing
      let verifiedPrice = Number(dbProduct.base_selling_price);
      if (dbProduct.wholesale_pricing && dbProduct.wholesale_pricing.length > 0) {
        const sortedTiers = [...dbProduct.wholesale_pricing].sort((a: any, b: any) => b.min_quantity - a.min_quantity);
        for (const tier of sortedTiers) {
          if (item.quantity >= tier.min_quantity) {
            verifiedPrice = Number(tier.price_per_unit);
            break;
          }
        }
      }

      const itemTotal = verifiedPrice * item.quantity;
      subtotal += itemTotal;
      
      const sellerId = dbProduct.seller_id || "icon_official"; // Fallback identifier
      if (!itemsBySeller[sellerId]) itemsBySeller[sellerId] = [];
      
      const verifiedItem = {
        ...item,
        verifiedPrice,
        dbProduct
      };
      
      itemsBySeller[sellerId].push(verifiedItem);
      return verifiedItem;
    });

    const shippingFee = 0; // Configurable later
    const totalAmount = subtotal + shippingFee;

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

    // 1. Create Parent Order
    const { data: orderData, error: orderError } = await supabaseAdmin.from("orders").insert([{
      user_id: userId || null,
      total_amount: totalAmount,
      shipping_cost: shippingFee,
      payment_status: "PENDING",
      order_status: "PENDING_PAYMENT",
      delivery_address: { ...body.address, name: body.name, phone: body.phone, email: email },
    }]).select().single();

    if (orderError) throw orderError;

    // 2. Create Seller Sub-orders
    for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
      const sellerSubtotal = sellerItems.reduce((sum, item) => sum + (item.verifiedPrice * item.quantity), 0);
      
      let finalSellerId = sellerId;
      if (sellerId === "icon_official") {
         // Resolve to actual ICON Official seller UUID if available, else skip sub-order creation or handle gracefully
         const { data: iconSeller } = await supabaseAdmin.from('sellers').select('id').eq('seller_type', 'icon_official').limit(1).single();
         finalSellerId = iconSeller?.id || null;
      }
      
      let sellerOrderId = null;
      
      if (finalSellerId) {
        const { data: subOrderData, error: subOrderError } = await supabaseAdmin.from("seller_orders").insert([{
          parent_order_id: orderData.id,
          seller_id: finalSellerId,
          subtotal_amount: sellerSubtotal,
          shipping_cost: 0,
          total_amount: sellerSubtotal,
          status: "PENDING_PAYMENT"
        }]).select().single();
        
        if (subOrderError) console.error("Suborder Error:", subOrderError);
        else sellerOrderId = subOrderData.id;
        
        // Setup Commission (Default 10%)
        if (sellerOrderId) {
          const commRate = 10.00;
          const commAmt = sellerSubtotal * 0.10;
          await supabaseAdmin.from("commissions").insert([{
            seller_order_id: sellerOrderId,
            seller_id: finalSellerId,
            gross_amount: sellerSubtotal,
            commission_rate: commRate,
            commission_amount: commAmt,
            seller_net_amount: sellerSubtotal - commAmt
          }]);
        }
      }
      
      // Insert Items
      const orderItems = sellerItems.map((item) => ({
        order_id: orderData.id,
        seller_order_id: sellerOrderId,
        seller_id: finalSellerId,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.verifiedPrice,
        configuration_details: {
          product_name: item.dbProduct.name,
          sku: item.dbProduct.sku,
          width: item.width,
          height: item.height,
          motorType: item.motorType,
          selected_variant: item.selectedVariant
        }
      }));
      
      await supabaseAdmin.from("order_items").insert(orderItems);
    }

    // 3. Initialize Paystack
    const amountInKobo = totalAmount * 100;
    const siteUrl = "https://iconj-web-rust.vercel.app";
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
        callback_url: `${siteUrl}/checkout/verify`,
        metadata: {
          order_id: orderData.id,
          custom_fields: [
            { display_name: "Customer Name", variable_name: "customer_name", value: name },
            { display_name: "Phone", variable_name: "phone", value: body.phone }
          ]
        }
      })
    });

    const paystackData = await paystackResponse.json();
    if (!paystackData.status) throw new Error("Paystack initialization failed.");

    // 4. Create Payment Record
    await supabaseAdmin.from("payments").insert([{
      order_id: orderData.id,
      user_id: userId || null,
      amount: totalAmount,
      provider_reference: paystackData.data.reference,
      status: "PENDING"
    }]);

    return NextResponse.json({ 
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference 
    });

  } catch (error: any) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
