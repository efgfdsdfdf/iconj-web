/**
 * Shipping confirmation email helper — extends src/lib/order-emails.ts
 * Called when admin confirms shipping for an order.
 * No existing emails are changed.
 */

import { sendEmailTo } from '@/lib/email';

interface ShippingConfirmedParams {
  orderId: string;
  customerEmail: string;
  customerName: string;
  productTotal: number;
  confirmedShipping: number;
  grandTotal: number;
  currency?: string;
}

export async function sendShippingConfirmedEmail(params: ShippingConfirmedParams): Promise<void> {
  const {
    orderId,
    customerEmail,
    customerName,
    productTotal,
    confirmedShipping,
    grandTotal,
    currency = 'NGN',
  } = params;

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://iconj.com.ng';
  const symbol = currency === 'NGN' ? '₦' : currency;

  const subject = `Shipping Confirmed — Order #${orderId.substring(0, 8).toUpperCase()}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f8fafc; margin:0; padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,0.08);">
    <div style="background:#1e40af;padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">ICONJ</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">Shipping Confirmed</h2>
      <p style="margin:0 0 24px;color:#475569;">Hi ${customerName}, your DDP shipping has been confirmed for your order.</p>

      <div style="background:#f1f5f9;border-radius:8px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:14px;">Product Total</td>
            <td style="padding:6px 0;text-align:right;color:#0f172a;font-size:14px;font-weight:600;">${symbol}${productTotal.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:14px;">Confirmed DDP Shipping</td>
            <td style="padding:6px 0;text-align:right;color:#0f172a;font-size:14px;font-weight:600;">${symbol}${confirmedShipping.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding-top:12px;border-top:1px solid #cbd5e1;color:#0f172a;font-size:16px;font-weight:700;">Total</td>
            <td style="padding-top:12px;border-top:1px solid #cbd5e1;text-align:right;color:#1e40af;font-size:16px;font-weight:700;">${symbol}${grandTotal.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin-bottom:24px;font-size:13px;color:#1e40af;">
        <strong>What is DDP Shipping?</strong><br>
        DDP (Delivered Duty Paid) shipping includes delivery to Nigeria with customs and import handling as per our supplier arrangement. No additional customs charges should be expected.
      </div>

      <a href="${siteUrl}/account/orders" style="display:inline-block;background:#1e40af;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View My Order</a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;">
      <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
        ICONJ · <a href="${siteUrl}" style="color:#94a3b8;">iconj.com.ng</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  await sendEmailTo({
    to: customerEmail,
    subject,
    html,
  });
}

interface ShippingRequiredAdminParams {
  orderId: string;
  customerName: string;
  estimatedShipping: number;
  reason: string;
}

export async function sendShippingConfirmationRequiredAdmin(
  params: ShippingRequiredAdminParams
): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://iconj.com.ng';
  const adminEmail = process.env.ADMIN_EMAIL || 'ezeilodavid292@gmail.com';

  await sendEmailTo({
    to: adminEmail,
    subject: `Action Required: Shipping Confirmation — Order #${params.orderId.substring(0, 8).toUpperCase()}`,
    html: `
      <p>Order <strong>${params.orderId}</strong> for <strong>${params.customerName}</strong> requires shipping confirmation.</p>
      <p><strong>Reason:</strong> ${params.reason}</p>
      <p><strong>Estimated shipping:</strong> ₦${params.estimatedShipping.toLocaleString()}</p>
      <p><a href="${siteUrl}/admin/shipping">Go to Shipping Dashboard →</a></p>
    `,
  });
}
