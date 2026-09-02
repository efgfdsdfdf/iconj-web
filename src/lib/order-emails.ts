import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export const EMAIL_TYPES = {
  PAYMENT_RECEIPT: 'PAYMENT_RECEIPT',
  ORDER_PROCESSING: 'ORDER_PROCESSING',
  SENT_TO_SUPPLIER: 'SENT_TO_SUPPLIER',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED'
} as const;

const BRAND = {
  primary: '#1e3a5f',
  accent: '#2563eb',
  bg: '#f8fafc',
  text: '#0f172a'
};

const siteUrl = 'https://iconj-web-rust.vercel.app';

// ─── Low-level email sender ────────────────────────────────────────
async function sendHtmlEmail(toEmail: string, subject: string, htmlContent: string) {
  if (!(process.env.SMTP_PASS || process.env.EMAIL_PASS)) {
    console.log("Email env vars not configured. Skipping email to " + toEmail);
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.resend.com",
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: process.env.SMTP_PORT === "465" || !process.env.SMTP_PORT,
      auth: { 
        user: process.env.SMTP_USER || "resend", 
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS 
      },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"ICONJ Orders" <support@iconj.com.ng>',
      to: toEmail,
      subject,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

// ─── Idempotent email dispatcher ───────────────────────────────────
export async function sendOrderEmail(
  orderId: string,
  emailType: string,
  recipientEmail: string,
  subject: string,
  htmlContent: string
) {
  try {
    // 1. Check for existing SENT record
    const { data: existing } = await supabase
      .from('order_emails')
      .select('status')
      .eq('order_id', orderId)
      .eq('email_type', emailType)
      .single();

    if (existing && existing.status === 'SENT') {
      return { success: true, alreadySent: true };
    }

    // 2. Upsert a PENDING record (unique constraint prevents duplicates)
    const { error: insertError } = await supabase
      .from('order_emails')
      .upsert({
        order_id: orderId,
        email_type: emailType,
        recipient_email: recipientEmail,
        status: 'PENDING'
      }, { onConflict: 'order_id,email_type' });

    if (insertError) {
      console.error("Failed to insert pending order_email:", insertError);
      return { success: false, alreadySent: false };
    }

    // 3. Send email
    const emailSent = await sendHtmlEmail(recipientEmail, subject, htmlContent);

    // 4. Update status
    if (emailSent) {
      await supabase
        .from('order_emails')
        .update({ status: 'SENT', sent_at: new Date().toISOString(), error_message: null })
        .eq('order_id', orderId)
        .eq('email_type', emailType);
      return { success: true, alreadySent: false };
    } else {
      await supabase
        .from('order_emails')
        .update({ status: 'FAILED', error_message: 'Nodemailer failed to send email' })
        .eq('order_id', orderId)
        .eq('email_type', emailType);
      return { success: false, alreadySent: false };
    }
  } catch (err) {
    console.error("Error in sendOrderEmail:", err);
    return { success: false, alreadySent: false };
  }
}

// ─── Email template fragments ──────────────────────────────────────
function generateHeader() {
  return `
    <div style="background-color: ${BRAND.primary}; padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-family: Arial, sans-serif; letter-spacing: 3px; font-weight: 800;">ICONJ</h1>
      <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 11px; font-family: Arial, sans-serif; letter-spacing: 1px;">PREMIUM WINDOW TREATMENTS</p>
    </div>
  `;
}

function generateFooter() {
  return `
    <div style="margin-top: 30px; padding: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 13px; font-family: Arial, sans-serif;">
      <p style="margin: 0 0 8px;">Need help? Contact us at <a href="mailto:support@iconj.com" style="color: ${BRAND.accent}; text-decoration: none;">support@iconj.com</a></p>
      <p style="margin: 0 0 8px;"><a href="${siteUrl}" style="color: ${BRAND.accent}; text-decoration: none;">Visit ICONJ</a></p>
      <p style="margin: 0; color: #94a3b8;">&copy; ${new Date().getFullYear()} ICONJ. All rights reserved.</p>
    </div>
  `;
}

// ─── Receipt email ─────────────────────────────────────────────────
export function generateReceiptEmail(order: any, items: any[]) {
  const customerName = order.delivery_address?.name || 'Valued Customer';
  const orderShortId = order.id.split('-')[0].toUpperCase();
  const paymentDate = new Date(order.created_at || Date.now()).toLocaleString('en-NG', {
    dateStyle: 'full', timeStyle: 'short'
  });

  const itemsHtml = items.map((item: any) => {
    const name = item.product?.name || item.product_name || 'Product';
    const qty = item.quantity;
    const unitPrice = Number(item.unit_price);
    const lineTotal = qty * unitPrice;
    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-family: Arial, sans-serif; color: ${BRAND.text};">${name} &times; ${qty}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: Arial, sans-serif; color: ${BRAND.text};">&#8358;${unitPrice.toLocaleString()}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: Arial, sans-serif; color: ${BRAND.text}; font-weight: 600;">&#8358;${lineTotal.toLocaleString()}</td>
      </tr>
    `;
  }).join('');

  const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * Number(item.unit_price)), 0);
  const total = Number(order.total_amount);
  const shippingFee = Number(order.shipping_cost) || 0;

  return `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9;">
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: ${BRAND.bg}; border: 1px solid #e2e8f0;">
      ${generateHeader()}

      <div style="padding: 30px; background-color: white;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 64px; height: 64px; background-color: #dcfce7; border-radius: 50%; margin: 0 auto 16px; line-height: 64px; font-size: 32px;">&#10003;</div>
          <h2 style="color: ${BRAND.text}; margin: 0; font-size: 22px;">Payment Successful</h2>
        </div>

        <p style="color: ${BRAND.text}; font-size: 15px;">Dear ${customerName},</p>
        <p style="color: ${BRAND.text}; font-size: 15px; line-height: 1.6;">
          Thank you for shopping with ICONJ. Your payment has been successfully received and your order is now being processed.
        </p>
        <p style="color: #64748b; font-size: 13px; font-style: italic;">Keep this email as your official payment receipt.</p>

        <div style="background-color: ${BRAND.bg}; padding: 16px 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid ${BRAND.accent};">
          <table style="width: 100%; font-size: 14px; color: ${BRAND.text}; font-family: Arial, sans-serif;">
            <tr><td style="padding: 4px 0;"><strong>Order ID:</strong></td><td style="text-align: right;">#${orderShortId}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Payment Ref:</strong></td><td style="text-align: right; font-family: monospace; font-size: 12px;">${order.id}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Date:</strong></td><td style="text-align: right;">${paymentDate}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Status:</strong></td><td style="text-align: right;"><span style="background-color: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">PAID</span></td></tr>
          </table>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; color: ${BRAND.text}; font-size: 14px;">
          <thead>
            <tr style="background-color: ${BRAND.bg};">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #cbd5e1;">Item</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #cbd5e1;">Unit Price</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #cbd5e1;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 10px 12px; text-align: right; font-weight: bold;">Subtotal:</td>
              <td style="padding: 10px 12px; text-align: right;">&#8358;${subtotal.toLocaleString()}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 10px 12px; text-align: right; font-weight: bold;">Shipping:</td>
              <td style="padding: 10px 12px; text-align: right;">&#8358;${shippingFee.toLocaleString()}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold; font-size: 16px; border-top: 2px solid #cbd5e1;">Total Paid (NGN):</td>
              <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 16px; border-top: 2px solid #cbd5e1; color: ${BRAND.accent};">&#8358;${total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${siteUrl}/track?id=${order.id}" style="background-color: ${BRAND.accent}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px;">Track Your Order</a>
        </div>

        ${generateFooter()}
      </div>
    </div>
    </body></html>
  `;
}

// ─── Status update email ───────────────────────────────────────────
export function generateStatusEmail(order: any, items: any[], statusType: string, extraData?: any) {
  const customerName = order.delivery_address?.name || 'Valued Customer';
  const orderShortId = order.id.split('-')[0].toUpperCase();

  let heading = '';
  let message = '';
  let iconHtml = '';
  let iconBg = '';

  switch (statusType) {
    case 'PROCESSING':
      heading = 'Your Order Is Being Processed';
      message = 'Great news! Your order has been confirmed and our team is now preparing it.';
      iconHtml = '&#9881;'; iconBg = '#dbeafe';
      break;
    case 'SENT_TO_SUPPLIER':
      heading = 'Your Order Has Been Sent for Fulfillment';
      message = 'Your order has been sent to our fulfillment team and is being prepared for shipment.';
      iconHtml = '&#128230;'; iconBg = '#e0e7ff';
      break;
    case 'SHIPPED':
      heading = 'Your Order Has Been Shipped!';
      message = 'Good news! Your order is on its way to you.';
      if (extraData?.tracking_number) {
        message += `<br><br><strong>Tracking Number:</strong> ${extraData.tracking_number}`;
        if (extraData?.shipping_carrier) {
          message += `<br><strong>Carrier:</strong> ${extraData.shipping_carrier}`;
        }
        message += `<br><br><a href="https://parcelsapp.com/en/tracking/${extraData.tracking_number}" style="color: ${BRAND.accent};">Track your shipment here</a>`;
      }
      iconHtml = '&#128666;'; iconBg = '#fef3c7';
      break;
    case 'DELIVERED':
      heading = 'Your Order Has Been Delivered!';
      message = 'Your order has been successfully delivered. We hope you love your purchase! If you have any issues, please don\'t hesitate to contact us.';
      iconHtml = '&#10004;'; iconBg = '#dcfce7';
      break;
    case 'CANCELLED':
      heading = 'Your Order Has Been Cancelled';
      message = 'We\'re sorry to inform you that your order has been cancelled.';
      if (extraData?.reason) {
        message += `<br><br><strong>Reason:</strong> ${extraData.reason}`;
      }
      message += '<br><br>If you believe this was an error or need assistance, please contact our support team.';
      iconHtml = '&#10006;'; iconBg = '#fee2e2';
      break;
    case 'REFUNDED':
      heading = 'Your Refund Has Been Processed';
      message = 'Your refund has been processed. Please allow 3-5 business days for the funds to reflect in your account.';
      iconHtml = '&#8634;'; iconBg = '#e0e7ff';
      break;
    case 'SUPPLIER_CANNOT_FULFILL':
      heading = 'Action Required: Update Your Customization';
      message = 'We\'re sorry, but one of the specifications in your customized order is currently unavailable from our supplier. Please log in to your ICONJ account to review the available alternative or contact us so we can help resolve the order.';
      if (extraData?.unavailable_spec) {
        message += `<br><br><strong>Unavailable Specification:</strong> ${extraData.unavailable_spec}`;
      }
      if (extraData?.alternative_offered) {
        message += `<br><strong>Alternative Offered:</strong> ${extraData.alternative_offered}`;
      }
      if (extraData?.price_difference && Number(extraData.price_difference) !== 0) {
        message += `<br><strong>Price Difference:</strong> ₦${Number(extraData.price_difference).toLocaleString()}`;
      }
      message += `<br><br><a href="https://iconj.com.ng/account/orders/${order.id}" style="display:inline-block;padding:12px 24px;background-color:${BRAND.accent};color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Review & Choose Alternative</a>`;
      iconHtml = '&#9888;'; iconBg = '#fef2f2';
      break;
    case 'CUSTOMER_ACCEPTED_ALTERNATIVE':
      heading = 'Alternative Accepted — Order Resuming';
      message = 'Great news! You\'ve accepted the alternative specification for your order. We\'ve updated the order and it is now being sent back for fulfillment.';
      iconHtml = '&#10004;'; iconBg = '#dcfce7';
      break;
    default:
      heading = 'Order Update';
      message = `Your order status has been updated to: ${statusType.replace(/_/g, ' ')}.`;
      iconHtml = '&#8505;'; iconBg = '#f1f5f9';
  }

  const itemsHtml = items.map((item: any) => {
    const name = item.product?.name || item.product_name || 'Product';
    return `<li style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-family: Arial, sans-serif; color: ${BRAND.text};">${name} &times; ${item.quantity}</li>`;
  }).join('');

  return `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9;">
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: ${BRAND.bg}; border: 1px solid #e2e8f0;">
      ${generateHeader()}

      <div style="padding: 30px; background-color: white;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 64px; height: 64px; background-color: ${iconBg}; border-radius: 50%; margin: 0 auto 16px; line-height: 64px; font-size: 28px;">${iconHtml}</div>
          <h2 style="color: ${BRAND.text}; margin: 0; font-size: 20px;">${heading}</h2>
        </div>

        <p style="color: ${BRAND.text}; font-size: 15px;">Dear ${customerName},</p>
        <p style="color: ${BRAND.text}; font-size: 15px; line-height: 1.6;">${message}</p>

        <div style="background-color: ${BRAND.bg}; padding: 16px 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid ${BRAND.accent};">
          <h3 style="margin: 0 0 12px; color: ${BRAND.text}; font-size: 15px;">Order #${orderShortId}</h3>
          <ul style="list-style: none; padding: 0; margin: 0;">${itemsHtml}</ul>
          <p style="margin: 12px 0 0; font-weight: bold; color: ${BRAND.text}; font-size: 15px;">Total: &#8358;${Number(order.total_amount).toLocaleString()}</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${siteUrl}/track?id=${order.id}" style="background-color: ${BRAND.accent}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px;">Track Your Order</a>
        </div>

        ${generateFooter()}
      </div>
    </div>
    </body></html>
  `;
}

// ─── Data fetcher ──────────────────────────────────────────────────
async function getOrderDetails(orderId: string) {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !order) throw new Error('Failed to fetch order: ' + orderError?.message);

  // Fetch items WITH product names
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*, product:products(name)')
    .eq('order_id', orderId);

  if (itemsError || !items) throw new Error('Failed to fetch order items: ' + itemsError?.message);

  // Normalize product_name for template access
  const normalizedItems = items.map((item: any) => ({
    ...item,
    product_name: item.product?.name || 'Product'
  }));

  // Determine customer email - try delivery address first, then Auth
  let customerEmail = order.delivery_address?.email;
  if (!customerEmail && order.user_id) {
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(order.user_id);
      if (authUser?.user?.email) customerEmail = authUser.user.email;
    } catch (e) {
      console.error("Failed to fetch user email from Auth:", e);
    }
  }

  return { order, items: normalizedItems, customerEmail };
}

// ─── Convenience senders ───────────────────────────────────────────
export async function sendPaymentReceipt(orderId: string) {
  const { order, items, customerEmail } = await getOrderDetails(orderId);
  if (!customerEmail) {
    console.error('No customer email found for order', orderId);
    return { success: false, error: 'No customer email' };
  }
  const html = generateReceiptEmail(order, items);
  return sendOrderEmail(orderId, EMAIL_TYPES.PAYMENT_RECEIPT, customerEmail, `ICONJ - Payment Receipt #${order.id.split('-')[0].toUpperCase()}`, html);
}

export async function sendStatusNotification(orderId: string, statusType: string, extraData?: any) {
  const { order, items, customerEmail } = await getOrderDetails(orderId);
  if (!customerEmail) {
    console.error('No customer email found for order', orderId);
    return { success: false, error: 'No customer email' };
  }
  const html = generateStatusEmail(order, items, statusType, extraData);
  const statusLabel = statusType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const subject = `ICONJ - ${statusLabel} | Order #${order.id.split('-')[0].toUpperCase()}`;
  return sendOrderEmail(orderId, statusType, customerEmail, subject, html);
}
