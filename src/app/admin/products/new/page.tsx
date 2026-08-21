"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, Plus, Trash2, Upload, X, UploadCloud, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { createProduct, uploadProductImage } from "../../actions";

export default function AddProductPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Basic Info
  const [formData, setFormData] = useState({
    name: "", sku: "", category: "Smart Motorized Blinds",
    product_cost: "", shipping_cost: "", selling_price: "",
    stock_status: "In Stock", description: "",
    is_featured: false, requires_quote: false
  });

  // 2. Images (Files to upload)
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // 3. Dynamic Lists
  const [features, setFeatures] = useState<string[]>([""]);
  const [specs, setSpecs] = useState<{key: string, value: string}[]>([{key: "", value: ""}]);

  // Pricing Logic
  const productCost = parseFloat(formData.product_cost) || 0;
  const shippingCost = parseFloat(formData.shipping_cost) || 0;
  const totalCost = productCost + shippingCost;
  const calculatedSellingPrice = parseFloat(formData.selling_price) || 0;

  useEffect(() => {
    if (totalCost > 0) {
      const recommendedPrice = Math.round(totalCost / 0.7);
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

    try {
      // 1. Upload Images to Supabase Storage via Server Action (bypasses RLS)
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const fileData = new FormData();
        fileData.append("file", file);
        
        try {
          const result = await uploadProductImage(fileData);
          if (result.success) {
            uploadedUrls.push(result.url);
          }
        } catch (uploadError: any) {
          throw new Error("Image upload failed: " + uploadError.message);
        }
      }

      // 2. Clean up dynamic lists (remove empties)
      const cleanFeatures = features.filter(f => f.trim() !== "");
      const cleanSpecs = specs.filter(s => s.key.trim() !== "" && s.value.trim() !== "");

      // 3. Insert Product via Server Action (bypasses RLS)
      const finalCost = productCost + shippingCost;
      
      await createProduct({
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        base_supplier_cost: finalCost,
        base_selling_price: parseFloat(formData.selling_price),
        is_configurable: true,
        requires_quote: formData.requires_quote,
        stock_status: formData.stock_status,
        is_featured: formData.is_featured,
        description: formData.description,
        features: cleanFeatures,
        specifications: cleanSpecs,
        images: uploadedUrls,
        variants: {}
      });

      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to add product to database.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 p-8 bg-slate-50 min-h-screen">
      <div className="mb-8 max-w-5xl mx-auto">
        <Link href="/admin/products" className="text-sm font-medium text-blue-600 flex items-center mb-4 hover:underline">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Products
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Create Product</h1>
        <p className="text-slate-500">Add a new item to your storefront catalog.</p>
      </div>

      <form onSubmit={handleAddProduct} className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Main Details */}
        <div className="lg:col-span-2 space-y-8">
          {error && <div className="p-4 text-sm text-red-600 bg-red-50 border-l-4 border-red-500 rounded-r-md">{error}</div>}
          
          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input required placeholder="e.g. Premium Motorized Roller Blinds" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Full Description</Label>
                <Textarea required placeholder="Write a compelling description for the customer..." className="h-32" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>SKU Code</Label>
                  <Input required placeholder="e.g. QL-MRB-001" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>Smart Motorized Blinds</option>
                    <option>Blackout Blinds</option>
                    <option>Curtains & Roman Shades</option>
                    <option>Smart Curtain Systems</option>
                    <option>Honeycomb Blinds</option>
                    <option>Outdoor Shades</option>
                  </select>
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
                <p className="font-medium text-slate-700">Drag & drop images here, or click to browse</p>
                <p className="text-xs text-slate-500 mt-2">Supports JPG, PNG, WEBP (Max 5MB each)</p>
              </div>
              
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 mt-6">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-md overflow-hidden border group">
                      <img src={src} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3 h-3" />
                      </button>
                      {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-[10px] text-center py-0.5 font-bold">MAIN</span>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle>Rich Content (Features & Specs)</CardTitle></CardHeader>
            <CardContent className="space-y-8">
              {/* Features List */}
              <div className="space-y-4">
                <Label className="text-base">Key Features (Bullet Points)</Label>
                {features.map((feature, i) => (
                  <div key={i} className="flex gap-2">
                    <Input placeholder="e.g. Whisper-quiet Somfy motor" value={feature} onChange={e => {
                      const newFeatures = [...features];
                      newFeatures[i] = e.target.value;
                      setFeatures(newFeatures);
                    }} />
                    <Button type="button" variant="ghost" className="text-red-500" onClick={() => setFeatures(features.filter((_, idx) => idx !== i))}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setFeatures([...features, ""])} className="mt-2"><Plus className="w-4 h-4 mr-2" /> Add Feature</Button>
              </div>

              {/* Specifications List */}
              <div className="space-y-4 pt-6 border-t">
                <Label className="text-base">Technical Specifications</Label>
                {specs.map((spec, i) => (
                  <div key={i} className="flex gap-4">
                    <Input placeholder="e.g. Material" className="w-1/3" value={spec.key} onChange={e => {
                      const newSpecs = [...specs];
                      newSpecs[i].key = e.target.value;
                      setSpecs(newSpecs);
                    }} />
                    <Input placeholder="e.g. 100% Polyester" className="flex-1" value={spec.value} onChange={e => {
                      const newSpecs = [...specs];
                      newSpecs[i].value = e.target.value;
                      setSpecs(newSpecs);
                    }} />
                    <Button type="button" variant="ghost" className="text-red-500" onClick={() => setSpecs(specs.filter((_, idx) => idx !== i))}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setSpecs([...specs, {key: "", value: ""}])} className="mt-2"><Plus className="w-4 h-4 mr-2" /> Add Specification</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Pricing & Publish */}
        <div className="space-y-8">
          <Card className="border-none shadow-sm sticky top-24">
            <CardHeader><CardTitle>Pricing & Profit</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Original Product Cost (?)</Label>
                <Input type="number" required placeholder="0.00" value={formData.product_cost} onChange={e => setFormData({...formData, product_cost: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Shipping/Freight Cost (?)</Label>
                <Input type="number" required placeholder="0.00" value={formData.shipping_cost} onChange={e => setFormData({...formData, shipping_cost: e.target.value})} />
              </div>
              
              <div className="pt-4 border-t space-y-2">
                <Label>Customer Selling Price (?)</Label>
                <Input type="number" required className="font-bold text-lg border-emerald-500 bg-emerald-50/30" value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: e.target.value})} />
                <p className="text-xs font-medium text-emerald-600">Auto-calculated for 30% margin.</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm border">
                <div className="flex justify-between text-slate-500">
                  <span>Total Landed Cost:</span>
                  <span>₦{totalCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-600 border-t pt-2 mt-2">
                  <span>Your Profit/Sale:</span>
                  <span>₦{Math.max(0, calculatedSellingPrice - totalCost).toLocaleString()}</span>
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
                  <option>Pre-order (14-21 Days)</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="featured" className="w-4 h-4 rounded text-blue-600" checked={formData.is_featured} onChange={e => setFormData({...formData, is_featured: e.target.checked})} />
                <Label htmlFor="featured" className="font-normal cursor-pointer">Feature on Homepage</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <input type="checkbox" id="quote" className="w-4 h-4 rounded text-blue-600" checked={formData.requires_quote} onChange={e => setFormData({...formData, requires_quote: e.target.checked})} />
                <Label htmlFor="quote" className="font-normal cursor-pointer">Requires "Request a Quote"</Label>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={loading} size="lg" className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg shadow-lg">
            {loading ? "Publishing..." : "Publish Product"}
          </Button>
        </div>
      </form>
    </main>
  );
}
