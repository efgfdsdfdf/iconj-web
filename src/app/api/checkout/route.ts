import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { calculateDDPShippingForCart, snapshotShippingForOrder } from "@/lib/shipping";
import { freezeOrderAttribution, incrementProfileStats } from "@/lib/analytics";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, email, name, userId, sessionId, coupon_id, discount_amount } = body;

    const cookieStore = await cookies();
    const referralCode = cookieStore.get('iconj_ref')?.value;

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

      // Add Custom Pricing from User (e.g. dimensions)
      if (item.price) {
        // If the user's computed price is higher or different due to sizes, 
        // we use the item.price, but we should strictly verify it if this was production.
        // For now, accept the cart item price for custom sized blinds.
        verifiedPrice = item.price;
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

    const cartItemsForShipping = verifiedItems.map((item: any) => ({
      productId: item.dbProduct.id,
      quantity: item.quantity,
      isCustomSize: !!item.width && !!item.height && item.width !== '0cm' && item.height !== '0cm' && item.width !== 'Standard' && item.height !== 'Standard'
    }));

    const shippingResult = await calculateDDPShippingForCart(cartItemsForShipping);
    if (shippingResult.blocksCheckout) {
      return NextResponse.json({ error: shippingResult.blocksCheckoutReason, requiresQuote: true }, { status: 400 });
    }

    const shippingFee = shippingResult.totalCustomerShipping;
    
    // Server-side Coupon Validation
    let couponDiscount = 0;
    if (coupon_id) {
      const { data: coupon } = await supabaseAdmin.from("coupons").select("*").eq("id", coupon_id).eq("is_active", true).single();
      if (coupon) {
        const now = new Date();
        const isStarted = !coupon.start_date || new Date(coupon.start_date) <= now;
        const isExpired = coupon.end_date && new Date(coupon.end_date) < now;
        const isLimitReached = coupon.usage_limit !== null && coupon.times_used >= coupon.usage_limit;
        const isMinMet = !coupon.min_order_amount || subtotal >= Number(coupon.min_order_amount);
        
        if (isStarted && !isExpired && !isLimitReached && isMinMet) {
          if (coupon.discount_type === "percentage") {
            couponDiscount = (subtotal * Number(coupon.discount_value)) / 100;
            if (coupon.max_discount_amount) couponDiscount = Math.min(couponDiscount, Number(coupon.max_discount_amount));
          } else if (coupon.discount_type === "fixed_amount") {
            couponDiscount = Math.min(Number(coupon.discount_value), subtotal);
          }
        }
      }
    }
    couponDiscount = Math.round(couponDiscount);

    const totalAmount = Math.max(0, subtotal + shippingFee - couponDiscount);

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
      estimated_shipping: shippingResult.totalCustomerShipping,
      shipping_status: shippingResult.worstStatus === 'FORMULA_CONFIRMED' ? 'FORMULA_CONFIRMED' : 'ESTIMATED',
      payment_status: "PENDING",
      order_status: "NEW",
      delivery_address: { ...body.address, name: body.name, phone: body.phone, email: email },
    }]).select().single();

    if (orderError) throw orderError;

    await snapshotShippingForOrder(orderData.id, shippingResult);

    // Freeze attribution snapshot onto this order
    if (sessionId) {
      await freezeOrderAttribution(orderData.id, sessionId, userId || null);
    }

    // Record coupon usage (increment times_used + log usage)
    if (coupon_id && couponDiscount > 0) {
      await supabaseAdmin.rpc('increment_coupon_usage', { c_id: coupon_id });
      await supabaseAdmin.from('coupon_usages').insert([{
        coupon_id,
        user_id: userId || null,
        order_id: orderData.id,
        discount_applied: couponDiscount
      }]);
    }

    // Process Referral Partner
    if (referralCode) {
      const { data: partner } = await supabaseAdmin
        .from('referral_partners')
        .select('id, commission_type, commission_value')
        .eq('referral_code', referralCode)
        .eq('is_active', true)
        .single();
        
      if (partner) {
        const commissionAmount = partner.commission_type === 'percentage' 
          ? totalAmount * (Number(partner.commission_value) / 100) 
          : Number(partner.commission_value);
          
        await supabaseAdmin.from('referral_tracking').insert([{
          partner_id: partner.id,
          order_id: orderData.id,
          referred_user_id: userId || null,
          status: 'PENDING',
          commission_earned: commissionAmount
        }]);
      }
    }

    const splitSubaccounts: any[] = [];

    // 2. Create Seller Sub-orders
    for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
      const sellerSubtotal = sellerItems.reduce((sum, item) => sum + (item.verifiedPrice * item.quantity), 0);
      
      let finalSellerId = sellerId;
      if (sellerId === "icon_official") {
         const { data: iconSeller } = await supabaseAdmin.from('sellers').select('id').eq('seller_type', 'icon_official').limit(1).single();
         finalSellerId = iconSeller?.id || null;
      }
      
      let sellerOrderId = null;
      let sellerSubaccount = null;
      
      if (finalSellerId) {
        // Fetch payout account to check if they have a Paystack Subaccount
        const { data: payoutAcc } = await supabaseAdmin
          .from('seller_payout_accounts')
          .select('paystack_subaccount_code')
          .eq('seller_id', finalSellerId)
          .eq('is_primary', true)
          .single();
          
        if (payoutAcc?.paystack_subaccount_code) {
          sellerSubaccount = payoutAcc.paystack_subaccount_code;
        }

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
          const netAmt = sellerSubtotal - commAmt;
          
          await supabaseAdmin.from("commissions").insert([{
            seller_order_id: sellerOrderId,
            seller_id: finalSellerId,
            gross_amount: sellerSubtotal,
            commission_rate: commRate,
            commission_amount: commAmt,
            seller_net_amount: netAmt
          }]);

          // Accumulate for Paystack Split
          if (sellerSubaccount) {
            splitSubaccounts.push({
              subaccount: sellerSubaccount,
              share: Math.round(netAmt * 100) // Share is in Kobo
            });
          }
        }
      }
      
      // Insert Items
      const orderItems = sellerItems.map((item) => ({
        order_id: orderData.id,
        seller_order_id: sellerOrderId,
        seller_id: finalSellerId, // Retain permanent link to seller
        product_id: item.dbProduct.id,
        quantity: item.quantity,
        unit_price: item.verifiedPrice,
        configuration_details: {
          product_name: item.dbProduct.name,
          sku: item.dbProduct.sku,
          width: item.width,
          height: item.height,
          motorType: item.motorType,
          requiresInstall: item.requiresInstall,
          selected_variant: item.selectedVariant,
          custom_notes: item.customNotes
        }
      }));

      await supabaseAdmin.from("order_items").insert(orderItems);

      // Deduct inventory
      for (const item of sellerItems) {
        const { data: inv } = await supabaseAdmin.from("inventory").select("id, available_quantity").eq("product_id", item.dbProduct.id).single();
        if (inv) {
          await supabaseAdmin.from("inventory").update({
            available_quantity: Math.max(0, inv.available_quantity - item.quantity)
          }).eq("id", inv.id);
        }
      }
    }

    // 3. Initialize Paystack
    const amountInKobo = totalAmount * 100;
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || request.headers.get("origin") || "https://iconj-web-rust.vercel.app";
    
    // Construct payload
    const paystackPayload: any = {
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
    };

    // Apply Split if any sellers have verified subaccounts
    if (splitSubaccounts.length > 0) {
      paystackPayload.split = {
        type: "flat",
        bearer_type: "all", // Distribute Paystack fees pro-rata
        subaccounts: splitSubaccounts
      };
    }

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(paystackPayload)
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

    return NextResponse.json({ authorization_url: paystackData.data.authorization_url });

  } catch (error: any) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: error.message || "Checkout failed" }, { status: 500 });
  }
}

