"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { updateOrderTracking } from "./actions";
import { Loader2 } from "lucide-react";

export function UpdateTrackingForm({ order }: { order: any }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    const formData = new FormData(e.currentTarget);
    formData.append("orderId", order.id);
    
    const res = await updateOrderTracking(formData);
    
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess("Order tracking updated successfully.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded text-sm">{error}</div>}
      {success && <div className="p-3 bg-emerald-50 text-emerald-600 rounded text-sm">{success}</div>}
      
      <div className="space-y-2">
        <Label>Payment Status</Label>
        <select name="payment_status" defaultValue={order.payment_status || "PENDING"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="PENDING">Pending / Unpaid</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>Order Status</Label>
        <select name="status" defaultValue={order.order_status} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="NEW">New (Awaiting Payment)</option>
          <option value="PAYMENT_CONFIRMED">Payment Confirmed</option>
          <option value="PROCESSING">Processing Order (Supplier)</option>
          <option value="SHIPPED">Shipped / In Transit</option>
          <option value="DELIVERED">Delivered</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>Shipping Carrier</Label>
        <select name="carrier" defaultValue={order.shipping_carrier || ""} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">No Carrier</option>
          <option value="China Post">China Post</option>
          <option value="Yanwen">Yanwen</option>
          <option value="DHL">DHL</option>
          <option value="FedEx">FedEx</option>
          <option value="UPS">UPS</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>Tracking Number</Label>
        <Input name="tracking_number" defaultValue={order.tracking_number || ""} placeholder="e.g. YT2349284234" />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Update Order
      </Button>
    </form>
  );
}
