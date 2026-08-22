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
      
      const address = order.delivery_address || {};
      const orderId = order.id.split("-")[0].toUpperCase();
      
      let body = `Hello Supplier Team,\n\n`;
      body += `Please process the following new order (ID: #${orderId}).\n\n`;
      
      body += `--- ORDER ITEMS ---\n`;
      items.forEach((item, index) => {
        body += `${index + 1}. ${item.product?.name || "Unknown Product"} (SKU: ${item.product?.sku || "N/A"})\n`;
        body += `   Quantity: ${item.quantity}\n`;
        body += `\n`;
      });
      
      body += `--- SHIPPING ADDRESS ---\n`;
      body += `${address.name || "N/A"}\n`;
      body += `${address.street || "N/A"}\n`;
      body += `${address.city || "N/A"}\n`;
      body += `${address.state || "N/A"}\n`;
      body += `${address.phone || "N/A"}\n\n`;
      
      body += `Please confirm receipt of this order and provide tracking information when dispatched.\n\n`;
      body += `Thank you,\nICONJ Team`;
      
      const encodedBody = encodeURIComponent(body);
      const encodedSubject = encodeURIComponent(`New Order Request - ICONJ #${orderId}`);
      
      const supplierEmail = order.supplier?.email || "supplier@example.com";
      window.location.href = `mailto:${supplierEmail}?subject=${encodedSubject}&body=${encodedBody}`;
      
      toast.success("Order marked as sent to supplier!");
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
