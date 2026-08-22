"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { sendOrderToSupplier } from "./actions/supplier";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SendToSupplierButton({ order, items }: { order: any, items: any[] }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(order.supplier?.email || "");

  if (order.supplier_sent) {
    return (
      <Button disabled variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 opacity-100">
        <CheckCircle2 className="w-4 h-4 mr-2" /> ✓ SENT TO SUPPLIER
      </Button>
    );
  }

  const handleSend = async () => {
    if (!email) {
      toast.error("Please enter a supplier email address.");
      return;
    }

    setLoading(true);
    try {
      await sendOrderToSupplier(order.id, email);
      toast.success("Order marked as sent and email dispatched to supplier!");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to mark as sent.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700">
        <Package className="w-4 h-4 mr-2" /> Send to Supplier
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send to Supplier</DialogTitle>
            <DialogDescription>
              Review and confirm the supplier's email address. This will dispatch the order details to them and mark the order as sent.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplier-email">Supplier Email</Label>
              <Input
                id="supplier-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="supplier@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Sending..." : "Confirm & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
