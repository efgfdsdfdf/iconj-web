"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";

export function CartClearer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    if (searchParams.get("clear_cart") === "true") {
      clearCart();
      try {
        localStorage.removeItem('iconj-cart');
      } catch (e) {}
      // Optionally remove the clear_cart parameter from the URL to clean it up
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams, clearCart]);

  return null;
}
