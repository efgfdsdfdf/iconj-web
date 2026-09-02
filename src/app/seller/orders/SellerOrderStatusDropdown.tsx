"use client";

import { useState } from "react";
import { updateSellerOrderStatus } from "./actions";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function SellerOrderStatusDropdown({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus);

  const statuses = [
    { value: "PROCESSING", label: "Customization Confirmed / In Fulfillment" },
    { value: "READY_FOR_PICKUP", label: "Ready for Delivery" },
    { value: "SHIPPED", label: "Shipped" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "CANCELLED", label: "Cancelled" }
  ];

  const handleUpdate = async (newStatus: string) => {
    setLoading(true);
    setStatus(newStatus);
    await updateSellerOrderStatus(orderId, newStatus);
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2 mt-4 md:mt-0">
      <span className="text-xs font-bold text-slate-500 uppercase">Update Status:</span>
      <select 
        value={status}
        onChange={(e) => handleUpdate(e.target.value)}
        disabled={loading || status === 'PENDING_PAYMENT'}
        className="text-sm bg-white border border-slate-300 rounded-md px-3 py-1.5 font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        <option value="PENDING_PAYMENT" disabled>Pending Payment</option>
        {statuses.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
    </div>
  );
}
