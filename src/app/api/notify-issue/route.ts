import { NextResponse } from "next/server";
import { sendAdminNotification } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const htmlContent = `
      <h2>New Issue Reported</h2>
      <p><strong>Order ID:</strong> ${data.order_id}</p>
      <p><strong>Issue Type:</strong> ${data.issue_type}</p>
      <p><strong>Description:</strong><br/>${data.description}</p>
      <p><a href="https://iconj-web-rust.vercel.app/admin/issues">Log in to Admin Dashboard to view evidence and respond.</a></p>
    `;

    const success = await sendAdminNotification(`⚠️ New Order Issue Reported: ${data.issue_type}`, htmlContent);
    
    if (!success) {
      console.log("Email notification skipped or failed.");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to process notify issue:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
