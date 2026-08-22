"use server";

import { sendAdminNotification } from "@/lib/email";

export async function notifyAdminNewUser(name: string, email: string) {
  const htmlContent = `
    <h2>🎉 New Customer Registration</h2>
    <p>A new customer has just created an account on ICONJ!</p>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <br/>
    <p><a href="https://iconj-web-rust.vercel.app/admin/customers">View in Admin Panel</a></p>
  `;

  await sendAdminNotification(`👤 New User Registration: ${name}`, htmlContent);
}
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function registerAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://iconj-web-rust.vercel.app/welcome',
        data: {
          full_name: `${firstName} ${lastName}`
        }
      }
    });

    if (error) {
      return { error: error.message };
    }

    // Notify admin
    await notifyAdminNewUser(`${firstName} ${lastName}`, email).catch(console.error);

    if (data.session) {
      return { success: true, redirectUrl: "/welcome" };
    } else {
      return { success: true, redirectUrl: "/verify-email" };
    }
  } catch (err: any) {
    console.error("Register Error:", err);
    return { error: err.message || "An unexpected error occurred during registration." };
  }
}
