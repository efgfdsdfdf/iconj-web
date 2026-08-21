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
import { createProduct, uploadProductImage } from "../../actions";

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 1. Basic Info
  const [formData, setFormData] = useState({
    name: "", sku: "", category: "Newborn Essentials",
    product_cost: "", shipping_cost: "", selling_price: "",
    stock_status: "In Stock", description: "",
    supplier_id: "", supplier_sku: "",
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
        is_configurable: false,
        requires_quote: false,
        images: uploadedUrls,
        variants: {},
        metadata: {
          description: formData.description,
          supplier_id: formData.supplier_id,
          supplier_sku: formData.supplier_sku,
          brand: formData.brand,
          age_range: formData.age_range,
          safety_info: formData.safety_info,
          is_bundle: formData.is_bundle,
          stock_status: formData.stock_status,
          margin_percentage: marginPercentage,
          features: [],
          specs: []
        }
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
                  <Label>Category</Label>
                  <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>Newborn Essentials</option>
                    <option>Baby Feeding</option>
                    <option>Baby Care & Bath</option>
                    <option>Baby Safety</option>
                    <option>Baby Clothing & Accessories</option>
                    <option>Baby Travel</option>
                    <option>Toys & Development</option>
                    <option>Maternity & Mother Care</option>
                    <option>Gifts & Bundles</option>
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
                  <Label>Supplier / Manufacturer ID</Label>
                  <Input placeholder="e.g. SUP-ALI-091" value={formData.supplier_id} onChange={e => setFormData({...formData, supplier_id: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Supplier SKU</Label>
                  <Input placeholder="e.g. BBY-SWAD-01" value={formData.supplier_sku} onChange={e => setFormData({...formData, supplier_sku: e.target.value})} />
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
