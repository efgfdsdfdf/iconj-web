"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wrench } from "lucide-react";
import toast from "react-hot-toast";
import { recordAdjustment } from "./actions";

export function AdjustmentDialog({ supplier }: { supplier: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAdjust = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const amount = Number(formData.get("amount"));
    const type = formData.get("type") as "CREDIT" | "DEBIT";
    const description = formData.get("description") as string;

    try {
      const res = await recordAdjustment(supplier.id, amount, type, description);
      if (res?.error) throw new Error(res.error);
      toast.success("Adjustment recorded successfully!");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to record adjustment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" className="bg-white border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800" type="button">
          <Wrench className="w-4 h-4 mr-2" /> Adjust Balance
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Ledger Adjustment</DialogTitle>
          <DialogDescription>
            Supplier transactions are immutable. Use this to correct a mistake by recording an offset adjustment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAdjust} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700">Adjustment Type</label>
              <select name="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" required>
                <option value="CREDIT">CREDIT (+)</option>
                <option value="DEBIT">DEBIT (-)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">Amount ({supplier.currency})</label>
              <Input name="amount" type="number" step="0.01" required min="0.01" className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700">Reason for Adjustment</label>
            <Input name="description" required placeholder="e.g. Correcting double entry" className="mt-1" />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
              {loading ? "Processing..." : "Confirm Adjustment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}