"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Trash2, UploadCloud, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { createProduct, uploadProductImage, getSuppliers } from "../../actions";
import { createClient } from "@/lib/supabase/client";

export default function AddProductPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categoriesList, setCategoriesList] = useState<string[]>(["Nursery & Furniture", "Baby Feeding & Nursing", "Baby Care & Bath", "Baby Clothing & Accessories", "Baby Travel", "Toys & Development", "Maternity & Mother Care", "Gifts & Bundles"]);

  const [suppliersList, setSuppliersList] = useState<any[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data: catData } = await supabase.from("store_settings").select("value").eq("id", "homepage_categories").single();
      if (catData?.value && Array.isArray(catData.value)) {
        setCategoriesList(catData.value.map((c: any) => c.name));
      }
      
      const sups = await getSuppliers();
      setSuppliersList(sups);
    };
    fetchSettings();
  }, [supabase]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 1. Basic Info
  const [pricingTiers, setPricingTiers] = useState<any[]>([]);
  const [moq, setMoq] = useState<number | "">(1);
  const [formData, setFormData] = useState({
    name: "", sku: "", category: "Newborn Essentials",
    product_cost: "", shipping_cost: "", selling_price: "",
    stock_status: "In Stock", description: "",
    supplier_id: "", supplier_sku: "", supplier_product_url: "",
    brand: "", age_range: "", safety_info: "",
    is_featured: false, is_bundle: false
  });

  // 2. Images (Files to upload)
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Pricing Logic
  const productCost = parseFloat(formData.product_cost) || 0;
  const shippingCost = parseFloat(formData.shipping_cost) || 0;
  const totalCost = productCost + shippingCost;
  const calculatedSellingPrice = parseFloat(formData.selling_price) || 0;
  const grossProfit = Math.max(0, calculatedSellingPrice - totalCost);
  const marginPercentage = calculatedSellingPrice > 0 ? Math.round((grossProfit / calculatedSellingPrice) * 100) : 0;

  useEffect(() => {
    if (totalCost > 0 && calculatedSellingPrice === 0) {
      // Default auto-calc for ~40% margin for baby goods
      const recommendedPrice = Math.round(totalCost / 0.6);
      setFormData(prev => ({ ...prev, selling_price: recommendedPrice.toString() }));
    }
  }, [formData.product_cost, formData.shipping_cost]);

  // Image Handling
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...filesArray]);
      
      const previews = filesArray.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...previews]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Upload Images
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const fileData = new FormData();
        fileData.append("file", file);
        
        const result = await uploadProductImage(fileData);
        if (result.success && result.url) {
          uploadedUrls.push(result.url);
        } else {
          throw new Error("Image upload failed: " + (result.error || "Unknown error"));
        }
      }

      // 2. Insert Product
      const finalCost = productCost + shippingCost;
      
      const createResult = await createProduct({
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        base_supplier_cost: finalCost,
        base_selling_price: parseFloat(formData.selling_price),
        moq: moq === "" ? 1 : moq,
        pricing_tiers: pricingTiers,
        is_configurable: false,
        requires_quote: false,
        images: uploadedUrls,
        variants: {
          supplier_product_url: formData.supplier_product_url || null
        },
        description: formData.description,
        supplier_id: formData.supplier_id || null,
        supplier_sku: formData.supplier_sku || null,
        brand: formData.brand || null,
        age_range: formData.age_range || null,
        safety_info: formData.safety_info || null,
        is_bundle: formData.is_bundle,
        stock_status: formData.stock_status,
        features: [],
        specifications: []
      });

      if (!createResult.success) {
        throw new Error(createResult.error || "Failed to create product");
      }

      setSuccess(true);
      setTimeout(() => router.push("/admin/products"), 1500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon"><ChevronLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Baby Product</h1>
          <p className="text-slate-500">Create a new item in your Mother & Baby catalog.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> Product successfully added! Redirecting...
        </div>
      )}

      <form onSubmit={handleAddProduct} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Basic Info, Details, Images */}
        <div className="xl:col-span-2 space-y-8">
          
          <Card className="border-none shadow-sm ring-1 ring-blue-100 mb-8">
            <CardHeader className="bg-blue-50/50">
              <CardTitle className="text-blue-900 flex justify-between items-center">
                Wholesale Pricing Tiers
                <Button type="button" variant="outline" size="sm" onClick={() => setPricingTiers([...pricingTiers, { minQty: moq, maxQty: null, price: formData.selling_price ? parseFloat(formData.selling_price) : 0 }])}>
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
                        <Input type="number" placeholder="e.g. 5, or leave empty" value={tier.maxQty || ''} onChange={(e) => {
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
                          Margin vs Base Cost: <span className={tier.price - parseFloat(formData.product_cost || '0') > 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                            ₦{((tier.price || 0) - parseFloat(formData.product_cost || '0')).toLocaleString()}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label>Product Name</Label>
                  <Input required placeholder="e.g. Premium Newborn Swaddle Set" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Input placeholder="e.g. ICONJ Baby" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Product ID (SKU)</Label>
                  <Input readOnly value="Will be auto-generated" className="bg-slate-50 text-slate-500 cursor-not-allowed" />
                  <p className="text-[10px] text-slate-400">Unique ID generated on save (e.g. ICONJ-BABY-001)</p>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="">Select Category...</option>
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Product Description</Label>
                  <Textarea placeholder="Describe the materials, comfort, and benefits..." className="h-32" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle>Baby & Mother Specifications</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Age Range</Label>
                  <Input placeholder="e.g. 0-6 Months, Toddler" value={formData.age_range} onChange={e => setFormData({...formData, age_range: e.target.value})} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Safety Information & Warnings</Label>
                  <Textarea placeholder="e.g. BPA-Free, FDA Approved. Always supervise baby during use." className="h-20 bg-amber-50" value={formData.safety_info} onChange={e => setFormData({...formData, safety_info: e.target.value})} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle>Supplier Information (Internal)</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Primary Supplier</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                    value={formData.supplier_id} 
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
                <div className="space-y-2 md:col-span-2">
                  <Label>Supplier Product URL</Label>
                  <Input placeholder="e.g. https://alibaba.com/..." value={formData.supplier_product_url} onChange={e => setFormData({...formData, supplier_product_url: e.target.value})} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle>Images & Gallery</CardTitle></CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-4" />
                <p className="font-medium text-slate-700">Drag & drop lifestyle and product images here</p>
                <p className="text-xs text-slate-500 mt-2">Supports JPG, PNG (Max 5MB each)</p>
              </div>
              
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 mt-6">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-md overflow-hidden border group">
                      <img src={src} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN: Pricing & Publish */}
        <div className="space-y-8">
          <Card className="border-none shadow-sm sticky top-24">
            <CardHeader><CardTitle>Pricing & Profit Margin</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Original Supplier Cost (?)</Label>
                <Input type="number" required placeholder="0.00" value={formData.product_cost} onChange={e => setFormData({...formData, product_cost: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Shipping/Freight Cost (?)</Label>
                <Input type="number" required placeholder="0.00" value={formData.shipping_cost} onChange={e => setFormData({...formData, shipping_cost: e.target.value})} />
              </div>
              
              <div className="pt-4 border-t space-y-2">
                <Label>Customer Selling Price (?)</Label>
                <Input type="number" required className="font-bold text-lg border-emerald-500 bg-emerald-50/30" value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: e.target.value})} />
              </div>

              <div className="bg-slate-50 p-4 rounded-lg space-y-3 text-sm border">
                <div className="flex justify-between text-slate-500">
                  <span>Total Landed Cost:</span>
                  <span>?{totalCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-600 border-t pt-2 mt-2">
                  <span>Gross Profit per Sale:</span>
                  <span>?{grossProfit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-blue-600">
                  <span>Margin Percentage:</span>
                  <span>{marginPercentage}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle>Status & Visibility</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Stock Status</Label>
                <select value={formData.stock_status} onChange={e => setFormData({...formData, stock_status: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>In Stock</option>
                  <option>Out of Stock</option>
                  <option>Pre-order</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="featured" className="w-4 h-4 rounded text-blue-600" checked={formData.is_featured} onChange={e => setFormData({...formData, is_featured: e.target.checked})} />
                <Label htmlFor="featured" className="font-normal cursor-pointer">Mother's Pick (Featured)</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <input type="checkbox" id="bundle" className="w-4 h-4 rounded text-blue-600" checked={formData.is_bundle} onChange={e => setFormData({...formData, is_bundle: e.target.checked})} />
                <Label htmlFor="bundle" className="font-normal cursor-pointer">This is a Gift Bundle</Label>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={loading} size="lg" className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg shadow-lg">
            {loading ? "Publishing..." : "Publish Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
