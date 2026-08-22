"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function AddSupplierDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const currency = formData.get("currency") as string || "NGN";

    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    
    // We can't insert into suppliers from client securely due to RLS, so we should hit an API or server action.
    // For expediency, we'll write an API route for this.
    const res = await fetch("/api/admin/suppliers", {
      method: "POST",
      body: JSON.stringify({ name, email, phone, currency }),
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) {
      toast.success("Supplier added");
      setOpen(false);
      router.refresh();
    } else {
      toast.error("Failed to add supplier");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white" type="button">
          <Plus className="w-4 h-4 mr-2" /> Add Supplier
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAdd} className="space-y-4 pt-4">
          <div>
            <label className="text-xs font-bold text-slate-700">Company Name</label>
            <Input name="name" required placeholder="e.g. Qingyuan Leyou" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700">Email (Optional)</label>
              <Input name="email" type="email" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">Phone (Optional)</label>
              <Input name="phone" className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700">Currency</label>
            <Input name="currency" defaultValue="NGN" className="mt-1 uppercase" maxLength={3} />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Adding..." : "Add Supplier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
