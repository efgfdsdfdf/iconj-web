import nodemailer from "nodemailer";

export async function sendAdminNotification(subject: string, htmlContent: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("Email env vars not configured. Skipping email notification.");
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
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
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("Email env vars not configured. Skipping email to " + toEmail);
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: subject,
      text: htmlContent, // Fallback
      html: htmlContent.replace(/\n/g, '<br>'), // Simple newlines to HTML
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}
