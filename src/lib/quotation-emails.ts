/**
 * ICONJ Quotation Email Service
 *
 * Mirrors the pattern of order-emails.ts exactly.
 * Uses same SMTP/Resend infrastructure.
 * NEVER includes supplier costs, markup, or admin-only data in customer emails.
 */

import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const siteUrl = 'https://iconj.com.ng';
const adminEmail = process.env.ADMIN_EMAIL || 'ezeilodavid292@gmail.com';

const BRAND = {
  primary: '#1e3a5f',
  accent: '#2563eb',
  bg: '#f8fafc',
  text: '#0f172a',
};

// ─── Email Types ─────────────────────────────────────────────────────────────

export const QUOTATION_EMAIL_TYPES = {
  QUOTATION_RECEIVED_CUSTOMER: 'QUOTATION_RECEIVED_CUSTOMER',
  QUOTATION_RECEIVED_ADMIN: 'QUOTATION_RECEIVED_ADMIN',
  QUOTE_SENT_CUSTOMER: 'QUOTE_SENT_CUSTOMER',
  QUOTE_REMINDER_1: 'QUOTE_REMINDER_1',
  QUOTE_REMINDER_2: 'QUOTE_REMINDER_2',
  QUOTE_ACCEPTED_ADMIN: 'QUOTE_ACCEPTED_ADMIN',
  QUOTE_ACCEPTED_CUSTOMER: 'QUOTE_ACCEPTED_CUSTOMER',
  QUOTE_DECLINED_ADMIN: 'QUOTE_DECLINED_ADMIN',
  QUOTE_EXPIRED_ADMIN: 'QUOTE_EXPIRED_ADMIN',
  QUOTE_EXPIRED_CUSTOMER: 'QUOTE_EXPIRED_CUSTOMER',
  PAYMENT_RECEIVED_ADMIN: 'PAYMENT_RECEIVED_ADMIN',
  PAYMENT_RECEIVED_CUSTOMER: 'PAYMENT_RECEIVED_CUSTOMER',
  ORDER_CREATED_CUSTOMER: 'ORDER_CREATED_CUSTOMER',
  SUPPLIER_SPEC_ISSUE_ADMIN: 'SUPPLIER_SPEC_ISSUE_ADMIN',
  POST_PAYMENT_EXCEPTION_ADMIN: 'POST_PAYMENT_EXCEPTION_ADMIN',
  DELIVERY_ESTIMATE_UPDATED_CUSTOMER: 'DELIVERY_ESTIMATE_UPDATED_CUSTOMER',
} as const;

// ─── Low-level email sender (mirrors order-emails.ts) ────────────────────────

