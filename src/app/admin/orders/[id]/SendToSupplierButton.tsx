"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Package, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { sendOrderToSupplier } from "./actions/supplier";

export function SendToSupplierButton({ order, items }: { order: any, items: any[] }) {
  const [loading, setLoading] = useState(false);

  if (order.supplier_sent) {
    return (
      <Button disabled variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 opacity-100">
        <CheckCircle2 className="w-4 h-4 mr-2" /> ✓ SENT TO SUPPLIER
      </Button>
    );
  }

  const handleSend = async () => {
    if (!confirm("Are you sure you want to send this order to the supplier? This action will mark it as SENT.")) {
      return;
    }

    setLoading(true);
    try {
      await sendOrderToSupplier(order.id);
      
      toast.success("Order marked as sent and email dispatched to supplier!");
    } catch (err: any) {
      toast.error(err.message || "Failed to mark as sent.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleSend} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
      <Package className="w-4 h-4 mr-2" /> {loading ? "Sending..." : "Send to Supplier"}
    </Button>
  );
}
