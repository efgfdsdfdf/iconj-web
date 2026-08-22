"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import toast from "react-hot-toast";

export function RealtimeAdminUpdates() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleUpdate = (payload: any) => {
      console.log("Supabase Realtime Update:", payload);
      
      if (payload.table === 'orders' && payload.eventType === 'INSERT') {
         toast.success(`New Order Received! #${payload.new.id.split('-')[0].toUpperCase()}`, {
            icon: '🔔',
            duration: 5000,
         });
      }

      router.refresh();
    };

    const channel = supabase
      .channel('admin-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, handleUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supplier_transactions' }, handleUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notifications' }, handleUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, handleUpdate)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
