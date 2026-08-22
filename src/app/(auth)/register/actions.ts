"use server";

import { sendAdminNotification } from "@/lib/email";

export async function notifyAdminNewUser(name: string, email: string) {
  const htmlContent = `
    <h2>🎉 New Customer Registration</h2>
    <p>A new customer has just created an account on ICONJ!</p>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <br/>
    <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/customers">View in Admin Panel</a></p>
  `;

  await sendAdminNotification(`👤 New User Registration: ${name}`, htmlContent);
}
