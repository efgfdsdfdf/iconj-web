"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { addAddress } from "./actions";
import { Loader2 } from "lucide-react";

export function AddressForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const formData = new FormData(e.currentTarget);
    const res = await addAddress(formData);
    
    if (res.error) {
      setError(res.error);
    } else {
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded text-sm">{error}</div>}
      
      <div className="space-y-2">
        <Label>Address Label (e.g. Home, Office)</Label>
        <Input name="label" required placeholder="Home" />
      </div>

      <div className="space-y-2">
        <Label>Street Address</Label>
        <Input name="street" required placeholder="123 Main St" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>State</Label>
          <select name="state" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Select State</option>
            <option value="Lagos">Lagos</option>
            <option value="Abuja">Abuja (FCT)</option>
            <option value="Rivers">Rivers</option>
            <option value="Oyo">Oyo</option>
            <option value="Kano">Kano</option>
            <option value="Enugu">Enugu</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>City / L.G.A</Label>
          <Input name="city" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Phone Number</Label>
        <Input name="phone" required placeholder="08012345678" />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input type="checkbox" name="is_default" id="is_default" className="w-4 h-4" />
        <Label htmlFor="is_default">Set as default delivery address</Label>
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Address
      </Button>
    </form>
  );
}
