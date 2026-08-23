"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Download, Loader2, Save, Store, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ImportAlibabaPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [url, setUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [isTestMode, setIsTestMode] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");

  const [parsedData, setParsedData] = useState<any>(null);
  const [defaultMarkup, setDefaultMarkup] = useState(30);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      const { data: sups } = await supabase.from("suppliers").select("id, name").order("name");
      if (sups) setSuppliers(sups);
      const { data: settings } = await supabase.from("store_settings").select("value").eq("id", "default_markup").single();
      if (settings?.value) setDefaultMarkup(parseInt(settings.value));
    }
    fetchSettings();
  }, [supabase]);

  const handleImport = async () => {
    if (!url && !rawText) {
      setImportError("Please provide an Alibaba URL or Page Text");
      return;
    }
    setIsImporting(true);
    setImportError("");
    
    try {
      const response = await fetch('/api/admin/import-rapidapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, testMode: isTestMode, rawText: !isTestMode ? rawText : "" })
      });
      const resData = await response.json();
      
      // If the API succeeded and actually extracted data (name is not just fallback "Alibaba Product")
      if (response.ok && resData.data?.name && resData.data.name !== "Alibaba Product") {
        setParsedData(resData.data);
        setFormData({
          name: resData.data.name,
          category: resData.data.category_suggestion,
          supplier_id: "",
          supplier_sku: resData.data.supplier_sku,
          base_supplier_cost: resData.data.supplier_price || 0,
          markup_percentage: defaultMarkup,
          base_selling_price: Math.round((resData.data.supplier_price || 0) * (1 + defaultMarkup / 100)),
          moq: resData.data.moq || 1,
          description: resData.data.description,
          variants: resData.data.variants || [],
          images: resData.data.images || []
        });
        setIsImporting(false);
        return;
      }

      // If we reach here, RapidAPI failed AND Vercel's fallback got blocked by Alibaba anti-bot.
      // We will now try a Client-Side Proxy Fallback using the user's local browser IP!
      console.log("Server extraction blocked. Attempting Client-Side Proxy Fallback...");
      
      try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const proxyRes = await fetch(proxyUrl);
        const proxyData = await proxyRes.json();
        const html = proxyData.contents;

        if (html) {
          // 1. Extract Title
          const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
          let name = titleMatch ? titleMatch[1].replace("- Buy  Product on Alibaba.com", "").trim() : "Alibaba Product";
          if (name.length > 200) name = name.substring(0, 200);

          // 2. Extract Images (s.alicdn.com)
          const imgRegex = /(https:\/\/s\.alicdn\.com\/@sc04\/kf\/[^"'\s\\]+\.(?:jpg|png|jpeg))/gi;
          const allImgs = Array.from(html.matchAll(imgRegex)).map((m: any) => m[1]);
          let images = [...new Set(allImgs)]
            .filter((img: any) => typeof img === 'string' && !img.includes('100x100') && !img.includes('300x300'))
            .map((img: any) => img.split('_')[0])
            .slice(0, 8);

          // 3. Extract Price
          let supplier_price = 0;
          const priceRegex = /"price":"?([0-9.]+)"?/i;
          const priceMatch = html.match(priceRegex);
          if (priceMatch) {
             supplier_price = parseFloat(priceMatch[1]) * 1500; // rough USD to NGN
          }

          if (name && name !== "Alibaba Product") {
             const fallbackData = {
               name,
               description: "Imported directly from Alibaba URL.",
               supplier_price: supplier_price || 0,
               moq: 1,
               supplier_name: "Alibaba Supplier",
               supplier_sku: "",
               images: images,
               variants: [],
               category_suggestion: "Imported",
               supplier_product_url: url
             };
             setParsedData(fallbackData);
             setFormData({
                name: fallbackData.name,
                category: fallbackData.category_suggestion,
                supplier_id: "",
                supplier_sku: fallbackData.supplier_sku,
                base_supplier_cost: fallbackData.supplier_price || 0,
                markup_percentage: defaultMarkup,
                base_selling_price: Math.round((fallbackData.supplier_price || 0) * (1 + defaultMarkup / 100)),
                moq: fallbackData.moq || 1,
                description: fallbackData.description,
                variants: [],
                images: fallbackData.images || []
             });
             setIsImporting(false);
             return;
          }
        }
      } catch (proxyError) {
        console.error("Client Proxy failed:", proxyError);
      }

      // If all fails, throw original error
      throw new Error(resData.error || "RapidAPI is down, and Alibaba blocked our proxy. Please use the Paste Page Text backup.");

    } catch (err: any) {
      setImportError(err.message || "Failed to import. Check the URL and try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleRecalculatePrice = (cost: number, markup: number) => {
    setFormData((prev: any) => ({
      ...prev, base_supplier_cost: cost, markup_percentage: markup, base_selling_price: Math.round(cost * (1 + markup / 100))
    }));
  };

  const handleSaveProduct = async (status: 'DRAFT' | 'ACTIVE') => {
    setIsSaving(true);
    try {
      let finalImageUrls = formData.images;
      if (formData.images.length > 0) {
        const imgRes = await fetch('/api/admin/import-alibaba', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: formData.images })
        });
        const imgData = await imgRes.json();
        if (imgData.success && imgData.urls) finalImageUrls = imgData.urls;
      }

      const formattedVariants = {
        supplier_product_url: url,
        variant_list: formData.variants,
        colors: formData.variants.map((v: any) => v.color).filter(Boolean),
        sizes: formData.variants.map((v: any) => v.size).filter(Boolean)
      };

      const payload = {
        name: formData.name, category: formData.category, supplier_id: formData.supplier_id || null, supplier_sku: formData.supplier_sku,
        base_supplier_cost: formData.base_supplier_cost, base_selling_price: formData.base_selling_price, moq: formData.moq,
        description: formData.description, images: finalImageUrls, variants: formattedVariants,
        stock_status: status === 'ACTIVE' ? 'IN_STOCK' : 'OUT_OF_STOCK', pricing_tiers: [], features: [],
        specifications: { "Imported From": "Alibaba", "Original URL": url }
      };

      const { createProduct } = await import("../../actions");
      const result = await createProduct(payload);
      
      if (result.success) router.push("/admin/products");
      else throw new Error(result.error);
    } catch (err: any) {
      alert("Error saving product: " + (err.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  if (!parsedData) {
    return (
      <main className="flex-1 p-4 md:p-8 min-h-[calc(100vh-130px)] max-w-4xl mx-auto">
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-2" /> Back to Products</Button>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Import from Alibaba</h1>
          <p className="text-sm text-slate-500">Automatically pull product details, variants, and images directly from Alibaba.</p>
        </div>
        <Card className="border-orange-200 shadow-md">
          <CardHeader className="bg-orange-50/50 border-b border-orange-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center"><Store className="w-5 h-5 text-orange-600" /></div>
              <div><CardTitle className="text-orange-900">Alibaba Product Importer</CardTitle><CardDescription>Powered by RapidAPI</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 items-start">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">Test Mode is {isTestMode ? "ON" : "OFF"}</h4>
                <p className="text-sm text-blue-800 mt-1">{isTestMode ? "Test Mode simulates a successful import without using any of your 30 free monthly API requests. Turn this off when you want to import a real product to your store." : "Live Mode will fetch real data from Alibaba and use 1 request from your free RapidAPI monthly limit."}</p>
                <div className="mt-3 flex items-center gap-2">
                  <input type="checkbox" checked={isTestMode} onChange={(e) => setIsTestMode(e.target.checked)} id="test-mode-toggle" className="w-5 h-5 cursor-pointer accent-blue-600" />
                  <Label htmlFor="test-mode-toggle" className="font-bold cursor-pointer">Enable Test Mode (Free Unlimited Testing)</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="url" className="text-base font-semibold">Alibaba Product URL</Label>
              <Input id="url" placeholder="https://www.alibaba.com/product-detail/..." value={url} onChange={(e) => setUrl(e.target.value)} className="font-mono text-sm" />
              <p className="text-xs text-slate-500">Paste the exact URL of the product page.</p>
            </div>
            
            {!isTestMode && (
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-end">
                  <Label htmlFor="rawText" className="text-base font-semibold">Backup Method: Paste Page Text</Label>
                  <span className="text-xs text-orange-600 font-medium">Use only if API returns 502/Error</span>
                </div>
                <Textarea 
                  id="rawText"
                  placeholder="If the API is down, go to the Alibaba page, press Ctrl+A, then Ctrl+C, and paste here..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="min-h-[100px] font-mono text-xs leading-relaxed border-orange-200"
                />
              </div>
            )}

            {importError && <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm font-medium border border-red-100">{importError}</div>}
            <Button onClick={handleImport} className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 text-lg font-bold" disabled={isImporting}>
              {isImporting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Fetching Product Data...</> : <><Download className="w-5 h-5 mr-2" /> Import Product</>}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8 min-h-[calc(100vh-130px)]">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setParsedData(null)}><ArrowLeft className="w-4 h-4" /></Button>
          <div><h1 className="text-2xl font-bold text-slate-900">Review Imported Product</h1><p className="text-sm text-slate-500">Edit details before saving to your catalog.</p></div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => handleSaveProduct('DRAFT')} disabled={isSaving}>Save as Draft</Button>
          <Button onClick={() => handleSaveProduct('ACTIVE')} className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Publish Product
          </Button>
        </div>
      </div>
      {isTestMode && (
         <div className="mb-6 bg-blue-100 border border-blue-200 text-blue-800 p-4 rounded-lg flex items-center gap-3">
           <Info className="w-5 h-5 shrink-0" /><p className="text-sm font-medium">You are viewing a Mock Product generated in Test Mode. No API requests were consumed.</p>
         </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Product Name</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="font-medium" /></div>
              <div className="space-y-2"><Label>Category</Label><Input value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={4} /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Pricing & Margins</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Supplier Cost (₦)</Label><Input type="number" value={formData.base_supplier_cost} onChange={(e) => handleRecalculatePrice(Number(e.target.value), formData.markup_percentage)} /></div>
                <div className="space-y-2"><Label>Markup (%)</Label><Input type="number" value={formData.markup_percentage} onChange={(e) => handleRecalculatePrice(formData.base_supplier_cost, Number(e.target.value))} /></div>
                <div className="space-y-2"><Label>Selling Price (₦)</Label><Input type="number" value={formData.base_selling_price} onChange={(e) => setFormData({...formData, base_selling_price: Number(e.target.value)})} className="font-bold text-green-700 bg-green-50 border-green-200" /></div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Supplier Mapping</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Link to ICONJ Supplier</Label>
                <select 
                  value={formData.supplier_id} 
                  onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                >
                  <option value="">Select supplier...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>Supplier Product ID / SKU</Label><Input value={formData.supplier_sku} onChange={(e) => setFormData({...formData, supplier_sku: e.target.value})} className="font-mono text-sm" /></div>
              <div className="p-3 bg-slate-50 rounded-md border text-sm"><p className="font-medium text-slate-700 mb-1">Extracted Supplier Info:</p><p className="text-slate-600 line-clamp-1">{parsedData.supplier_name || "None detected"}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Images</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {formData.images?.map((img: string, i: number) => (
                  <div key={i} className="relative aspect-square rounded overflow-hidden border">
                    <img src={img} alt="Product" className="object-cover w-full h-full" />
                    <button onClick={() => setFormData({...formData, images: formData.images.filter((_:any, idx:number) => idx !== i)})} className="absolute top-1 right-1 bg-white/80 hover:bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-sm">×</button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}