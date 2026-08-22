"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function markOrderAsViewed(orderId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { get(name) { return cookieStore.get(name)?.value; } }
    }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== "ezeilodavid292@gmail.com") return;

  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get() { return undefined; } } }
  );

  // We add order_events tracking here for "Admin Viewed" if we want, but it might clutter.
  // Actually, let's just update the flag.
  await supabaseAdmin.from("orders").update({
    admin_viewed: true,
    admin_viewed_at: new Date().toISOString(),
    admin_viewed_by: user.id
  }).eq("id", orderId);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
}
