"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Download, Copy, Check, Trash2, Plus, GripVertical, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { parseRawText, suggestCategory } from "@/lib/alibaba-parser";
import type { ParsedVariant } from "@/lib/alibaba-parser";
import { createProduct, getSuppliers } from "../../actions";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";

type ImportStep = "input" | "review";

export default function ImportAlibabaPage() {
  const router = useRouter();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  // Step state
  const [step, setStep] = useState<ImportStep>("input");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Input state
  const [alibabaUrl, setAlibabaUrl] = useState("");
  const [rawText, setRawText] = useState("");

  // Review state (parsed product data)
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<ParsedVariant[]>([]);
  const [supplierName, setSupplierName] = useState("");
  const [supplierSku, setSupplierSku] = useState("");
  const [supplierUrl, setSupplierUrl] = useState("");
  const [supplierCost, setSupplierCost] = useState("");
  const [markupPercent, setMarkupPercent] = useState("30");
  const [moq, setMoq] = useState("1");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [stockStatus, setStockStatus] = useState("In Stock");
  const [selectedSupplier, setSelectedSupplier] = useState("");

  // Config
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [defaultMarkup, setDefaultMarkup] = useState(30);

  // Warnings for missing info
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data: catData } = await supabase
        .from("store_settings")
        .select("value")
        .eq("id", "homepage_categories")
        .single();
      if (catData?.value && Array.isArray(catData.value)) {
        setCategoriesList(catData.value.map((c: any) => c.name));
      } else {
        setCategoriesList([
          "Nursery & Furniture", "Baby Feeding & Nursing", "Baby Care & Bath",
          "Baby Clothing & Accessories", "Baby Travel", "Toys & Development",
          "Maternity & Mother Care", "Gifts & Bundles"
        ]);
      }

      // Fetch default markup from store_settings
      const { data: markupData } = await supabase
        .from("store_settings")
        .select("value")
        .eq("id", "default_markup")
        .single();
      if (markupData?.value) {
        setDefaultMarkup(Number(markupData.value) || 30);
        setMarkupPercent(String(Number(markupData.value) || 30));
      }

      const sups = await getSuppliers();
      setSuppliersList(sups);
    };
    fetchSettings();
  }, []);

  // Calculated selling price
  const costNum = parseFloat(supplierCost) || 0;
  const markupNum = parseFloat(markupPercent) || 0;
  const sellingPrice = Math.round(costNum * (1 + markupNum / 100));

  const handleImport = async () => {
    setError(null);
    setWarnings([]);

    if (!alibabaUrl.trim()) {
      setError("Please enter the Alibaba product URL.");
      return;
    }

    // Validate URL format
    if (!alibabaUrl.includes("alibaba.com") && !alibabaUrl.includes("aliexpress.com")) {
      setError("Please enter a valid Alibaba or AliExpress URL.");
      return;
    }

    setLoading(true);

    try {
      const parsed = parseRawText(rawText, alibabaUrl.trim());
      const w: string[] = [];

      // Populate fields from parsed data
      setProductName(parsed.name || "");
      setDescription(parsed.description || "");
      setImages(parsed.images || []);
      setVariants(parsed.variants || []);
      setSupplierName(parsed.supplier_name || "");
      setSupplierSku(parsed.supplier_sku || "");
      setSupplierUrl(alibabaUrl.trim());
      setSupplierCost(parsed.supplier_price ? String(parsed.supplier_price) : "");
      setMoq(String(parsed.moq || 1));
      setCategory(parsed.category_suggestion || "");

      // Generate warnings
      if (!parsed.name) w.push("Product name could not be detected. Please enter it manually.");
      if (!parsed.supplier_price) w.push("Supplier price could not be detected. Please enter it manually.");
      if (!parsed.images || parsed.images.length === 0) w.push("No product images found. You can add images manually.");
      if (!parsed.variants || parsed.variants.length === 0) w.push("No variants detected. You can add variants manually.");
      if (!parsed.supplier_name) w.push("Supplier name not found. Please enter it manually.");

      setWarnings(w);
      setStep("review");
    } catch (err: any) {
      setError("Failed to parse product data: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = () => {
    // The ID will be auto-generated on save, show placeholder
    setCopied(true);
    navigator.clipboard.writeText("ID will be generated on save");
    setTimeout(() => setCopied(false), 2000);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const addVariant = () => {
    setVariants([...variants, { name: "", color: "", size: "", supplier_sku: "" }]);
  };

  const updateVariant = (index: number, field: keyof ParsedVariant, value: string) => {
    const updated = [...variants];
    (updated[index] as any)[field] = value;
    // Auto-build name from color + size
    if (field === "color" || field === "size") {
      const parts = [updated[index].color, updated[index].size].filter(Boolean);
      updated[index].name = parts.join(" / ") || "";
    }
    setVariants(updated);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSave = async (publish: boolean) => {
    if (!productName.trim()) {
      toast.error("Product name is required.");
      return;
    }
    if (!supplierCost || costNum <= 0) {
      toast.error("Supplier cost is required.");
      return;
    }
    if (sellingPrice <= 0) {
      toast.error("Selling price must be greater than 0.");
      return;
    }

    setSaving(true);

    try {
      // Build variant_list for the variants JSONB column
      const variantList = variants.map(v => ({
        name: v.name,
        color: v.color || "",
        size: v.size || "",
        model: v.model || "",
        supplier_sku: v.supplier_sku || "",
        price: v.price || costNum,
        image: v.image || "",
      }));

      // Download images to Supabase Storage
      let storedImages: string[] = [];
      if (images.length > 0) {
        toast.loading("Downloading images to your storage...", { id: "img-download" });
        try {
          const imgRes = await fetch("/api/admin/import-alibaba", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrls: images }),
          });
          const imgData = await imgRes.json();
          if (imgData.urls) {
            storedImages = imgData.urls;
          }
        } catch (e) {
          console.warn("Image download failed, using original URLs as fallback:", e);
          storedImages = images; // fallback to original URLs
        }
        toast.dismiss("img-download");
      }

      const productData = {
        name: productName.trim(),
        category: category,
        base_supplier_cost: costNum,
        base_selling_price: sellingPrice,
        moq: parseInt(moq) || 1,
        pricing_tiers: [],
        is_configurable: false,
        requires_quote: false,
        images: storedImages,
        variants: {
          supplier_product_url: supplierUrl,
          variant_list: variantList,
        },
        description: description,
        supplier_id: selectedSupplier || null,
        supplier_sku: supplierSku || null,
        brand: brand || null,
        age_range: null,
        safety_info: null,
        is_bundle: false,
        stock_status: publish ? "In Stock" : "Out of Stock",
        features: [],
        specifications: [],
      };

      const result = await createProduct(productData);

      if (!result.success) {
        throw new Error(result.error || "Failed to create product");
      }

      toast.success(publish ? "Product published!" : "Product saved as draft (Out of Stock)!");
      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  // ============== RENDER ==============

  if (step === "input") {
    return (
      <main className="flex-1 p-4 md:p-8 bg-slate-50 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <Link href="/admin/products" className="text-sm font-medium text-blue-600 flex items-center mb-6 hover:underline">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Products
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Download className="w-8 h-8 text-orange-500" />
              Import from Alibaba
            </h1>
            <p className="text-slate-500 mt-2">
              Paste the Alibaba product URL and optionally paste the product page text to auto-extract details.
            </p>
          </div>

          <Card className="border-none shadow-md">
            <CardContent className="p-6 space-y-6">
              {/* URL Input */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Alibaba Product URL *</Label>
                <Input
                  placeholder="https://www.alibaba.com/product-detail/..."
                  value={alibabaUrl}
                  onChange={e => setAlibabaUrl(e.target.value)}
                  className="h-12 text-base"
                />
                <p className="text-xs text-slate-400">
                  Paste the exact Alibaba or AliExpress product listing URL.
                </p>
              </div>

              {/* Raw Text Input */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Product Page Text (Optional)</Label>
                <Textarea
                  placeholder="Copy and paste the product title, description, price, variants, supplier name, etc. from the Alibaba page here. The system will try to automatically extract the details."
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  className="h-48 text-sm"
                />
                <p className="text-xs text-slate-400">
                  Tip: Select all text on the Alibaba product page (Ctrl+A), copy (Ctrl+C), and paste here. The more text you provide, the more the system can auto-fill for you.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleImport}
                disabled={loading}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold text-base"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Parsing Product...</>
                ) : (
                  <><Download className="w-5 h-5 mr-2" /> Import Product</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // ============== REVIEW STEP ==============
  return (
    <main className="flex-1 p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setStep("input")} className="text-sm font-medium text-blue-600 flex items-center mb-6 hover:underline">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Import
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <h1 className="text-3xl font-bold text-slate-900">Product Imported</h1>
          </div>
          <p className="text-slate-500">Review the extracted information and edit before saving.</p>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <Card className="border-orange-200 bg-orange-50 mb-6">
            <CardContent className="p-4">
              <p className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Product imported with some information missing
              </p>
              <ul className="text-sm text-orange-700 list-disc list-inside space-y-1">
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {/* === Basic Info === */}
          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle>Product Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Product Name *</Label>
                <Input value={productName} onChange={e => setProductName(e.target.value)} className="text-lg font-medium" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Product ID (SKU)</Label>
                  <div className="flex gap-2">
                    <Input readOnly value="Auto-generated on save" className="bg-slate-50 text-slate-500 cursor-not-allowed font-mono" />
                    <Button type="button" variant="outline" size="icon" onClick={handleCopyId} title="Copy">
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-400">e.g. ICONJ-BABY-001 — generated automatically</p>
                </div>

                <div className="space-y-2">
                  <Label>Category *</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    <option value="">Select Category...</option>
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Input value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. ICONJ Baby" />
                </div>
                <div className="space-y-2">
                  <Label>Stock Status</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={stockStatus}
                    onChange={e => setStockStatus(e.target.value)}
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Out of Stock">Out of Stock (Draft)</option>
                    <option value="Pre-Order">Pre-Order</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} className="h-32" />
              </div>
            </CardContent>
          </Card>

          {/* === Supplier Info === */}
          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle>Supplier Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Linked Supplier (from your supplier list)</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedSupplier}
                    onChange={e => setSelectedSupplier(e.target.value)}
                  >
                    <option value="">— None —</option>
                    {suppliersList.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Supplier / Store Name</Label>
                  <Input value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="e.g. Guangzhou Baby Co." />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Supplier SKU / Model Number</Label>
                  <Input value={supplierSku} onChange={e => setSupplierSku(e.target.value)} placeholder="e.g. BB240-BLUE (leave empty if none)" />
                </div>
                <div className="space-y-2">
                  <Label>MOQ</Label>
                  <Input type="number" value={moq} onChange={e => setMoq(e.target.value)} min="1" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Alibaba Product URL</Label>
                <Input value={supplierUrl} onChange={e => setSupplierUrl(e.target.value)} className="text-xs font-mono" />
              </div>
            </CardContent>
          </Card>

          {/* === Pricing === */}
          <Card className="border-none shadow-sm ring-1 ring-emerald-100">
            <CardHeader className="bg-emerald-50/50">
              <CardTitle className="text-emerald-900">Pricing & Markup</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Supplier Cost (₦) *</Label>
                  <Input
                    type="number"
                    value={supplierCost}
                    onChange={e => setSupplierCost(e.target.value)}
                    placeholder="e.g. 8500"
                    className="text-lg font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Markup %</Label>
                  <Input
                    type="number"
                    value={markupPercent}
                    onChange={e => setMarkupPercent(e.target.value)}
                    min="0"
                    className="text-lg"
                  />
                  <p className="text-[10px] text-slate-400">Default: {defaultMarkup}%</p>
                </div>
                <div className="space-y-2">
                  <Label>Selling Price (₦)</Label>
                  <div className="h-10 flex items-center px-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-lg font-bold">
                    ₦{sellingPrice.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                <strong>Profit per unit:</strong> ₦{(sellingPrice - costNum).toLocaleString()} &nbsp;|&nbsp;
                <strong>Margin:</strong> {costNum > 0 ? Math.round(((sellingPrice - costNum) / sellingPrice) * 100) : 0}%
              </div>
            </CardContent>
          </Card>

          {/* === Variants === */}
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Variants</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <Plus className="w-4 h-4 mr-2" /> Add Variant
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {variants.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No variants. Click "Add Variant" or this product has no variant options.</p>
              ) : (
                <>
                  <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider px-2">
                    <div className="col-span-3">Color</div>
                    <div className="col-span-3">Size / Model</div>
                    <div className="col-span-3">Supplier SKU</div>
                    <div className="col-span-2">Display Name</div>
                    <div className="col-span-1"></div>
                  </div>
                  {variants.map((v, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-md">
                      <div className="col-span-3">
                        <Input placeholder="e.g. Blue" value={v.color || ""} onChange={e => updateVariant(i, "color", e.target.value)} />
                      </div>
                      <div className="col-span-3">
                        <Input placeholder="e.g. 240ml" value={v.size || ""} onChange={e => updateVariant(i, "size", e.target.value)} />
                      </div>
                      <div className="col-span-3">
                        <Input placeholder="Supplier SKU" value={v.supplier_sku || ""} onChange={e => updateVariant(i, "supplier_sku", e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-slate-600 font-mono">{v.name || "—"}</span>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button type="button" variant="ghost" size="icon" className="text-red-500 h-8 w-8" onClick={() => removeVariant(i)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          {/* === Images === */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Images ({images.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {images.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No images imported. You can add images after saving.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {images.map((url, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border bg-white aspect-square">
                      <img src={url} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                          PRIMARY
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* === Action Buttons === */}
          <div className="flex flex-col sm:flex-row gap-3 pb-12">
            <Button
              onClick={() => handleSave(false)}
              disabled={saving}
              variant="outline"
              className="flex-1 h-12 text-base font-bold"
            >
              {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex-1 h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
              Publish Product
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
