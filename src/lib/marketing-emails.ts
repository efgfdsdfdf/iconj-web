import { sendEmailTo } from "./email";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://iconj.com.ng";
const LOGO_URL = `${SITE_URL}/icon.svg`; // Replace with actual logo URL if available

const baseTemplate = (title: string, content: string, preheader: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { height: 40px; }
    h1 { color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 16px; text-align: center; }
    p { color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 24px; }
    .btn { display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; text-align: center; }
    .btn-container { text-align: center; margin-top: 32px; margin-bottom: 32px; }
    .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 24px; }
    .unsubscribe { color: #64748b; text-decoration: underline; }
  </style>
</head>
<body>
  <!-- Preheader -->
  <span style="color:transparent;display:none;height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;visibility:hidden;width:0;">
    ${preheader}
  </span>
  <div style="background-color: #f8fafc; padding: 20px;">
    <div class="container">
      <div class="header">
        <h2 style="color: #0f172a; margin: 0; font-size: 28px; letter-spacing: -0.5px;">ICONJ</h2>
      </div>
      ${content}
      <div class="footer">
        <p style="margin-bottom: 8px;">© ${new Date().getFullYear()} ICONJ. All rights reserved.</p>
        <p style="margin-bottom: 0;">You are receiving this email because you opted in to marketing communications.</p>
        <p style="margin-top: 8px;"><a href="${SITE_URL}/api/marketing/unsubscribe" class="unsubscribe">Unsubscribe</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export async function sendWelcomeEmail(profile: { email: string; full_name: string }) {
  const firstName = profile.full_name?.split(' ')[0] || 'there';
  
  const content = `
    <h1>Welcome to ICONJ! 🎉</h1>
    <p>Hi ${firstName},</p>
    <p>We're thrilled to have you here. At ICONJ, we believe your windows deserve the best. Whether you are looking for custom-tailored blinds, elegant curtains, or premium window accessories, you've come to the right place.</p>
    <p>As a member of our community, you now have access to our exclusive collections, wholesale pricing tiers, and custom measurement tools to guarantee the perfect fit for your home.</p>
    <div class="btn-container">
      <a href="${SITE_URL}/shop" class="btn">Explore the Collection</a>
    </div>
    <p>If you have any questions or need help measuring your windows, our support team is always here to help.</p>
    <p>Best regards,<br>The ICONJ Team</p>
  `;

  return sendEmailTo(
    profile.email,
    "Welcome to ICONJ! Let's dress your windows.",
    baseTemplate("Welcome to ICONJ", content, "We're thrilled to have you here. Ready to find the perfect blinds?")
  );
}

export async function sendAbandonedCartEmail(profile: { email: string; full_name: string }) {
  const firstName = profile.full_name?.split(' ')[0] || 'there';
  
  const content = `
    <h1>You left something behind! 🛒</h1>
    <p>Hi ${firstName},</p>
    <p>We noticed you left some beautiful items in your shopping cart. Excellent choice, by the way!</p>
    <p>We've saved your cart so you can easily pick up right where you left off. Ready to complete your window makeover?</p>
    <div class="btn-container">
      <a href="${SITE_URL}/cart" class="btn">Return to My Cart</a>
    </div>
    <p>If you need help deciding or have questions about sizing, just hit reply to this email.</p>
    <p>Best regards,<br>The ICONJ Team</p>
  `;

  return sendEmailTo(
    profile.email,
    "Did you forget something? Your cart is waiting.",
    baseTemplate("Your Cart is Waiting", content, "We've saved the items in your cart. Come back and complete your order.")
  );
}

export async function sendBrowseAbandonedEmail(profile: { email: string; full_name: string }, productName: string) {
  const firstName = profile.full_name?.split(' ')[0] || 'there';
  
  const content = `
    <h1>Still thinking about it? 👀</h1>
    <p>Hi ${firstName},</p>
    <p>We saw you taking a look at the <strong>${productName}</strong>. It's one of our favorites!</p>
    <p>Finding the perfect window treatment can take time. If you have any questions about measurements, materials, or shipping, we'd love to help you out.</p>
    <div class="btn-container">
      <a href="${SITE_URL}/shop" class="btn">Take Another Look</a>
    </div>
    <p>Best regards,<br>The ICONJ Team</p>
  `;

  return sendEmailTo(
    profile.email,
    `Still thinking about the ${productName}?`,
    baseTemplate("Still thinking about it?", content, "We noticed you looking. Let us know if you need any help!")
  );
}

export async function sendReviewRequestEmail(profile: { email: string; full_name: string }, orderId: string) {
  const firstName = profile.full_name?.split(' ')[0] || 'there';
  const shortOrderId = orderId.split('-')[0].toUpperCase();
  
  const content = `
    <h1>How do you like your new blinds? ⭐</h1>
    <p>Hi ${firstName},</p>
    <p>We hope you are loving your recent purchase from ICONJ (Order #${shortOrderId})!</p>
    <p>As a growing business, your feedback means the world to us. It helps us improve and helps other customers make confident decisions for their homes.</p>
    <p>Would you mind taking 60 seconds to leave a review of your experience?</p>
    <div class="btn-container">
      <a href="${SITE_URL}/account/orders/${orderId}" class="btn">Leave a Review</a>
    </div>
    <p>Thank you for choosing ICONJ!</p>
    <p>Best regards,<br>The ICONJ Team</p>
  `;

  return sendEmailTo(
    profile.email,
    "How was your ICONJ experience?",
    baseTemplate("How do you like your new blinds?", content, "We'd love to hear your thoughts on your recent order.")
  );
}
