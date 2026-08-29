"use client";

import { useState } from "react";
import { updateStoreSettings } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Store, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function StoreSettingsForm({ initialData, sellerId }: { initialData: any, sellerId: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      await updateStoreSettings(sellerId, initialData?.id, formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="w-5 h-5 text-slate-500" />
          Store Profile
        </CardTitle>
        <CardDescription>Update your public-facing store information.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-md text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Store settings updated successfully.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="store_name">Store Name <span className="text-red-500">*</span></Label>
            <Input 
              id="store_name" 
              name="store_name" 
              defaultValue={initialData?.store_name} 
              placeholder="E.g. David's Gadget Shop"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Store Description</Label>
            <Textarea 
              id="description" 
              name="description" 
              defaultValue={initialData?.description} 
              placeholder="Tell customers what you sell and why they should buy from you."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="return_policy">Return Policy</Label>
            <Textarea 
              id="return_policy" 
              name="return_policy" 
              defaultValue={initialData?.return_policy} 
              placeholder="E.g. We accept returns within 7 days for defective items..."
              rows={3}
            />
          </div>

          {initialData?.slug && (
            <div className="p-4 bg-slate-50 rounded-lg border">
              <p className="text-sm text-slate-600 mb-1">Your public store URL:</p>
              <Link href={`/store/${initialData.slug}`} target="_blank" className="text-blue-600 font-medium text-sm hover:underline">
                iconj.com.ng/store/{initialData.slug}
              </Link>
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
