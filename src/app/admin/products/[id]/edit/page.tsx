"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, use } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, Info, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { updateProduct, getSuppliers } from "../../../actions";

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoriesList, setCategoriesList] = useState<string[]>(["Nursery & Furniture", "Baby Feeding & Nursing", "Baby Care & Bath", "Baby Clothing & Accessories", "Baby Travel", "Toys & Development", "Maternity & Mother Care", "Gifts & Bundles"]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from("store_settings").select("value").eq("id", "homepage_categories").single();
      if (data?.value && Array.isArray(data.value)) {
        setCategoriesList(data.value.map((c: any) => c.name));
      }
    };
    fetchCategories();
  }, [supabase]);

  const [pricingTiers, setPricingTiers] = useState<any[]>([]);
  const [moq, setMoq] = useState<number | "">(1);
  const [formData, setFormData] = useState({
    name: "", sku: "", category: "",
    base_supplier_cost: "", base_selling_price: "",
    description: "", stock_status: "", is_featured: false, requires_quote: false,
    supplier_id: "", supplier_sku: "", supplier_product_url: ""
  });

  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [existingMetadata, setExistingMetadata] = useState<any>({});

  const [variants, setVariants] = useState<{sizes: string[], motors: string[], fabrics: string[]}>({
    sizes: [], motors: [], fabrics: []
  });

  useEffect(() => {
    async function fetchProduct() {
      const sups = await getSuppliers();
      setSuppliersList(sups);

      const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
      if (data) {
        setExistingMetadata(data.metadata || {});
        setFormData({
          name: data.name || "",
          sku: data.sku || "",
          category: data.category || "",
          base_supplier_cost: data.base_supplier_cost?.toString() || "",
          base_selling_price: data.base_selling_price?.toString() || "",
          description: data.description || "",
          stock_status: data.stock_status || "In Stock",
          is_featured: data.is_featured || false,
          requires_quote: data.requires_quote || false,
          supplier_id: data.supplier_id || "",
          supplier_sku: data.supplier_sku || "",
          supplier_product_url: data.variants?.supplier_product_url || ""
        });
        setVariants(data.variants || { sizes: [], motors: [], fabrics: [] });
        setMoq(data.moq || 1);
        setPricingTiers(data.pricing_tiers || []);
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
      const payload = {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        base_supplier_cost: parseFloat(formData.base_supplier_cost),
        base_selling_price: parseFloat(formData.base_selling_price),
        moq: moq === "" ? 1 : moq,
        pricing_tiers: pricingTiers,
        description: formData.description,
        stock_status: formData.stock_status,
        is_featured: formData.is_featured,
        requires_quote: formData.requires_quote,
        variants: {
          ...variants,
          supplier_product_url: formData.supplier_product_url || null
        },
        supplier_id: formData.supplier_id || null,
        supplier_sku: formData.supplier_sku || null
      };

      const sanitizedPayload = JSON.parse(JSON.stringify(payload, (key, value) => {
        if (typeof value === 'number' && isNaN(value)) {
          return null;
        }
        return value;
      }));

      const result = await updateProduct(id as string, sanitizedPayload);

      if (result?.error) throw new Error(result.error);

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
        
        <div className="xl:col-span-2 space-y-8">

          {/* WHOLESALE PRICING BUILDER */}
          <Card className="border-none shadow-sm ring-1 ring-blue-100 mb-8">
            <CardHeader className="bg-blue-50/50">
              <CardTitle className="text-blue-900 flex justify-between items-center">
                Wholesale Pricing Tiers
                <Button type="button" variant="outline" size="sm" onClick={() => setPricingTiers([...pricingTiers, { minQty: moq, maxQty: null, price: formData.base_selling_price ? parseFloat(formData.base_selling_price) : 0 }])}>
                  <Plus className="w-4 h-4 mr-2" /> Add Tier
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Minimum Order Quantity (MOQ)</Label>
                  <Input type="number" min="1" value={moq} onChange={e => setMoq(e.target.value === "" ? "" : parseInt(e.target.value))} />
                  <p className="text-xs text-slate-500">Customers cannot order less than this amount.</p>
                </div>
              </div>
              
              {pricingTiers.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider px-2">
                    <div className="col-span-3">Min Qty</div>
                    <div className="col-span-3">Max Qty (Leave empty for +)</div>
                    <div className="col-span-4">Unit Price (₦)</div>
                    <div className="col-span-2"></div>
                  </div>
                  {pricingTiers.map((tier, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-start bg-slate-50 p-2 rounded-md">
                      <div className="col-span-3">
                        <Input type="number" min="1" value={tier.minQty} onChange={(e) => {
                          const newTiers = [...pricingTiers];
                          newTiers[index].minQty = parseInt(e.target.value) || 1;
                          setPricingTiers(newTiers);
                        }} />
                      </div>
                      <div className="col-span-3">
                        <Input type="number" placeholder="e.g. 5, or empty" value={tier.maxQty || ''} onChange={(e) => {
                          const newTiers = [...pricingTiers];
                          newTiers[index].maxQty = e.target.value ? parseInt(e.target.value) : null;
                          setPricingTiers(newTiers);
                        }} />
                      </div>
                      <div className="col-span-4">
                        <Input type="number" value={tier.price} onChange={(e) => {
                          const newTiers = [...pricingTiers];
                          newTiers[index].price = parseFloat(e.target.value) || 0;
                          setPricingTiers(newTiers);
                        }} />
                        <div className="text-xs mt-1 text-slate-500">
                          Margin vs Base Cost: <span className={tier.price - parseFloat(formData.base_supplier_cost || '0') > 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                            ₦{((tier.price || 0) - parseFloat(formData.base_supplier_cost || '0')).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setPricingTiers(pricingTiers.filter((_, i) => i !== index))}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500 p-4 bg-slate-50 rounded-md border text-center">
                  No pricing tiers added. The product will use the Base Selling Price for all quantities.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>}
              <div className="space-y-2"><Label>Product Name</Label><Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div className="space-y-2"><Label>Full Description</Label><Textarea className="h-32" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Product ID (SKU)</Label>
                  <Input readOnly value={formData.sku} className="bg-slate-50 text-slate-700 cursor-text select-all font-mono" title="Product IDs are immutable and auto-generated." />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="">Select Category...</option>
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Supplier</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                      value={formData.supplier_id || ""} 
                      onChange={e => setFormData({...formData, supplier_id: e.target.value})}
                    >
                      <option value="">No Supplier Assigned</option>
                      {suppliersList.map(sup => (
                        <option key={sup.id} value={sup.id}>{sup.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Supplier SKU</Label>
                    <Input placeholder="e.g. BBY-SWAD-01" value={formData.supplier_sku} onChange={e => setFormData({...formData, supplier_sku: e.target.value})} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Supplier Product URL</Label>
                    <Input placeholder="e.g. https://alibaba.com/..." value={formData.supplier_product_url} onChange={e => setFormData({...formData, supplier_product_url: e.target.value})} />
                  </div>
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
