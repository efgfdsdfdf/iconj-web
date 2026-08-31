"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, X, Plus, Trash2 , ArrowRightLeft} from "lucide-react";

export default function SellerAddProductPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [sellerBusiness, setSellerBusiness] = useState<any>(null);
  const [businessType, setBusinessType] = useState<string>("");
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    selling_price: "",
    description: "",
    stock_status: "In Stock",
    category_id: "",
    brand: "",
    weight_kg: "",
    moq: "1",
    stock_quantity: "",
  });

  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");

  // Wholesale pricing tiers
  const [pricingTiers, setPricingTiers] = useState<{min_quantity: string, max_quantity: string, price_per_unit: string}[]>([]);

  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    async function loadSellerInfo() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      const { data: sellerData } = await supabase
        .from('sellers')
        .select(`id, business_id, businesses ( business_type, business_name )`)
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (sellerData) {
        setSellerBusiness(sellerData);
        const bType = (sellerData as any).businesses?.business_type || "";
        setBusinessType(bType);
      }
      
      const { data: catData } = await supabase.from('categories').select('*').eq('is_active', true);
      if (catData) setCategories(catData);
    }
    loadSellerInfo();
  }, [supabase, router]);

  // Auto-generate SKU when category changes
  const generateSku = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return;
    const prefix = cat.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    setFormData(prev => ({ ...prev, category_id: categoryId, sku: `${prefix}-${rand}` }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data, error } = await supabase.storage.from('product-images').upload(fileName, file);
        if (error) throw new Error("Upload failed: " + error.message);
        
        const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(fileName);
        const result = { url: publicData.publicUrl };
      
      setImages([...images, result.url]);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(error.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const addPricingTier = () => {
    setPricingTiers([...pricingTiers, { min_quantity: "", max_quantity: "", price_per_unit: "" }]);
  };

  const removePricingTier = (index: number) => {
    setPricingTiers(pricingTiers.filter((_, i) => i !== index));
  };

  const updatePricingTier = (index: number, field: string, value: string) => {
    const updated = [...pricingTiers];
    (updated[index] as any)[field] = value;
    setPricingTiers(updated);
  };

  const isWholesale = businessType === "wholesale" || businessType === "manufacturer";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerBusiness) return;
    if (!formData.category_id) return alert("Please select a category");
    if (images.length === 0) return alert("Please upload at least one product image");
    
    setLoading(true);

    const categoryName = categories.find(c => c.id === formData.category_id)?.name || '';

    try {
      const payloadStr = JSON.stringify({
          name: formData.name,
          sku: formData.sku,
          selling_price: formData.selling_price,
          description: formData.description,
          stock_status: formData.stock_status,
          category_id: formData.category_id,
          category: categoryName,
          images: images,
          brand: formData.brand,
          weight_kg: formData.weight_kg,
          features: features,
          moq: isWholesale ? formData.moq : "1",
          pricing_tiers: isWholesale ? pricingTiers : [],
          stock_quantity: formData.stock_quantity,
        });

        if (payloadStr.length > 4 * 1024 * 1024) {
          throw new Error("Product data is too large to save. Please shorten the description or remove images.");
        }
        
        const res = await fetch('/api/seller/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payloadStr,
        });
        
        if (!res.ok) {
          const text = await res.text();
          let errorMessage = text;
          try { errorMessage = JSON.parse(text).error || text; } catch(e) {}
          if (text.includes("Request Entity Too Large")) errorMessage = "Product data is too large for the server.";
          throw new Error(errorMessage);
        }
        
        const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to add product');
      
      router.push('/seller/products');
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  if (!sellerBusiness) {
    return <div className="p-12 text-center text-slate-500">Loading seller profile...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Add New Product</h1>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${isWholesale ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
          {isWholesale ? '📦 Wholesale Listing' : '🛒 Retail Listing'}
        </span>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Product Title *</Label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Premium Zebra Blinds - Custom Size" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <select 
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.category_id}
                  onChange={e => generateSku(e.target.value)}
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="e.g. ICONJ, Somfy" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Product ID (Auto-generated)</Label>
                <Input required readOnly value={formData.sku} className="bg-slate-50 text-slate-600" placeholder="Select a category first" />
                <p className="text-xs text-slate-500">Auto-generated based on category</p>
              </div>
              <div className="space-y-2">
                <Label>Stock Quantity *</Label>
                <Input type="number" required min="0" value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: e.target.value})} placeholder="e.g. 100" />
                <p className="text-xs text-slate-500">How many units do you have?</p>
              </div>
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input type="number" step="0.1" value={formData.weight_kg} onChange={e => setFormData({...formData, weight_kg: e.target.value})} placeholder="0.5" />
              </div>
              <div className="space-y-2">
                <Label>Stock Status</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.stock_status}
                  onChange={e => setFormData({...formData, stock_status: e.target.value})}
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="Pre-order">Pre-order</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="h-32" placeholder="Describe your product in detail. Include materials, dimensions, colors available, etc." />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>{isWholesale ? 'Wholesale Pricing' : 'Pricing'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isWholesale ? 'Unit Price (₦) *' : 'Selling Price (₦) *'}</Label>
                <Input type="number" required value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: e.target.value})} placeholder="0.00" />
                {isWholesale && <p className="text-xs text-slate-500">Base price per unit (before bulk discounts)</p>}
              </div>
              {isWholesale && (
                <div className="space-y-2">
                  <Label>Minimum Order Quantity (MOQ) *</Label>
                  <Input type="number" required min="1" value={formData.moq} onChange={e => setFormData({...formData, moq: e.target.value})} placeholder="10" />
                  <p className="text-xs text-slate-500">Minimum units a buyer must order</p>
                </div>
              )}
            </div>

            {/* Wholesale Pricing Tiers */}
            {isWholesale && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-bold">Bulk Pricing Tiers</Label>
                    <p className="text-xs text-slate-500 mt-1">Offer discounts for larger orders</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addPricingTier} className="text-xs">
                    <Plus className="w-3 h-3 mr-1" /> Add Tier
                  </Button>
                </div>

                {pricingTiers.length > 0 && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                      <span>Min Qty</span>
                      <span>Max Qty</span>
                      <span>Price/Unit (₦)</span>
                      <span></span>
                    </div>
                    {pricingTiers.map((tier, i) => (
                      <div key={i} className="grid grid-cols-4 gap-2 items-center">
                        <Input type="number" min="1" placeholder="10" value={tier.min_quantity} onChange={e => updatePricingTier(i, 'min_quantity', e.target.value)} />
                        <Input type="number" placeholder="50 (or empty)" value={tier.max_quantity} onChange={e => updatePricingTier(i, 'max_quantity', e.target.value)} />
                        <Input type="number" placeholder="4500" value={tier.price_per_unit} onChange={e => updatePricingTier(i, 'price_per_unit', e.target.value)} />
                        <Button type="button" variant="ghost" size="sm" onClick={() => removePricingTier(i)} className="text-red-500 hover:text-red-700 hover:bg-red-50 w-9 h-9 p-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {pricingTiers.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed rounded-lg text-slate-400 text-sm">
                    No pricing tiers yet. Click &quot;Add Tier&quot; to offer bulk discounts.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Features */}
        <Card>
          <CardHeader><CardTitle>Key Features</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">Add bullet points that highlight your product&apos;s selling points</p>
            
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span className="flex-1 text-sm text-slate-700">{feature}</span>
                <button type="button" onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            <div className="flex gap-2">
              <Input 
                value={newFeature} 
                onChange={e => setNewFeature(e.target.value)} 
                placeholder="e.g. UV-resistant fabric, 5-year warranty"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); }}}
              />
              <Button type="button" variant="outline" onClick={addFeature} disabled={!newFeature.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Product Images */}
        <Card>
          <CardHeader><CardTitle>Product Media (Images & Videos) *</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-500">Upload images or videos. The first item will be the main display image/video.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg border overflow-hidden bg-slate-50 group">
                  {url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) ? (
                      <video src={url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                    ) : (
                      <img src={url} alt="Product media" className="w-full h-full object-cover" />
                    )}
                  {i === 0 && (
                    <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">Main</span>
                  )}
                  <button type="button" onClick={() => removeImage(i)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              <label className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer">
                {uploadingImage ? (
                  <span className="text-sm font-medium">Uploading...</span>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">Add Media</span>
                  </>
                )}
                <input type="file" className="hidden" accept="image/*,video/*" onChange={handleImageUpload} disabled={uploadingImage} />
              </label>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg">
          {loading ? "Submitting..." : "Submit Product for Approval"}
        </Button>
      </form>
    </div>
  );
}
