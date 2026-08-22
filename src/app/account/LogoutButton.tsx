"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    // Clear the cart immediately on the client
    useCartStore.getState().clearCart();
    
    // Sign out from Supabase client
    await supabase.auth.signOut();
    
    // Sign out from Next.js server route
    await fetch("/auth/signout", { method: "POST" });
    
    router.push("/login");
    router.refresh();
  };

  return (
    <Button onClick={handleLogout} variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
      Log Out
    </Button>
  );
}
