"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Edit2 } from "lucide-react";

export default function MissingDataPage() {
  const [data, setData] = useState<{ products: any[], summary: any }>({ products: [], summary: {} });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const res = await fetch('/api/admin/shipping/missing-data');
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Products Missing Shipping Data</h1>
        <Link href="/admin/shipping/bulk-update">
          <Button>Bulk Update</Button>
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {Object.entries(data.summary).map(([status, count]) => (
          <Card key={status}>
            <CardHeader className="py-3"><CardTitle className="text-sm text-slate-500">{status}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{count as number}</div></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Weight (kg)</th>
                  <th className="px-4 py-3 font-medium">Dimensions (L×W×H)</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.products.map(p => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3 text-slate-500">{p.sku || 'N/A'}</td>
                    <td className="px-4 py-3">{p.shipping_weight_kg || '-'}</td>
                    <td className="px-4 py-3">{p.shipping_length_cm ? `${p.shipping_length_cm} × ${p.shipping_width_cm} × ${p.shipping_height_cm}` : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${p.shipping_data_status === 'MISSING' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                        {p.shipping_data_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/products/${p.id}`}>
                        <Button variant="ghost" size="sm"><Edit2 className="w-4 h-4" /></Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
