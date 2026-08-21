"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, Info, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { updateProduct } from "../../../actions";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "", sku: "", category: "",
    base_supplier_cost: "", base_selling_price: "",
    description: "", stock_status: "", is_featured: false, requires_quote: false
  });

  const [variants, setVariants] = useState<{sizes: string[], motors: string[], fabrics: string[]}>({
    sizes: [], motors: [], fabrics: []
  });

  useEffect(() => {
    async function fetchProduct() {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
      if (data) {
        setFormData({
          name: data.name || "",
          sku: data.sku || "",
          category: data.category || "",
          base_supplier_cost: data.base_supplier_cost?.toString() || "",
          base_selling_price: data.base_selling_price?.toString() || "",
          description: data.description || "",
          stock_status: data.stock_status || "In Stock",
          is_featured: data.is_featured || false,
          requires_quote: data.requires_quote || false
        });
        setVariants(data.variants || { sizes: [], motors: [], fabrics: [] });
      }
      setFetching(false);
    }
    fetchProduct();
  }, [id]);

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateProduct(id, {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        base_supplier_cost: parseFloat(formData.base_supplier_cost),
        base_selling_price: parseFloat(formData.base_selling_price),
        description: formData.description,
        stock_status: formData.stock_status,
        is_featured: formData.is_featured,
        requires_quote: formData.requires_quote,
        variants: variants
      });

      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update product.");
    } finally {
      setLoading(false);
    }
  };

  const handleArrayChange = (type: "sizes" | "motors" | "fabrics", index: number, value: string) => {
    const newArr = [...variants[type]];
    newArr[index] = value;
    setVariants({ ...variants, [type]: newArr });
  };

  const addArrayItem = (type: "sizes" | "motors" | "fabrics") => {
    setVariants({ ...variants, [type]: [...(variants[type] || []), ""] });
  };

  const removeArrayItem = (type: "sizes" | "motors" | "fabrics", index: number) => {
    setVariants({ ...variants, [type]: variants[type].filter((_, i) => i !== index) });
  };

  if (fetching) return <div className="p-8">Loading product details...</div>;

  return (
    <main className="flex-1 p-8 bg-slate-50 min-h-screen">
      <div className="mb-8 max-w-5xl mx-auto">
        <Link href="/admin/products" className="text-sm font-medium text-blue-600 flex items-center mb-4 hover:underline">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Products
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Edit Product & Variants</h1>
      </div>

      <form onSubmit={handleUpdateProduct} className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>}
              <div className="space-y-2"><Label>Product Name</Label><Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div className="space-y-2"><Label>Full Description</Label><Textarea className="h-32" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>SKU Code</Label><Input required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} /></div>
                <div className="space-y-2"><Label>Category</Label><Input required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} /></div>
              </div>
            </CardContent>
          </Card>

          {/* VARIANT MANAGER */}
          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle>Variant Configurator Options</CardTitle></CardHeader>
            <CardContent className="space-y-8">
              {/* Sizes */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Available Sizes / Dimensions</Label>
                <div className="space-y-2">
                  {(variants.sizes || []).map((val, i) => (
                    <div key={i} className="flex gap-2">
                      <Input placeholder="e.g. 150cm x 200cm" value={val} onChange={e => handleArrayChange("sizes", i, e.target.value)} />
                      <Button type="button" variant="ghost" className="text-red-500" onClick={() => removeArrayItem("sizes", i)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("sizes")}><Plus className="w-4 h-4 mr-2" /> Add Size Option</Button>
                </div>
              </div>
              
              {/* Motors */}
              <div className="pt-6 border-t">
                <Label className="text-base font-semibold mb-3 block">Available Motor Types</Label>
                <div className="space-y-2">
                  {(variants.motors || []).map((val, i) => (
                    <div key={i} className="flex gap-2">
                      <Input placeholder="e.g. Smart WiFi Motor (Tuya/Alexa)" value={val} onChange={e => handleArrayChange("motors", i, e.target.value)} />
                      <Button type="button" variant="ghost" className="text-red-500" onClick={() => removeArrayItem("motors", i)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("motors")}><Plus className="w-4 h-4 mr-2" /> Add Motor Option</Button>
                </div>
              </div>

              {/* Fabrics */}
              <div className="pt-6 border-t">
                <Label className="text-base font-semibold mb-3 block">Available Fabrics</Label>
                <div className="space-y-2">
                  {(variants.fabrics || []).map((val, i) => (
                    <div key={i} className="flex gap-2">
                      <Input placeholder="e.g. 100% Blackout (Bedrooms)" value={val} onChange={e => handleArrayChange("fabrics", i, e.target.value)} />
                      <Button type="button" variant="ghost" className="text-red-500" onClick={() => removeArrayItem("fabrics", i)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("fabrics")}><Plus className="w-4 h-4 mr-2" /> Add Fabric Option</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-sm sticky top-24">
            <CardHeader><CardTitle>Pricing & Status</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Total Supplier Cost (?)</Label>
                <Input type="number" required value={formData.base_supplier_cost} onChange={e => setFormData({...formData, base_supplier_cost: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Selling Price (?)</Label>
                <Input type="number" required className="font-bold border-emerald-500" value={formData.base_selling_price} onChange={e => setFormData({...formData, base_selling_price: e.target.value})} />
              </div>

              <div className="pt-4 border-t space-y-4">
                <div className="space-y-2">
                  <Label>Stock Status</Label>
                  <select value={formData.stock_status} onChange={e => setFormData({...formData, stock_status: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>In Stock</option><option>Out of Stock</option><option>Pre-order (14-21 Days)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="featured" className="w-4 h-4 rounded text-blue-600" checked={formData.is_featured} onChange={e => setFormData({...formData, is_featured: e.target.checked})} />
                  <Label htmlFor="featured">Feature on Homepage</Label>
                </div>
              </div>
              <Button type="submit" disabled={loading} size="lg" className="w-full bg-blue-600 hover:bg-blue-700 h-14">
                {loading ? "Saving..." : "Save All Changes"}
              </Button>
            </CardContent>
          </Card>
        </div>

      </form>
    </main>
  );
}
