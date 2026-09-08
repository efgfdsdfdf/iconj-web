"use client";

import { useEffect, useRef } from "react";
import { useCartStore } from "@/store/cartStore";
import { createClient } from "@/lib/supabase/client";

export function CartSync() {
  const supabase = createClient();
  const isSyncing = useRef(false);
  const syncTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. On mount or auth state change, fetch the cart from the backend if logged in
    const handleAuth = async (session: any) => {
      if (!session?.user) return;
      
      try {
        isSyncing.current = true;
        const res = await fetch("/api/cart/sync");
        if (res.ok) {
          const data = await res.json();
          const remoteItems = data.items || [];
          const localItems = useCartStore.getState().items;

          // Simple sync strategy: 
          // If local is empty but remote has items, pull remote
          // If local has items, push to remote (local wins)
          if (localItems.length === 0 && remoteItems.length > 0) {
            useCartStore.getState().setItems(remoteItems);
          } else if (localItems.length > 0) {
            await fetch("/api/cart/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items: localItems }),
            });
          }
        }
      } catch (err) {
        console.error("Failed to sync cart on login", err);
      } finally {
        isSyncing.current = false;
      }
    };

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuth(session);
    });

    // Listen for logins/logouts
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_IN') {
        handleAuth(session);
      }
    });

    // 2. Subscribe to local cart changes and push to backend
    const unsubscribe = useCartStore.subscribe((state, prevState) => {
      if (isSyncing.current) return; // Prevent loops
      if (JSON.stringify(state.items) === JSON.stringify(prevState.items)) return;

      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      syncTimeout.current = setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          try {
            await fetch("/api/cart/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items: state.items }),
            });
          } catch (e) {
            console.error("Background cart sync failed", e);
          }
        }
      }, 2000); // Debounce saves by 2 seconds
    });

    return () => {
      subscription.unsubscribe();
      unsubscribe();
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
    };
  }, [supabase.auth]);

  return null;
}
