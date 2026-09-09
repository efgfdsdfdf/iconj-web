import nodemailer from "nodemailer";

export async function sendAdminNotification(subject: string, htmlContent: string) {
  const apiKey = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  if (!apiKey) {
    console.log("Email env vars not configured. Skipping email notification.");
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "ICONJ Support <onboarding@resend.dev>",
        to: "ezeilodavid292@gmail.com",
        subject: subject,
        html: htmlContent
      })
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API rejected email:", errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export async function sendEmailTo(toEmail: string, subject: string, htmlContent: string) {
  const apiKey = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  if (!apiKey) {
    console.log("Email env vars not configured. Skipping email to " + toEmail);
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "ICONJ Support <onboarding@resend.dev>",
        to: toEmail,
        subject: subject,
        html: htmlContent
      })
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API rejected email to " + toEmail + ":", errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send email to " + toEmail + ":", error);
    return false;
  }
}
