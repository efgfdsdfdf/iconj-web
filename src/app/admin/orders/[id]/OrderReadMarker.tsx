"use client";

import { useEffect } from "react";
import { markOrderAsViewed } from "./actions";

export function OrderReadMarker({ orderId, adminViewed }: { orderId: string, adminViewed: boolean }) {
  useEffect(() => {
    if (!adminViewed) {
      markOrderAsViewed(orderId).catch(console.error);
    }
  }, [orderId, adminViewed]);

  return null;
}
