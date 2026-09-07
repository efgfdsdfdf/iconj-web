import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import QuoteFormClient from "./QuoteFormClient";

export const metadata = {
  title: "Request Custom Quote | ICONJ",
  description: "Request a custom quotation for your window blinds and curtains from ICONJ.",
};

export default async function QuotePage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  let initialProfile = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email, phone")
      .eq("id", user.id)
      .single();
    
    if (profile) {
      initialProfile = {
        name: profile.name,
        email: profile.email || user.email,
        phone: profile.phone || "",
      };
    } else {
       initialProfile = {
        name: "",
        email: user.email || "",
        phone: "",
      };
    }
  }

  return <QuoteFormClient initialProfile={initialProfile} />;
}
