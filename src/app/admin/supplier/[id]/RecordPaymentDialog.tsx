"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpRight } from "lucide-react";
import toast from "react-hot-toast";
import { recordSupplierPayment } from "./actions";

export function RecordPaymentDialog({ supplier, currentBalance, pendingOrders }: { supplier: any, currentBalance: number, pendingOrders: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string>("");

  const selectedOrderData = pendingOrders.find(o => o.id === selectedOrder);

  const handleRecord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOrderData) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const reference = formData.get("reference") as string;
    const amount = Number(selectedOrderData.supplier_cost);

    if (amount > currentBalance) {
      toast.error("Insufficient supplier balance. Add funds first.");
      setLoading(false);
      return;
    }

    try {
      await recordSupplierPayment(supplier.id, selectedOrderData.id, amount, reference);
      toast.success("Payment recorded & deducted from balance!");
      setOpen(false);
      setSelectedOrder("");
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white">
          <ArrowUpRight className="w-4 h-4 mr-2" /> Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Supplier Payment</DialogTitle>
        </DialogHeader>
        
        {pendingOrders.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            No pending orders require payment.
          </div>
        ) : (
          <form onSubmit={handleRecord} className="space-y-4 pt-4">
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex justify-between items-center">
              <span className="text-sm font-medium text-slate-500">Available Balance:</span>
              <span className={`text-lg font-bold ${currentBalance <= 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {supplier.currency} {currentBalance.toLocaleString()}
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Select Order</label>
              <select 
                value={selectedOrder} 
                onChange={(e) => setSelectedOrder(e.target.value)}
                required
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="" disabled>Choose an order...</option>
                {pendingOrders.map(o => (
                  <option key={o.id} value={o.id}>
                    Order #{o.id.split("-")[0].toUpperCase()} - {supplier.currency} {Number(o.supplier_cost).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedOrderData && (
              <div>
                <label className="text-xs font-bold text-slate-700">Deduction Amount</label>
                <Input value={`${supplier.currency} ${Number(selectedOrderData.supplier_cost).toLocaleString()}`} disabled className="mt-1 bg-slate-100 font-bold" />
                
                {Number(selectedOrderData.supplier_cost) > currentBalance && (
                  <p className="text-xs font-bold text-red-500 mt-2">
                    Warning: Deduction exceeds available balance. Transaction will be rejected.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700">Reference / Notes (Optional)</label>
              <Input name="reference" className="mt-1" placeholder="e.g. Cleared batch 5" />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading || !selectedOrder || (selectedOrderData && Number(selectedOrderData.supplier_cost) > currentBalance)} className="bg-blue-600 hover:bg-blue-700">
                {loading ? "Processing..." : "Deduct & Mark Paid"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
