import nodemailer from "nodemailer";

export async function sendAdminNotification(subject: string, htmlContent: string) {
  if (!(process.env.SMTP_PASS || process.env.EMAIL_PASS)) {
    console.log("Email env vars not configured. Skipping email notification.");
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.resend.com",
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: process.env.SMTP_PORT === "465" || !process.env.SMTP_PORT, // true for 465
      auth: {
        user: process.env.SMTP_USER || "resend",
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"ICONJ Support" <support@iconj.com.ng>',
      to: "ezeilodavid292@gmail.com",
      subject: subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export async function sendEmailTo(toEmail: string, subject: string, htmlContent: string) {
  if (!(process.env.SMTP_PASS || process.env.EMAIL_PASS)) {
    console.log("Email env vars not configured. Skipping email to " + toEmail);
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.resend.com",
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: process.env.SMTP_PORT === "465" || !process.env.SMTP_PORT, // true for 465
      auth: {
        user: process.env.SMTP_USER || "resend",
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"ICONJ Support" <support@iconj.com.ng>',
      to: toEmail,
      subject: subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send email to " + toEmail + ":", error);
    return false;
  }
}
