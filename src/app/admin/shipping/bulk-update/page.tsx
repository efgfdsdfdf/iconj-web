"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

export default function BulkUpdatePage() {
  const [productIds, setProductIds] = useState("");
  const [formData, setFormData] = useState({
    shipping_weight_kg: '',
    shipping_length_cm: '',
    shipping_width_cm: '',
    shipping_height_cm: ''
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async () => {
    setLoading(true);
    const ids = productIds.split(/[\n,]+/).map(id => id.trim()).filter(id => id.length > 0);
    
    if (ids.length === 0) {
      alert("Please enter at least one Product ID");
      setLoading(false);
      return;
    }

    const updates = ids.map(id => {
      const update: any = { product_id: id };
      if (formData.shipping_weight_kg) update.shipping_weight_kg = parseFloat(formData.shipping_weight_kg);
      if (formData.shipping_length_cm) update.shipping_length_cm = parseFloat(formData.shipping_length_cm);
      if (formData.shipping_width_cm) update.shipping_width_cm = parseFloat(formData.shipping_width_cm);
      if (formData.shipping_height_cm) update.shipping_height_cm = parseFloat(formData.shipping_height_cm);
      return update;
    });

    const res = await fetch('/api/admin/shipping/bulk-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    });

    const result = await res.json();
    if (result.error) {
      alert(result.error);
    } else {
      alert(`Updated ${result.successCount} products successfully.`);
      router.push('/admin/shipping/missing-data');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Bulk Update Shipping Data</h1>

      <Card>
        <CardHeader><CardTitle>Apply identical data to multiple products</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Product IDs (comma or newline separated)</Label>
            <Textarea 
              rows={5} 
              placeholder="uuid1&#10;uuid2&#10;uuid3"
              value={productIds}
              onChange={e => setProductIds(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Weight (kg)</Label>
              <Input type="number" step="0.01" value={formData.shipping_weight_kg} onChange={e => setFormData({...formData, shipping_weight_kg: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Length (cm)</Label>
              <Input type="number" step="0.1" value={formData.shipping_length_cm} onChange={e => setFormData({...formData, shipping_length_cm: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Width (cm)</Label>
              <Input type="number" step="0.1" value={formData.shipping_width_cm} onChange={e => setFormData({...formData, shipping_width_cm: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Height (cm)</Label>
              <Input type="number" step="0.1" value={formData.shipping_height_cm} onChange={e => setFormData({...formData, shipping_height_cm: e.target.value})} />
            </div>
          </div>

          <Button onClick={handleUpdate} disabled={loading}>
            {loading ? 'Updating...' : 'Apply Bulk Update'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