async function sendHtmlEmail(toEmail: string, subject: string, htmlContent: string): Promise<boolean> {
  if (!(process.env.SMTP_PASS || process.env.EMAIL_PASS)) {
    console.log('Email env vars not configured. Skipping email to ' + toEmail);
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.resend.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_PORT === '465' || !process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER || 'resend',
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"ICONJ" <noreply@iconj.com.ng>',
      to: toEmail,
      subject,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// ─── Idempotent quotation email dispatcher (mirrors sendOrderEmail) ───────────

export async function sendQuotationEmail(
  quotationId: string,
  emailType: string,
  recipientEmail: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; alreadySent: boolean }> {
  try {
    // 1. Check for existing SENT record (idempotency)
    const { data: existing } = await supabase
      .from('quotation_emails')
      .select('status')
      .eq('quotation_id', quotationId)
      .eq('email_type', emailType)
      .single();

    if (existing && existing.status === 'SENT') {
      return { success: true, alreadySent: true };
    }

    // 2. Upsert PENDING record (UNIQUE constraint prevents race conditions)
    const { error: insertError } = await supabase
      .from('quotation_emails')
      .upsert({
        quotation_id: quotationId,
        email_type: emailType,
        recipient_email: recipientEmail,
        subject,
        status: 'PENDING',
      }, { onConflict: 'quotation_id,email_type' });

    if (insertError) {
      console.error('Failed to insert pending quotation_email:', insertError);
      return { success: false, alreadySent: false };
    }

    // 3. Send email
    const emailSent = await sendHtmlEmail(recipientEmail, subject, htmlContent);

    // 4. Update status
    if (emailSent) {
      await supabase
        .from('quotation_emails')
        .update({ status: 'SENT', sent_at: new Date().toISOString(), error_message: null })
        .eq('quotation_id', quotationId)
        .eq('email_type', emailType);
      return { success: true, alreadySent: false };
    } else {
      await supabase
        .from('quotation_emails')
        .update({ status: 'FAILED', error_message: 'SMTP failed to send email' })
        .eq('quotation_id', quotationId)
        .eq('email_type', emailType);
      return { success: false, alreadySent: false };
    }
  } catch (err) {
    console.error('Error in sendQuotationEmail:', err);
    return { success: false, alreadySent: false };
  }
}

// ─── HTML Template Helpers ───────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:${BRAND.bg};">
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:40px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <tr><td style="background:${BRAND.primary};padding:28px 32px;">
        <h1 style="margin:0;color:#fff;font-size:24px;">ICONJ</h1>
        <p style="margin:4px 0 0;color:#94b8d4;font-size:13px;">Window Blinds & Curtains</p>
      </td></tr>
      <tr><td style="padding:32px;">${content}</td></tr>
      <tr><td style="background:#f1f5f9;padding:24px 32px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#64748b;font-size:12px;">© ${new Date().getFullYear()} ICONJ. All rights reserved.<br>
        <a href="${siteUrl}" style="color:${BRAND.accent};">${siteUrl}</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function formatSpecs(specifications: Record<string, any>): string {
  const labels: Record<string, string> = {
    width: 'Width', height: 'Height', colour: 'Colour', color: 'Colour',
    design: 'Design', fabric: 'Fabric', blindType: 'Blind Type',
    motorized: 'Motorized', logo: 'Logo', customization: 'Customization',
  };
  const rows = Object.entries(specifications)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => {
      const label = labels[k] || k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const val = typeof v === 'boolean' ? (v ? 'Yes' : 'No') : `${v}`;
      return `<tr><td style="padding:6px 0;color:#64748b;font-size:14px;width:40%;">${label}</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:${BRAND.text};">${val}</td></tr>`;
    })
    .join('');
  return rows ? `<table width="100%">${rows}</table>` : '<p style="color:#64748b;">No specifications recorded.</p>';
}

function formatDelivery(delivery: Record<string, any>): string {
  const parts = [delivery.address, delivery.city, delivery.state, delivery.country || 'Nigeria']
    .filter(Boolean).join(', ');
  return parts || 'Not specified';
}

function btnHtml(href: string, text: string, colour: string = BRAND.accent): string {
  return `<a href="${href}" style="display:inline-block;background:${colour};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">${text}</a>`;
}

// ─── Email Generators ─────────────────────────────────────────────────────────

function genQuotationReceivedCustomer(q: any): string {
  return baseTemplate(`
    <h2 style="color:${BRAND.primary};margin:0 0 8px;">We Received Your Request</h2>
    <p style="color:#64748b;margin:0 0 24px;">Thank you, ${q.customer_name}. We have received your quotation request and will review it promptly.</p>
    <div style="background:#f8fafc;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Quotation Reference</p>
      <p style="margin:0;font-size:22px;font-weight:700;color:${BRAND.primary};">${q.reference}</p>
    </div>
    <h3 style="color:${BRAND.text};margin:0 0 12px;">Product</h3>
    <p style="margin:0 0 8px;color:${BRAND.text};font-weight:600;">${q.product_name}</p>
    <p style="margin:0 0 24px;color:#64748b;">Quantity: ${q.quantity}</p>
    <h3 style="color:${BRAND.text};margin:0 0 12px;">Your Specifications</h3>
    ${formatSpecs(q.specifications || {})}
    <h3 style="color:${BRAND.text};margin:16px 0 8px;">Delivery Location</h3>
    <p style="margin:0 0 24px;color:${BRAND.text};">${formatDelivery(q.delivery_location || {})}</p>
    <div style="background:#eff6ff;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;color:#1e40af;font-size:14px;"><strong>What happens next?</strong><br>
      Our team will review your requirements with our supplier and prepare a personalised quotation for you.
      We will contact you by email once your quotation is ready.</p>
    </div>
    <p style="color:#64748b;margin:0 0 16px;">If you have any questions, please <a href="${siteUrl}/contact" style="color:${BRAND.accent};">contact us</a>.</p>
    ${q.user_id ? btnHtml(`${siteUrl}/account/quotations/${q.id}`, 'Track Your Request') : ''}
  `);
}

function genQuotationReceivedAdmin(q: any): string {
  return baseTemplate(`
    <h2 style="color:${BRAND.primary};margin:0 0 8px;">New Quotation Request</h2>
    <p style="color:#64748b;margin:0 0 24px;">A new quotation request has been submitted.</p>
    <div style="background:#fef3c7;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;color:#92400e;font-weight:700;">Reference: ${q.reference}</p>
      <p style="margin:4px 0 0;color:#92400e;">Submitted: ${new Date(q.created_at).toLocaleString('en-NG')}</p>
    </div>
    <h3 style="color:${BRAND.text};margin:0 0 12px;">Customer</h3>
    <p style="margin:0 0 4px;"><strong>${q.customer_name}</strong></p>
    <p style="margin:0 0 4px;color:#64748b;">${q.customer_email}</p>
    <p style="margin:0 0 24px;color:#64748b;">${q.customer_phone}</p>
    <h3 style="color:${BRAND.text};margin:0 0 12px;">Product</h3>
    <p style="margin:0 0 8px;font-weight:600;">${q.product_name}</p>
    <p style="margin:0 0 24px;color:#64748b;">Quantity: ${q.quantity}</p>
    <h3 style="color:${BRAND.text};margin:0 0 12px;">Specifications</h3>
    ${formatSpecs(q.specifications || {})}
    <h3 style="color:${BRAND.text};margin:16px 0 8px;">Delivery Location</h3>
    <p style="margin:0 0 8px;">${formatDelivery(q.delivery_location || {})}</p>
    ${q.customer_notes ? `<h3 style="color:${BRAND.text};margin:16px 0 8px;">Customer Notes</h3><p style="color:${BRAND.text};">${q.customer_notes}</p>` : ''}
    <p style="margin:24px 0 0;">${btnHtml(`${siteUrl}/admin/quotations/${q.id}`, 'View in Admin Dashboard', BRAND.primary)}</p>
  `);
}

function genQuoteSentCustomer(q: any): string {
  const validUntil = q.quote_valid_until ? new Date(q.quote_valid_until).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';
  const productionEst = q.estimated_production_days ? `${q.estimated_production_days} days` : 'To be confirmed';
  const deliveryEst = q.estimated_delivery_days ? `${q.estimated_delivery_days} days after production` : 'To be confirmed';
  const total = q.customer_total ? `₦${Number(q.customer_total).toLocaleString('en-NG')}` : 'See quotation';

  return baseTemplate(`
    <h2 style="color:${BRAND.primary};margin:0 0 8px;">Your Quotation Is Ready</h2>
    <p style="color:#64748b;margin:0 0 24px;">Dear ${q.customer_name}, we have prepared your personalised quotation.</p>
    <div style="background:#f0fdf4;border:2px solid #22c55e;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:13px;color:#16a34a;text-transform:uppercase;letter-spacing:0.05em;">Total Price</p>
      <p style="margin:0;font-size:36px;font-weight:700;color:#15803d;">${total}</p>
      ${q.customer_shipping && Number(q.customer_shipping) > 0 ? `<p style="margin:8px 0 0;font-size:13px;color:#16a34a;">Includes shipping: ₦${Number(q.customer_shipping).toLocaleString('en-NG')}</p>` : ''}
    </div>
    <h3 style="color:${BRAND.text};margin:0 0 12px;">Product</h3>
    <p style="margin:0 0 4px;font-weight:600;">${q.product_name}</p>
    <p style="margin:0 0 24px;color:#64748b;">Quantity: ${q.quantity}</p>
    <h3 style="color:${BRAND.text};margin:0 0 12px;">Your Specifications</h3>
    ${formatSpecs(q.specifications || {})}
    <table width="100%" style="margin:24px 0;border-top:1px solid #e2e8f0;padding-top:16px;">
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;">Estimated Production</td>
        <td style="padding:8px 0;font-weight:600;font-size:14px;text-align:right;">${productionEst}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;">Estimated Delivery</td>
        <td style="padding:8px 0;font-weight:600;font-size:14px;text-align:right;">${deliveryEst}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;">Quote Valid Until</td>
        <td style="padding:8px 0;font-weight:600;font-size:14px;text-align:right;color:#dc2626;">${validUntil}</td>
      </tr>
    </table>
    <div style="background:#fef3c7;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
      <p style="margin:0;color:#92400e;font-size:13px;">⚠️ Estimated production and delivery times are based on current supplier information and are not guaranteed. We will keep you updated throughout the process.</p>
    </div>
    <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Please note: ICONJ does not provide installation services. Products are delivered to your specified address.</p>
    <p style="margin:0 0 24px;font-size:13px;color:#64748b;">Please ensure your measurements are accurate before accepting.</p>
    <div style="text-align:center;margin:32px 0;">
      ${btnHtml(`${siteUrl}/account/quotations/${q.id}`, 'Accept Quotation →')}
    </div>
    <p style="margin:0;color:#64748b;font-size:13px;">By accepting, you confirm the specifications are correct. You will then be directed to complete payment securely through Paystack.</p>
  `);
}

function genQuoteReminder(q: any, isExpiringSoon: boolean): string {
  const urgency = isExpiringSoon ? 'Your quotation is expiring soon' : 'Your ICONJ quotation is waiting';
  const total = q.customer_total ? `₦${Number(q.customer_total).toLocaleString('en-NG')}` : '';
  const validUntil = q.quote_valid_until ? new Date(q.quote_valid_until).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  return baseTemplate(`
    <h2 style="color:${isExpiringSoon ? '#dc2626' : BRAND.primary};margin:0 0 8px;">${urgency}</h2>
    <p style="color:#64748b;margin:0 0 24px;">Dear ${q.customer_name}, your quotation for <strong>${q.product_name}</strong> is ready and waiting for your response.</p>
    ${total ? `<div style="text-align:center;margin:24px 0;"><p style="margin:0;font-size:28px;font-weight:700;color:#15803d;">${total}</p></div>` : ''}
    ${validUntil ? `<p style="text-align:center;color:#dc2626;font-weight:600;margin:0 0 24px;">Expires: ${validUntil}</p>` : ''}
    <div style="text-align:center;margin:32px 0;">
      ${btnHtml(`${siteUrl}/account/quotations/${q.id}`, 'View Your Quotation →')}
    </div>
    <p style="color:#64748b;font-size:13px;margin:0;">If you have any questions, please <a href="${siteUrl}/contact" style="color:${BRAND.accent};">contact us</a>.</p>
  `);
}

function genQuoteAcceptedCustomer(q: any): string {
  return baseTemplate(`
    <h2 style="color:${BRAND.primary};margin:0 0 8px;">Quotation Accepted</h2>
    <p style="color:#64748b;margin:0 0 24px;">Dear ${q.customer_name}, you have accepted your ICONJ quotation. Please complete your payment to proceed.</p>
    <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 4px;color:#16a34a;font-size:13px;">Amount Due</p>
      <p style="margin:0;font-size:32px;font-weight:700;color:#15803d;">₦${Number(q.customer_total).toLocaleString('en-NG')}</p>
    </div>
    <p style="color:#64748b;margin:0 0 24px;">Your specifications have been recorded and will be confirmed once payment is received.</p>
    <div style="text-align:center;margin:32px 0;">
      ${btnHtml(`${siteUrl}/account/quotations/${q.id}`, 'Proceed to Payment →', '#16a34a')}
    </div>
    <p style="color:#64748b;font-size:13px;">Payment is processed securely through Paystack.</p>
  `);
}

function genQuoteAcceptedAdmin(q: any): string {
  return baseTemplate(`
    <h2 style="color:${BRAND.primary};margin:0 0 8px;">🟤 Quotation Accepted — Awaiting Payment</h2>
    <p style="color:#64748b;margin:0 0 24px;">Customer has accepted the quotation. Awaiting payment.</p>
    <p><strong>${q.customer_name}</strong> (${q.customer_email})</p>
    <p>Reference: <strong>${q.reference}</strong></p>
    <p>Customer Total: <strong>₦${Number(q.customer_total).toLocaleString('en-NG')}</strong></p>
    <p style="margin:24px 0;">${btnHtml(`${siteUrl}/admin/quotations/${q.id}`, 'View Quotation', BRAND.primary)}</p>
  `);
}

function genPaymentReceivedCustomer(q: any, orderId: string): string {
  return baseTemplate(`
    <h2 style="color:#16a34a;margin:0 0 8px;">✅ Payment Confirmed</h2>
    <p style="color:#64748b;margin:0 0 24px;">Dear ${q.customer_name}, your payment has been received and your order is now being processed.</p>
    <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:#16a34a;">Quotation Reference</p>
      <p style="margin:0 0 8px;font-weight:700;">${q.reference}</p>
      <p style="margin:0 0 4px;color:#16a34a;">Amount Paid</p>
      <p style="margin:0;font-weight:700;">₦${Number(q.payment_amount).toLocaleString('en-NG')}</p>
    </div>
    <p style="color:#64748b;margin:0 0 8px;">Your order has been created and our team will begin coordinating production and fulfillment. We will keep you updated at every stage.</p>
    <p style="color:#64748b;margin:0 0 24px;font-size:13px;">Please note that production and delivery times are estimates based on current supplier information.</p>
    <div style="text-align:center;margin:32px 0;">
      ${btnHtml(`${siteUrl}/account/orders`, 'Track Your Order →', '#16a34a')}
    </div>
  `);
}

function genPaymentReceivedAdmin(q: any, orderId: string): string {
  return baseTemplate(`
    <h2 style="color:#dc2626;margin:0 0 8px;">🟢 PAYMENT RECEIVED — ACTION REQUIRED</h2>
    <p style="color:#64748b;margin:0 0 24px;">A quotation payment has been confirmed. Please submit the supplier fulfillment order.</p>
    <div style="background:#fef2f2;border:2px solid #dc2626;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-weight:700;color:#dc2626;">NEXT ACTION: Submit supplier fulfillment order</p>
    </div>
    <p><strong>${q.customer_name}</strong> (${q.customer_email})</p>
    <p>Quotation: <strong>${q.reference}</strong></p>
    <p>Order ID: <strong>${orderId.split('-')[0].toUpperCase()}</strong></p>
    <p>Amount Paid: <strong>₦${Number(q.payment_amount).toLocaleString('en-NG')}</strong></p>
    <p style="margin:24px 0;">${btnHtml(`${siteUrl}/admin/quotations/${q.id}`, 'View Quotation & Copy Supplier Order', '#dc2626')}</p>
  `);
}

function genQuoteExpiredCustomer(q: any): string {
  return baseTemplate(`
    <h2 style="color:#64748b;margin:0 0 8px;">Your Quotation Has Expired</h2>
    <p style="color:#64748b;margin:0 0 24px;">Dear ${q.customer_name}, unfortunately your quotation for <strong>${q.product_name}</strong> (${q.reference}) has expired.</p>
    <p style="color:#64748b;margin:0 0 24px;">If you are still interested, please submit a new request and we will be happy to provide an updated quotation.</p>
    <div style="text-align:center;margin:32px 0;">
      ${btnHtml(`${siteUrl}/quote`, 'Request New Quotation →')}
    </div>
  `);
}

function genQuoteExpiredAdmin(q: any): string {
  return baseTemplate(`
    <h2 style="color:#64748b;margin:0 0 8px;">⚫ Quotation Expired</h2>
    <p>Quotation <strong>${q.reference}</strong> for <strong>${q.customer_name}</strong> has expired with no response.</p>
    <p style="margin:24px 0;">${btnHtml(`${siteUrl}/admin/quotations/${q.id}`, 'View Quotation', '#64748b')}</p>
  `);
}

function genSpecIssueAdmin(q: any, issueDescription: string): string {
  return baseTemplate(`
    <h2 style="color:#dc2626;margin:0 0 8px;">⚠️ Supplier Cannot Fulfill Specification</h2>
    <p style="color:#64748b;margin:0 0 24px;">The supplier has flagged a specification issue for quotation <strong>${q.reference}</strong>.</p>
    <div style="background:#fef2f2;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-weight:700;color:#dc2626;">Issue: ${issueDescription}</p>
    </div>
    <p><strong>${q.customer_name}</strong> — ${q.product_name}</p>
    <p style="margin:24px 0;">${btnHtml(`${siteUrl}/admin/quotations/${q.id}`, 'Review & Take Action', '#dc2626')}</p>
  `);
}

function genPostPaymentExceptionAdmin(q: any, exceptionType: string, description: string): string {
  return baseTemplate(`
    <h2 style="color:#dc2626;margin:0 0 8px;">🚨 Post-Payment Exception</h2>
    <p style="color:#64748b;margin:0 0 24px;">An exception has occurred on a PAID quotation.</p>
    <div style="background:#fef2f2;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-weight:700;color:#dc2626;">Type: ${exceptionType}</p>
      <p style="margin:0;color:#dc2626;">${description}</p>
    </div>
    <p><strong>Quotation:</strong> ${q.reference}</p>
    <p><strong>Customer:</strong> ${q.customer_name} (${q.customer_email})</p>
    <p style="font-weight:700;color:#dc2626;">Fulfillment has been blocked until this exception is resolved.</p>
    <p style="margin:24px 0;">${btnHtml(`${siteUrl}/admin/quotations/${q.id}`, 'Resolve Exception', '#dc2626')}</p>
  `);
}

function genDeliveryEstimateUpdated(q: any): string {
  const productionEst = q.estimated_production_days ? `${q.estimated_production_days} days` : 'To be confirmed';
  const deliveryEst = q.estimated_delivery_days ? `${q.estimated_delivery_days} days after production` : 'To be confirmed';
  return baseTemplate(`
    <h2 style="color:${BRAND.primary};margin:0 0 8px;">Update to Your Delivery Estimate</h2>
    <p style="color:#64748b;margin:0 0 24px;">Dear ${q.customer_name}, we have an update on the estimated delivery timeline for your order (${q.reference}).</p>
    <table width="100%" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;">Estimated Production</td>
        <td style="padding:8px 0;font-weight:600;font-size:14px;text-align:right;">${productionEst}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;">Estimated Delivery</td>
        <td style="padding:8px 0;font-weight:600;font-size:14px;text-align:right;">${deliveryEst}</td>
      </tr>
    </table>
    <div style="background:#fef3c7;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
      <p style="margin:0;color:#92400e;font-size:13px;">Please note: all delivery times are estimates based on current supplier and logistics information and are not guaranteed dates.</p>
    </div>
    <p style="color:#64748b;margin:0;">If you have any questions, please <a href="${siteUrl}/contact" style="color:${BRAND.accent};">contact us</a>.</p>
  `);
}

// ─── Main send functions ──────────────────────────────────────────────────────

export async function sendQuotationReceivedEmails(quotation: any) {
  await Promise.allSettled([
    sendQuotationEmail(
      quotation.id,
      QUOTATION_EMAIL_TYPES.QUOTATION_RECEIVED_CUSTOMER,
      quotation.customer_email,
      `We Received Your ICONJ Quotation Request — ${quotation.reference}`,
      genQuotationReceivedCustomer(quotation)
    ),
    sendQuotationEmail(
      quotation.id,
      QUOTATION_EMAIL_TYPES.QUOTATION_RECEIVED_ADMIN,
      adminEmail,
      `New ICONJ Quotation Request — ${quotation.reference} — ${quotation.customer_name}`,
      genQuotationReceivedAdmin(quotation)
    ),
  ]);
}

export async function sendQuoteSentEmail(quotation: any) {
  return sendQuotationEmail(
    quotation.id,
    QUOTATION_EMAIL_TYPES.QUOTE_SENT_CUSTOMER,
    quotation.customer_email,
    `Your ICONJ Quotation Is Ready — ${quotation.reference}`,
    genQuoteSentCustomer(quotation)
  );
}

export async function sendQuoteReminder1(quotation: any) {
  return sendQuotationEmail(
    quotation.id,
    QUOTATION_EMAIL_TYPES.QUOTE_REMINDER_1,
    quotation.customer_email,
    `Your ICONJ Quotation Is Waiting — ${quotation.reference}`,
    genQuoteReminder(quotation, false)
  );
}

export async function sendQuoteReminder2(quotation: any) {
  return sendQuotationEmail(
    quotation.id,
    QUOTATION_EMAIL_TYPES.QUOTE_REMINDER_2,
    quotation.customer_email,
    `Your ICONJ Quotation Is Expiring Soon — ${quotation.reference}`,
    genQuoteReminder(quotation, true)
  );
}

export async function sendQuoteAcceptedEmails(quotation: any) {
  await Promise.allSettled([
    sendQuotationEmail(
      quotation.id,
      QUOTATION_EMAIL_TYPES.QUOTE_ACCEPTED_CUSTOMER,
      quotation.customer_email,
      `ICONJ Quotation Accepted — Complete Your Payment — ${quotation.reference}`,
      genQuoteAcceptedCustomer(quotation)
    ),
    sendQuotationEmail(
      quotation.id,
      QUOTATION_EMAIL_TYPES.QUOTE_ACCEPTED_ADMIN,
      adminEmail,
      `ICONJ Quotation Accepted — Awaiting Payment — ${quotation.reference}`,
      genQuoteAcceptedAdmin(quotation)
    ),
  ]);
}

export async function sendQuoteExpiredEmails(quotation: any) {
  await Promise.allSettled([
    sendQuotationEmail(
      quotation.id,
      QUOTATION_EMAIL_TYPES.QUOTE_EXPIRED_CUSTOMER,
      quotation.customer_email,
      `Your ICONJ Quotation Has Expired — ${quotation.reference}`,
      genQuoteExpiredCustomer(quotation)
    ),
    sendQuotationEmail(
      quotation.id,
      QUOTATION_EMAIL_TYPES.QUOTE_EXPIRED_ADMIN,
      adminEmail,
      `ICONJ Quotation Expired — ${quotation.reference}`,
      genQuoteExpiredAdmin(quotation)
    ),
  ]);
}

export async function sendPaymentReceivedEmails(quotation: any, orderId: string) {
  await Promise.allSettled([
    sendQuotationEmail(
      quotation.id,
      QUOTATION_EMAIL_TYPES.PAYMENT_RECEIVED_CUSTOMER,
      quotation.customer_email,
      `ICONJ Payment Confirmed — ${quotation.reference}`,
      genPaymentReceivedCustomer(quotation, orderId)
    ),
    sendQuotationEmail(
      quotation.id,
      QUOTATION_EMAIL_TYPES.PAYMENT_RECEIVED_ADMIN,
      adminEmail,
      `🟢 ICONJ PAYMENT RECEIVED — ACTION REQUIRED — ${quotation.reference}`,
      genPaymentReceivedAdmin(quotation, orderId)
    ),
  ]);
}

export async function sendSpecIssueAdmin(quotation: any, issueDescription: string) {
  return sendQuotationEmail(
    quotation.id,
    QUOTATION_EMAIL_TYPES.SUPPLIER_SPEC_ISSUE_ADMIN,
    adminEmail,
    `⚠️ Supplier Spec Issue — ${quotation.reference}`,
    genSpecIssueAdmin(quotation, issueDescription)
  );
}

export async function sendPostPaymentExceptionAdmin(quotation: any, exceptionType: string, description: string) {
  // Use upsert with a variant key since multiple post-payment exceptions can occur
  const emailType = `${QUOTATION_EMAIL_TYPES.POST_PAYMENT_EXCEPTION_ADMIN}_${Date.now()}`;
  return sendHtmlEmail(
    adminEmail,
    `🚨 Post-Payment Exception — ${quotation.reference} — ${exceptionType}`,
    genPostPaymentExceptionAdmin(quotation, exceptionType, description)
  );
}

export async function sendDeliveryEstimateUpdated(quotation: any) {
  return sendQuotationEmail(
    quotation.id,
    QUOTATION_EMAIL_TYPES.DELIVERY_ESTIMATE_UPDATED_CUSTOMER,
    quotation.customer_email,
    `Update to Your ICONJ Delivery Estimate — ${quotation.reference}`,
    genDeliveryEstimateUpdated(quotation)
  );
}
