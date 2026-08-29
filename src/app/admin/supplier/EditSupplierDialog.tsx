"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function EditSupplierDialog({ supplier }: { supplier: { id: string, name: string, email: string, phone: string, currency: string } }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const currency = formData.get("currency") as string || "NGN";

    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    
    // Using Supabase client to update. Since it's admin, they have permissions (hopefully, if RLS allows or we use an API)
    // Actually, we should probably hit an API. But let's try direct update first. If it fails, we'll hit the API.
    const res = await fetch(`/api/admin/suppliers/${supplier.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name, email, phone, currency }),
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) {
      toast.success("Supplier updated");
      setOpen(false);
      router.refresh();
    } else {
      toast.error("Failed to update supplier");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="sm" variant="outline" className="hover:bg-slate-100 text-slate-600" type="button">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Supplier Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleEdit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Supplier Name</label>
            <Input name="name" required defaultValue={supplier.name} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <Input name="email" type="email" required defaultValue={supplier.email} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone Number</label>
            <Input name="phone" type="tel" defaultValue={supplier.phone} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Currency</label>
            <select name="currency" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={supplier.currency || 'NGN'}>
              <option value="NGN">NGN (₦)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
