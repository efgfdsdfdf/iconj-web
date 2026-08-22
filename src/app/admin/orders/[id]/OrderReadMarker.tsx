"use client";

import { useEffect } from "react";
import { markOrderAsRead } from "./actions";

export function OrderReadMarker({ orderId, isRead }: { orderId: string, isRead: boolean }) {
  useEffect(() => {
    if (!isRead) {
      markOrderAsRead(orderId).catch(console.error);
    }
  }, [orderId, isRead]);

  return null;
}
