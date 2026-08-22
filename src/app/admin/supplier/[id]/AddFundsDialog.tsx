"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { addSupplierFunds } from "./actions";

export function AddFundsDialog({ supplier }: { supplier: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const amount = Number(formData.get("amount"));
    const reference = formData.get("reference") as string;
    const description = formData.get("description") as string;

    try {
      await addSupplierFunds(supplier.id, amount, reference, description);
      toast.success("Funds added successfully!");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to add funds.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800">
          <Plus className="w-4 h-4 mr-2" /> Add Funds
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Funds to Supplier Balance</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAdd} className="space-y-4 pt-4">
          <div>
            <label className="text-xs font-bold text-slate-700">Amount ({supplier.currency})</label>
            <Input name="amount" type="number" step="0.01" required min="1" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700">Reference (Transfer ID / Bank Ref)</label>
            <Input name="reference" required className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700">Description (Optional)</label>
            <Input name="description" placeholder="e.g. Weekly Top Up" className="mt-1" />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
              {loading ? "Processing..." : "Confirm Deposit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
