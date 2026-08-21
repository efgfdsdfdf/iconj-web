import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("Email env vars not configured. Skipping email notification.");
      return NextResponse.json({ success: true, message: "Skipped (no config)" });
    }

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
      subject: `?? New Order Issue Reported: ${data.issue_type}`,
      html: `
        <h2>New Issue Reported</h2>
        <p><strong>Order ID:</strong> ${data.order_id}</p>
        <p><strong>Issue Type:</strong> ${data.issue_type}</p>
        <p><strong>Description:</strong><br/>${data.description}</p>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/issues">Log in to Admin Dashboard to view evidence and respond.</a></p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to send email:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

