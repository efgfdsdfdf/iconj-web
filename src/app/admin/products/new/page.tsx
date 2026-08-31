"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, Plus, Trash2, UploadCloud, CheckCircle2 , ArrowRightLeft} from "lucide-react";

import Link from "next/link";

const compressImage = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1600;
        const MAX_HEIGHT = 1600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: "image/jpeg" }));
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.85);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};


export default function AddProductPage() {

    const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);

  useEffect(() => {
    // Fetch categories from admin settings
    fetch("/api/suppliers").then(r => r.json()).then(sups => setSuppliersList(sups)).catch(() => {});
    // Fetch category list from store settings
    fetch("/api/store-settings/categories").then(r => r.json()).then(cats => {
      if (Array.isArray(cats)) setCategoriesList(cats.map((c: any) => typeof c === "string" ? c : c.name));
    }).catch(() => {});
  }, []);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Specifications
  const [specifications, setSpecifications] = useState<{key: string, value: string}[]>([]);

  const addSpecification = () => setSpecifications([...specifications, { key: "", value: "" }]);
  const updateSpecification = (index: number, field: "key" | "value", val: string) => {
    const newSpecs = [...specifications];
    newSpecs[index][field] = val;
    setSpecifications(newSpecs);
  };
  const removeSpecification = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  // 1. Basic Info
  const [pricingTiers, setPricingTiers] = useState<any[]>([]);
  const [moq, setMoq] = useState<number | "">(1);
  const [formData, setFormData] = useState({
    name: "", sku: "", category: "", available_colors: "", enable_custom_measurements: true, motorization_fee: "15000", installation_fee: "5000",
    product_cost: "", shipping_cost: "", selling_price: "",
    stock_status: "In Stock", description: "",
    supplier_id: "", supplier_sku: "", supplier_product_url: "",
    brand: "", age_range: "", safety_info: "",
    is_featured: false, is_bundle: false,
    is_retail_enabled: true, is_wholesale_enabled: false
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
      // Default auto-calc for ~40% margin
      const recommendedPrice = Math.round(totalCost / 0.6);
      setFormData(prev => ({ ...prev, selling_price: recommendedPrice.toString() }));
    }
  }, [formData.product_cost, formData.shipping_cost]);

  // Image Handling
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const filesArray = Array.from(e.target.files);
        const compressedFiles = await Promise.all(filesArray.map(f => compressImage(f)));
        setImageFiles(prev => [...prev, ...compressedFiles]);
        const previews = compressedFiles.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...previews]);
      }
    };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      const filesArray: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) filesArray.push(file);
        }
      }
      
      if (filesArray.length > 0) {
        setImageFiles(prev => [...prev, ...filesArray]);
        const previews = filesArray.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...previews]);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

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
      // 1. Upload images via API route (no Server Action — avoids serialization issues)
      const uploadedUrls: string[] = [];
      for (let file of imageFiles) {
          file = await compressImage(file);
        const fd = new FormData();
        fd.append("file", file);
        
          if (file.size > 8 * 1024 * 1024) throw new Error("Image is too large even after compression. Please use a smaller image.");
          const fileExt = file.name.split(".").pop() || "jpg";
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          const { data, error } = await supabase.storage.from("product-images").upload(fileName, file);
          if (error) throw new Error("Supabase upload failed: " + error.message);
          
          const { data: publicData } = supabase.storage.from("product-images").getPublicUrl(fileName);
          uploadedUrls.push(publicData.publicUrl);
      }

      // 2. Build product payload
      const productCost = parseFloat(formData.product_cost) || 0;
      const shippingCost = parseFloat(formData.shipping_cost) || 0;
      
                  // Clean base64 images from description to prevent 413 Payload Too Large from Vercel
          let cleanDescription = formData.description || "";
          cleanDescription = cleanDescription.replace(/data:image\/[^"'\s>)]+/gi, "");
          cleanDescription = cleanDescription.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, "");
        const payload = {
        name: formData.name || "",
          sku: formData.sku || "",
        category: formData.category || "",
        base_supplier_cost: productCost + shippingCost,
        base_selling_price: parseFloat(formData.selling_price) || 0,
        moq: typeof moq === "number" && !isNaN(moq) ? moq : 1,
        pricing_tiers: pricingTiers.map(t => ({
          minQty: Number(t.minQty) || 1,
          maxQty: t.maxQty ? Number(t.maxQty) : null,
          price: Number(t.price) || 0,
        })),
        is_configurable: false,
        requires_quote: false,
        images: uploadedUrls,
        variants: { 
          supplier_product_url: formData.supplier_product_url || null,
          colors: formData.available_colors ? formData.available_colors.split(',').map(c => c.trim()).filter(Boolean) : []
        },
        description: cleanDescription,
          enable_custom_measurements: formData.enable_custom_measurements,
          motorization_fee: formData.motorization_fee,
          installation_fee: formData.installation_fee,
        supplier_id: formData.supplier_id || null,
        supplier_sku: formData.supplier_sku || null,
        brand: formData.brand || null,
        age_range: formData.age_range || null,
        safety_info: formData.safety_info || null,
        is_featured: !!formData.is_featured,
          is_bundle: !!formData.is_bundle,
        is_retail_enabled: formData.is_retail_enabled,
        is_wholesale_enabled: formData.is_wholesale_enabled,
        stock_status: formData.stock_status || "In Stock",
        features: [],
        specifications: specifications.filter(s => s.key && s.value),
      };

      // 3. Create product via API route
      const payloadStr = JSON.stringify(payload);
        if (payloadStr.length > 4 * 1024 * 1024) {
          throw new Error("Product data is too large to save (" + (payloadStr.length/1024/1024).toFixed(2) + "MB). The text you pasted contains massive hidden images. Please clear the description and try again.");
        }
        
        const res = await fetch("/api/admin/products?v=2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payloadStr,
        });

        if (!res.ok) {
          const text = await res.text();
          let errorMessage = text;
          try { errorMessage = JSON.parse(text).error || text; } catch(e) {}
          if (text.includes("Request Entity Too Large")) errorMessage = "Product data is too large for the server.";
          throw new Error("Failed to save product: " + errorMessage);
        }
        
        const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "Failed to create product");

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
          <h1 className="text-2xl font-bold text-slate-900">Add New Product</h1>
          <p className="text-slate-500">Create a new item for your catalog.</p>
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
                  <Input required placeholder="e.g. Premium Blackout Roller Blind 120x200cm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Available Colors (Optional, comma separated)</Label>
                  <Input placeholder="e.g. Red, Blue, Matte Black" value={formData.available_colors || ""} onChange={e => setFormData({...formData, available_colors: e.target.value})} />
                </div>
                <div className="space-y-2 md:col-span-2 mt-4 p-4 border rounded-lg bg-blue-50/50">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 text-blue-600 rounded border-slate-300" checked={formData.enable_custom_measurements} onChange={e => setFormData({...formData, enable_custom_measurements: e.target.checked})} />
                    <span className="font-bold text-slate-900">Enable Custom Width & Height (Customers type their own dimensions, Price calculated Per Sqm)</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Input placeholder="e.g. ICONJ" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Product ID (SKU)</Label>
                  <Input readOnly value="Will be auto-generated" className="bg-slate-50 text-slate-500 cursor-not-allowed" />
                  <p className="text-[10px] text-slate-400">Unique ID generated on save (e.g. ICONJ-BLIND-001)</p>
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
                  <RichTextEditor 
                    label="Product Description"
                    placeholder="Paste directly from supplier here (retains bold, bullets, tables...)" 
                    value={formData.description} 
                    onChange={val => setFormData({...formData, description: val})} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle>Product Specifications</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Variant / Size (optional)</Label>
                  <Input placeholder="e.g. 120x200cm, King Size" value={formData.age_range} onChange={e => setFormData({...formData, age_range: e.target.value})} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Additional Notes / Warnings</Label>
                  <Textarea placeholder="e.g. Installation included. Suitable for all wall types." className="h-20 bg-amber-50" value={formData.safety_info} onChange={e => setFormData({...formData, safety_info: e.target.value})} />
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

          <Card className="border-none shadow-sm ring-1 ring-blue-100">
            <CardHeader><CardTitle>Product Specifications (Table Format)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 space-y-2 mb-4">
                <Label className="text-blue-900 font-bold">Smart Paste</Label>
                <p className="text-xs text-blue-700">Copy table rows or lists directly from Alibaba and paste them below. We will automatically extract the keys and values into the table format!</p>
                <div 
                  contentEditable
                  data-placeholder="Paste raw specifications or HTML table here..." 
                  className="min-h-[80px] max-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 overflow-y-auto empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
                  onInput={(e) => {
                      const el = e.currentTarget;
                      const text = el.innerText;
                      if (!text || !text.trim()) return;
                      
                      const newSpecs: {key: string, value: string}[] = [];
                      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                      let pendingKey: string | null = null;
                      
                      // Line-by-line parsing prevents misalignment cascades!
                      for (const line of lines) {
                        // Ignore common Alibaba garbage buttons
                        const lower = line.toLowerCase();
                        if (lower === "chat now" || lower === "contact supplier" || lower === "send inquiry" || lower === "company profile") {
                          continue;
                        }

                        // 1. Try splitting by Tab
                        if (line.includes('\t')) {
                          const parts = line.split('\t').map(p => p.trim()).filter(Boolean);
                          for (let i = 0; i < parts.length; i += 2) {
                            if (parts[i] && parts[i+1]) {
                              newSpecs.push({ key: parts[i].replace(/:$/, ''), value: parts[i+1] });
                            } else if (parts[i] && !parts[i+1]) {
                              pendingKey = parts[i];
                            }
                          }
                          continue;
                        }
                        
                        // 2. Try splitting by Colon
                        if (line.includes(':')) {
                          const idx = line.indexOf(':');
                          const k = line.substring(0, idx).trim();
                          const v = line.substring(idx + 1).trim();
                          if (k && v) {
                            newSpecs.push({ key: k, value: v });
                            continue;
                          } else if (k && !v) {
                            pendingKey = k;
                            continue;
                          }
                        }
                        
                        // 3. Try splitting by multiple spaces
                        const spaceParts = line.split(/\s{2,}/).map(p => p.trim()).filter(Boolean);
                        if (spaceParts.length > 1) {
                          for (let i = 0; i < spaceParts.length; i += 2) {
                            if (spaceParts[i] && spaceParts[i+1]) {
                              newSpecs.push({ key: spaceParts[i].replace(/:$/, ''), value: spaceParts[i+1] });
                            } else if (spaceParts[i] && !spaceParts[i+1]) {
                              pendingKey = spaceParts[i];
                            }
                          }
                          continue;
                        }
                        
                        // 4. Vertical stacking (Fallback)
                        if (pendingKey) {
                          newSpecs.push({ key: pendingKey.replace(/:$/, ''), value: line });
                          pendingKey = null;
                        } else {
                          pendingKey = line;
                        }
                      }
                      
                      if (newSpecs.length > 0) {
                        setSpecifications(prev => {
                          const existing = prev.filter(s => s.key && s.value);
                          const uniqueNew = newSpecs.filter(ns => !existing.some(es => es.key === ns.key));
                          const merged = [...existing, ...uniqueNew, { key: "", value: "" }];
                          if (merged.length > 100) return merged.slice(0, 100);
                          return merged;
                        });
                      }
                      
                      setTimeout(() => { el.innerHTML = ''; }, 100);
                    }}
                  />
              </div>

              <p className="text-sm text-slate-500 mb-2 font-medium">Or add them manually below:</p>
              {specifications.map((spec, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input placeholder="e.g. Material" value={spec.key} onChange={e => updateSpecification(i, 'key', e.target.value)} className="w-1/3" />
                  <Input placeholder="e.g. 100% Cotton" value={spec.value} onChange={e => updateSpecification(i, 'value', e.target.value)} className="flex-1" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeSpecification(i)} className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-3 mt-4">
                <Button type="button" variant="outline" size="sm" onClick={addSpecification} className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">
                  <Plus className="w-4 h-4 mr-1" /> Add Row
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  setSpecifications(prev => {
                    const flat = prev.flatMap(s => [s.key, s.value]);
                    flat.unshift(""); // Shift right by 1
                    const newSpecs = [];
                    for (let i = 0; i < flat.length; i += 2) {
                      newSpecs.push({ key: flat[i] || "", value: flat[i+1] || "" });
                    }
                    return newSpecs;
                  });
                }} className="text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100" title="Use this if you accidentally missed highlighting the first word, causing all rows to misalign!">
                  <ArrowRightLeft className="w-4 h-4 mr-2" /> Re-align (Shift Cells)
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle>Images & Gallery</CardTitle></CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                <input type="file" multiple accept="image/*,video/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-4" />
                <p className="font-medium text-slate-700">Drag & drop or Paste lifestyle and product media (images/videos) here</p>
                <p className="text-xs text-slate-500 mt-2">Supports JPG, PNG (Max 5MB each)</p>
                <p className="text-[10px] text-slate-400 mt-1">(You can simply press Ctrl+V / Cmd+V anywhere on this page)</p>
              </div>
              
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 mt-6">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-md overflow-hidden border group">
                      {src.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) ? (
                        <video src={src} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                      ) : (
                        <img src={src} alt="Preview" className="w-full h-full object-cover" />
                      )}
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
                
                {/* LISTING TYPE SELECTION */}
                <div className="p-4 bg-slate-50 border rounded-lg space-y-4">
                  <Label className="text-base font-bold">Where should this product be listed?</Label>
                  <p className="text-sm text-slate-500 mb-2">You can list products in Retail, Wholesale, or both.</p>
                  
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="isRetail" checked={formData.is_retail_enabled !== false} onChange={e => setFormData({...formData, is_retail_enabled: e.target.checked})} className="w-5 h-5 accent-blue-600" />
                    <Label htmlFor="isRetail" className="cursor-pointer">Retail Marketplace (B2C)</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="isWholesale" checked={formData.is_wholesale_enabled === true} onChange={e => setFormData({...formData, is_wholesale_enabled: e.target.checked})} className="w-5 h-5 accent-blue-600" />
                    <Label htmlFor="isWholesale" className="cursor-pointer">Wholesale Center (B2B)</Label>
                  </div>
                </div>

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
                <Label htmlFor="featured" className="font-normal cursor-pointer">Tag as "Designer's Pick"</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <input type="checkbox" id="bundle" className="w-4 h-4 rounded text-blue-600" checked={formData.is_bundle} onChange={e => setFormData({...formData, is_bundle: e.target.checked})} />
                <Label htmlFor="bundle" className="font-normal cursor-pointer">Tag as "Premium Quality"</Label>
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
