import { NextResponse } from "next/server";
import { sendAdminNotification } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    let subject = "New ICONJ Notification";
    let htmlContent = "<p>A new event occurred on ICONJ.</p>";

    if (type === "NEW_USER_REGISTERED") {
      subject = `New User Registration: ${data.fullName}`;
      htmlContent = `
        <h2>New User Registration</h2>
        <p>A new user has just created an account on ICONJ.</p>
        <ul>
          <li><strong>Name:</strong> ${data.fullName}</li>
          <li><strong>Email:</strong> ${data.email}</li>
          <li><strong>Intent:</strong> ${data.intent}</li>
        </ul>
        <p>Log in to your admin dashboard to view their profile.</p>
      `;
    }

    // Send the email via nodemailer
    const success = await sendAdminNotification(subject, htmlContent);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to dispatch email" }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Notify API Error:", err);
    return NextResponse.json({ error: err.message || "Failed to process notification" }, { status: 500 });
  }
}
