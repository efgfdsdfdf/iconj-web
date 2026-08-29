"use server";

import { createClient } from "@supabase/supabase-js";
import { sendEmailTo, sendAdminNotification } from "@/lib/email";
import { creditSellerWallet } from "@/lib/wallet";

export async function verifyPaymentAndCompleteOrder(reference: string) {
  try {
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });
    
    const paystackData = await paystackRes.json();
    if (!paystackData.status || paystackData.data.status !== "success") {
      return { success: false, message: "Payment verification failed" };
    }

    const orderId = paystackData.data.metadata?.order_id || paystackData.data.reference || reference;
    
    if (!orderId) {
      return { success: false, message: "Order ID not found in transaction metadata" };
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update main order
    await supabaseAdmin.from("orders").update({
      payment_status: "PAID",
      order_status: "PAYMENT_CONFIRMED", 
      paystack_reference: reference,
      admin_viewed: false // Important for admin notifications
    }).eq("id", orderId);

    // Update suborders
    await supabaseAdmin.from("seller_orders").update({
      status: "PROCESSING"
    }).eq("parent_order_id", orderId);

    // Update payment record
    await supabaseAdmin.from("payments").update({
      status: "SUCCESS"
    }).eq("order_id", orderId);

    // Add timeline event
    await supabaseAdmin.from('order_events').insert({
      order_id: orderId,
      event_type: 'PAYMENT_CONFIRMED',
      description: `Payment confirmed (Ref: ${reference}).`
    });

    // Sync financial ledger for admin payouts page
    const { data: sellerOrders } = await supabaseAdmin.from("seller_orders").select("id, seller_id").eq("parent_order_id", orderId);
    if (sellerOrders && sellerOrders.length > 0) {
      const sellerOrderIds = sellerOrders.map(so => so.id);
      const { data: commissions } = await supabaseAdmin.from("commissions").select("*").in("seller_order_id", sellerOrderIds);
      
      if (commissions && commissions.length > 0) {
        // Idempotency check: Don't insert if webhook already did it
        const { data: existingLedger } = await supabaseAdmin.from('financial_ledger').select('id').eq('paystack_reference', reference).limit(1);
        
        if (!existingLedger || existingLedger.length === 0) {
          const ledgerEntries = [];
          for (const comm of commissions) {
            ledgerEntries.push({
              seller_id: comm.seller_id,
              order_id: orderId,
              paystack_reference: reference,
              transaction_type: 'SALE_GROSS',
              amount: comm.gross_amount,
              description: 'Customer payment received'
            });
            ledgerEntries.push({
              seller_id: comm.seller_id,
              order_id: orderId,
              paystack_reference: reference,
              transaction_type: 'ICONJ_COMMISSION',
              amount: -comm.commission_amount,
              description: 'ICONJ platform fee deduction'
            });
            ledgerEntries.push({
              seller_id: comm.seller_id,
              order_id: orderId,
              paystack_reference: reference,
              transaction_type: 'SETTLEMENT_PENDING',
              amount: comm.seller_net_amount,
              description: 'Funds pending settlement to payout account'
            });
          }
          await supabaseAdmin.from("financial_ledger").insert(ledgerEntries);
          await supabaseAdmin.from("commissions").update({ status: 'AVAILABLE' }).in('id', commissions.map(c => c.id));

          // Credit each seller's wallet with their net earnings
          for (const comm of commissions) {
            try {
              await creditSellerWallet(
                comm.seller_id,
                orderId,
                comm.seller_net_amount,
                `Earnings from order #${orderId.split('-')[0].toUpperCase()}`
              );
            } catch (walletErr) {
              console.error(`Failed to credit wallet for seller ${comm.seller_id}:`, walletErr);
            }
          }
        }
      }

      // Notify each seller via email about their new order
      const { data: order } = await supabaseAdmin.from("orders").select("delivery_address").eq("id", orderId).single();
      const addr = order?.delivery_address || {};

      for (const so of sellerOrders) {
        try {
          // Get seller email from Auth
          const { data: seller } = await supabaseAdmin.from("sellers").select("profile_id, stores(store_name)").eq("id", so.seller_id).single();
          if (!seller?.profile_id) continue;
          const { data: { user: sellerUser } } = await supabaseAdmin.auth.admin.getUserById(seller.profile_id);
          if (!sellerUser?.email) continue;
          const profile = { email: sellerUser.email }; // Keep variable name for rest of logic

          // Get order items for this seller
          const { data: items } = await supabaseAdmin.from("order_items").select("*, products(name)").eq("seller_order_id", so.id);
          
          const itemRows = (items || []).map((item: any) => {
            const config = item.configuration_details || {};
            let specs = '';
            if (config.width && config.width !== '0cm') specs += `Width: ${config.width} | `;
            if (config.height && config.height !== '0cm') specs += `Height: ${config.height} | `;
            if (config.motorType) specs += `Motor: ${config.motorType} | `;
            if (config.requiresInstall) specs += `Installation: Yes | `;
            if (config.selected_variant) specs += `Variant: ${typeof config.selected_variant === 'object' ? JSON.stringify(config.selected_variant) : config.selected_variant}`;
            
            return `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 8px; font-weight: 600;">${config.product_name || item.products?.name || 'Product'}</td>
                <td style="padding: 12px 8px; text-align: center;">${item.quantity}</td>
                <td style="padding: 12px 8px; text-align: right; font-weight: 700;">₦${(item.unit_price * item.quantity).toLocaleString()}</td>
              </tr>
              ${specs ? `<tr><td colspan="3" style="padding: 4px 8px 12px; font-size: 12px; color: #d97706; background: #fffbeb;">📐 ${specs.replace(/\| $/, '')}</td></tr>` : ''}
            `;
          }).join('');

          const { data: subOrder } = await supabaseAdmin.from("seller_orders").select("total_amount").eq("id", so.id).single();

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "ICONJ Orders <noreply@iconj.com.ng>",
              to: profile.email,
              subject: `🛒 New Order Received! #${orderId.split('-')[0].toUpperCase()}`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: #0f172a; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; font-size: 20px;">New Order Received! 🎉</h1>
                    <p style="margin: 4px 0 0; opacity: 0.7; font-size: 14px;">Order #${orderId.split('-')[0].toUpperCase()}</p>
                  </div>
                  <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
                    <h3 style="margin: 0 0 8px; font-size: 14px; color: #64748b;">CUSTOMER DETAILS</h3>
                    <p style="margin: 0;"><strong>${addr.name || 'N/A'}</strong></p>
                    <p style="margin: 2px 0; color: #475569; font-size: 14px;">${addr.phone || ''} | ${addr.email || ''}</p>
                    <p style="margin: 2px 0; color: #475569; font-size: 14px;">${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''}</p>
                    
                    <h3 style="margin: 20px 0 8px; font-size: 14px; color: #64748b;">ITEMS ORDERED</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                      <thead>
                        <tr style="background: #f1f5f9; border-bottom: 2px solid #e2e8f0;">
                          <th style="padding: 8px; text-align: left;">Product</th>
                          <th style="padding: 8px; text-align: center;">Qty</th>
                          <th style="padding: 8px; text-align: right;">Amount</th>
                        </tr>
                      </thead>
                      <tbody>${itemRows}</tbody>
                    </table>
                    
                    <div style="margin-top: 16px; padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; text-align: right;">
                      <span style="font-size: 14px; color: #15803d;">Your Earnings:</span>
                      <span style="font-size: 20px; font-weight: 800; color: #166534; margin-left: 8px;">₦${subOrder?.total_amount?.toLocaleString() || 'N/A'}</span>
                    </div>

                    <div style="margin-top: 20px; text-align: center;">
                      <a href="https://iconj-web-rust.vercel.app/seller/orders" style="background: #f97316; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                        View Order in Dashboard →
                      </a>
                    </div>
                  </div>
              `
            })
          });
        } catch (e) { console.error("Seller email error:", e); }
      }

      // Notify the customer
      try {
        const { data: orderDetails } = await supabaseAdmin.from("orders").select("total_amount, user_id").eq("id", orderId).single();
        
        let customerEmail = addr.email;
        let customerName = addr.name?.split(' ')[0] || 'there';

        if (orderDetails?.user_id) {
          const { data: profile } = await supabaseAdmin.from("profiles").select("email, full_name").eq("id", orderDetails.user_id).single();
          if (profile?.email) {
            customerEmail = profile.email;
            if (profile.full_name) customerName = profile.full_name.split(' ')[0];
          }
        }

        if (customerEmail) {
          const custEmailSuccess = await sendEmailTo(
            customerEmail,
            `🎉 Order Confirmed! #${orderId.split('-')[0].toUpperCase()}`,
            `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px;">Thank you for your order!</h1>
                  <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Order #${orderId.split('-')[0].toUpperCase()}</p>
                </div>
                <div style="padding: 30px 20px; border: 1px solid #e2e8f0; border-top: none;">
                  <h2 style="margin: 0 0 16px; font-size: 18px; color: #1e293b;">Hi ${customerName},</h2>
                  <p style="margin: 0 0 20px; font-size: 15px; color: #475569; line-height: 1.5;">We've received your order and payment of <strong>₦${orderDetails?.total_amount?.toLocaleString()}</strong>. We're currently processing it and will notify you as soon as it ships.</p>
                  
                  <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
                    <h3 style="margin: 0 0 8px; font-size: 13px; color: #64748b; text-transform: uppercase;">Shipping To</h3>
                    <p style="margin: 0; font-size: 14px; color: #334155;"><strong>${addr.name || ''}</strong></p>
                    <p style="margin: 2px 0 0; font-size: 14px; color: #475569;">${addr.street || ''}<br/>${addr.city || ''}, ${addr.state || ''}</p>
                  </div>

                  <div style="text-align: center;">
                    <a href="https://iconj-web-rust.vercel.app/account/orders" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">
                      View Order Status
                    </a>
                  </div>
                </div>
              </div>
            `
          );
          if (custEmailSuccess) {
            await supabaseAdmin.from('order_emails').insert({
              order_id: orderId,
              email_type: 'PAYMENT_RECEIPT',
              recipient_email: customerEmail,
              status: 'SENT',
              sent_at: new Date().toISOString()
            });
          }
        }
      } catch (e) { console.error("Customer email error:", e); }



      // Automate sending orders to respective suppliers
      try {
        const { data: allItems } = await supabaseAdmin.from("order_items").select("*, products(name, supplier_id, suppliers(email, name))").eq("order_id", orderId);
        
        // Group items by supplier
        const supplierGroups: Record<string, { email: string, name: string, items: any[] }> = {};
        
        (allItems || []).forEach(item => {
          const supplier = item.products?.suppliers;
          if (supplier && supplier.email) {
            if (!supplierGroups[supplier.email]) {
              supplierGroups[supplier.email] = { email: supplier.email, name: supplier.name, items: [] };
            }
            supplierGroups[supplier.email].items.push(item);
          }
        });

        // Send email to each supplier
        for (const supplierEmail of Object.keys(supplierGroups)) {
          const group = supplierGroups[supplierEmail];
          
          const supplierItemRows = group.items.map((item: any) => {
            const config = item.configuration_details || {};
            let specs = '';
            if (config.width && config.width !== '0cm') specs += `Width: ${config.width} | `;
            if (config.height && config.height !== '0cm') specs += `Height: ${config.height} | `;
            if (config.motorType) specs += `Motor: ${config.motorType} | `;
            if (config.selected_variant) specs += `Variant: ${typeof config.selected_variant === 'object' ? JSON.stringify(config.selected_variant) : config.selected_variant}`;
            if (config.supplier_sku) specs += `Supplier SKU: ${config.supplier_sku} | `;
            
            return `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 8px; font-weight: 600;">${config.product_name || item.products?.name || 'Product'}</td>
                <td style="padding: 12px 8px; text-align: center;">${item.quantity}</td>
              </tr>
              ${specs ? `<tr><td colspan="2" style="padding: 4px 8px 12px; font-size: 12px; color: #d97706; background: #fffbeb;">📐 ${specs.replace(/\| $/, '')}</td></tr>` : ''}
            `;
          }).join('');

          const emailSuccess = await sendEmailTo(
            group.email,
            `📦 New Fulfillment Order #${orderId.split('-')[0].toUpperCase()} from ICONJ`,
            `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #0f172a; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; font-size: 20px;">New Order for Fulfillment</h1>
                  <p style="margin: 4px 0 0; opacity: 0.7; font-size: 14px;">Order #${orderId.split('-')[0].toUpperCase()}</p>
                </div>
                <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
                  <p>Hello ${group.name},</p>
                  <p>Please fulfill the following items for a new order:</p>
                  
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 20px;">
                    <thead>
                      <tr style="background: #f1f5f9; border-bottom: 2px solid #e2e8f0;">
                        <th style="padding: 8px; text-align: left;">Product</th>
                        <th style="padding: 8px; text-align: center;">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>${supplierItemRows}</tbody>
                  </table>
                  
                  <h3 style="margin: 20px 0 8px; font-size: 14px; color: #64748b;">SHIPPING DETAILS</h3>
                  <p style="margin: 0;"><strong>${addr.name || 'N/A'}</strong></p>
                  <p style="margin: 2px 0; color: #475569; font-size: 14px;">${addr.phone || ''}</p>
                  <p style="margin: 2px 0; color: #475569; font-size: 14px;">${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''}</p>
                  <p style="margin: 2px 0; color: #475569; font-size: 14px;">Nigeria</p>
                </div>
              </div>
            `
          );
          
          if (emailSuccess) {
            await supabaseAdmin.from('order_emails').insert({
              order_id: orderId,
              email_type: 'SENT_TO_SUPPLIER',
              recipient_email: group.email,
              status: 'SENT',
              sent_at: new Date().toISOString()
            });
          }
        }
      } catch (supplierErr) {
        console.error("Failed to automate supplier emails:", supplierErr);
      }

      // Notify the Admin with FULL details (including prices)
      try {
        const { data: allItems } = await supabaseAdmin.from("order_items").select("*, products(name)").eq("order_id", orderId);
        const adminItemRows = (allItems || []).map((item: any) => {
          const config = item.configuration_details || {};
          let specs = '';
          if (config.width && config.width !== '0cm') specs += `Width: ${config.width} | `;
          if (config.height && config.height !== '0cm') specs += `Height: ${config.height} | `;
          if (config.motorType) specs += `Motor: ${config.motorType} | `;
          if (config.requiresInstall) specs += `Installation: Yes | `;
          if (config.selected_variant) specs += `Variant: ${typeof config.selected_variant === 'object' ? JSON.stringify(config.selected_variant) : config.selected_variant}`;
          
          return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 8px; font-weight: 600;">${config.product_name || item.products?.name || 'Product'}</td>
              <td style="padding: 12px 8px; text-align: center;">${item.quantity}</td>
              <td style="padding: 12px 8px; text-align: right; font-weight: 700;">₦${(item.unit_price * item.quantity).toLocaleString()}</td>
            </tr>
            ${specs ? `<tr><td colspan="3" style="padding: 4px 8px 12px; font-size: 12px; color: #d97706; background: #fffbeb;">📐 ${specs.replace(/\| $/, '')}</td></tr>` : ''}
          `;
        }).join('');

        const adminEmailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1e293b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 20px;">[ADMIN] New Order Received! 🎉</h1>
              <p style="margin: 4px 0 0; opacity: 0.7; font-size: 14px;">Order #${orderId.split('-')[0].toUpperCase()}</p>
            </div>
            <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
              <h3 style="margin: 0 0 8px; font-size: 14px; color: #64748b;">CUSTOMER DETAILS</h3>
              <p style="margin: 0;"><strong>${addr.name || 'N/A'}</strong></p>
              <p style="margin: 2px 0; color: #475569; font-size: 14px;">${addr.phone || ''} | ${addr.email || ''}</p>
              <p style="margin: 2px 0; color: #475569; font-size: 14px;">${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''}</p>
              
              <h3 style="margin: 20px 0 8px; font-size: 14px; color: #64748b;">ALL ITEMS ORDERED (INCLUDING DIMENSIONS)</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                  <tr style="background: #f1f5f9; border-bottom: 2px solid #e2e8f0;">
                    <th style="padding: 8px; text-align: left;">Product</th>
                    <th style="padding: 8px; text-align: center;">Qty</th>
                    <th style="padding: 8px; text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>${adminItemRows}</tbody>
              </table>

              <div style="margin-top: 20px; text-align: center;">
                <a href="https://iconj-web-rust.vercel.app/admin/orders/${orderId}" style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                  View Full Order in Admin →
                </a>
              </div>
            </div>
          </div>
        `;

        // Send to the admin email using our configured Nodemailer transport
        await sendAdminNotification(
          `🚨 [ADMIN] New Order: #${orderId.split('-')[0].toUpperCase()}`,
          adminEmailHtml
        );
      } catch (adminErr) {
        console.error("Failed to send admin notification:", adminErr);
      }
    }

    return { success: true, orderId };
  } catch (error: any) {
    console.error("Verification error:", error);
    return { success: false, message: error.message };
  }
}
