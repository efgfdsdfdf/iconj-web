"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, X, Plus, Trash2, ArrowLeft , ArrowRightLeft} from "lucide-react";
import Link from "next/link";

export default function SellerEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const unwrappedParams = use(params);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
  });

  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");
  const [pricingTiers, setPricingTiers] = useState<{min_quantity: string, max_quantity: string, price_per_unit: string}[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      const { data: sellerData } = await supabase
        .from('sellers')
        .select(`id, business_id, businesses ( business_type )`)
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (!sellerData) return router.push('/account');
      setSellerBusiness(sellerData);
      const bType = (sellerData as any).businesses?.business_type || "";
      setBusinessType(bType);

      const { data: catData } = await supabase.from('categories').select('*').eq('is_active', true);
      if (catData) setCategories(catData);

      const { data: productData } = await supabase
        .from('products')
        .select('*, wholesale_pricing(*)')
        .eq('id', unwrappedParams.id)
        .eq('seller_id', sellerData.id)
        .single();

      if (productData) {
        setFormData({
          name: productData.name || "",
          sku: productData.sku || "",
          selling_price: productData.base_selling_price?.toString() || "",
          description: productData.description || "",
          stock_status: productData.stock_status || "In Stock",
          category_id: productData.category_id || "",
          brand: productData.brand || "",
          weight_kg: productData.weight_kg?.toString() || "",
          moq: productData.moq?.toString() || "1",
        });
        setImages(productData.images || []);
        setFeatures(productData.features || []);

        if (productData.wholesale_pricing) {
          setPricingTiers(productData.wholesale_pricing.map((t: any) => ({
            min_quantity: t.min_quantity?.toString() || "",
            max_quantity: t.max_quantity?.toString() || "",
            price_per_unit: t.price_per_unit?.toString() || ""
          })));
        }
      } else {
        router.push('/seller/products');
      }
      
      setInitialLoading(false);
    }
    loadData();
  }, [supabase, router, unwrappedParams.id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploadingImage(true);
    try {
      const compressedFile = await compressImage(file);
      if (compressedFile.size > 8 * 1024 * 1024) throw new Error("Image is too large even after compression. Please use a smaller image.");
      
      const fileExt = compressedFile.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage.from('product-images').upload(fileName, compressedFile);
      if (error) throw new Error("Upload failed: " + error.message);
      
      const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(fileName);
      const result = { url: publicData.publicUrl };
      
      setImages([...images, result.url]);
    } catch (error: any) {
      alert(error.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => setImages(images.filter((_, i) => i !== index));
  const addFeature = () => { if (newFeature.trim()) { setFeatures([...features, newFeature.trim()]); setNewFeature(""); } };
  const removeFeature = (index: number) => setFeatures(features.filter((_, i) => i !== index));
  const addPricingTier = () => setPricingTiers([...pricingTiers, { min_quantity: "", max_quantity: "", price_per_unit: "" }]);
  const removePricingTier = (index: number) => setPricingTiers(pricingTiers.filter((_, i) => i !== index));
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
    if (images.length === 0) return alert("Please upload at least one image");
    
    setLoading(true);

    const categoryName = categories.find(c => c.id === formData.category_id)?.name || '';

    try {
      const res = await fetch(`/api/seller/products/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          category: categoryName,
          images: images,
          features: features,
          pricing_tiers: isWholesale ? pricingTiers : [],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update product');
      }
      
      router.push('/seller/products');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="p-12 text-center text-slate-500">Loading product...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/seller/products">
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0"><ArrowLeft className="w-5 h-5"/></Button>
        </Link>
        <div className="flex-1 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Edit Product</h1>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${isWholesale ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
            {isWholesale ? '📦 Wholesale Listing' : '🛒 Retail Listing'}
          </span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Product Title *</Label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <select 
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.category_id}
                  onChange={e => setFormData({...formData, category_id: e.target.value})}
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>SKU *</Label>
                <Input required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
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
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input type="number" step="0.1" value={formData.weight_kg} onChange={e => setFormData({...formData, weight_kg: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="h-32" />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader><CardTitle>{isWholesale ? 'Wholesale Pricing' : 'Pricing'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isWholesale ? 'Unit Price (₦) *' : 'Selling Price (₦) *'}</Label>
                <Input type="number" required value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: e.target.value})} />
              </div>
              {isWholesale && (
                <div className="space-y-2">
                  <Label>Minimum Order Quantity (MOQ) *</Label>
                  <Input type="number" required min="1" value={formData.moq} onChange={e => setFormData({...formData, moq: e.target.value})} />
                </div>
              )}
            </div>

            {/* Wholesale Pricing Tiers */}
            {isWholesale && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-bold">Bulk Pricing Tiers</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addPricingTier} className="text-xs">
                    <Plus className="w-3 h-3 mr-1" /> Add Tier
                  </Button>
                </div>

                {pricingTiers.length > 0 && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                      <span>Min Qty</span><span>Max Qty</span><span>Price/Unit (₦)</span><span></span>
                    </div>
                    {pricingTiers.map((tier, i) => (
                      <div key={i} className="grid grid-cols-4 gap-2 items-center">
                        <Input type="number" min="1" value={tier.min_quantity} onChange={e => updatePricingTier(i, 'min_quantity', e.target.value)} />
                        <Input type="number" value={tier.max_quantity} onChange={e => updatePricingTier(i, 'max_quantity', e.target.value)} />
                        <Input type="number" value={tier.price_per_unit} onChange={e => updatePricingTier(i, 'price_per_unit', e.target.value)} />
                        <Button type="button" variant="ghost" size="sm" onClick={() => removePricingTier(i)} className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
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
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span className="flex-1 text-sm text-slate-700">{feature}</span>
                <button type="button" onClick={() => removeFeature(i)} className="text-red-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input 
                value={newFeature} 
                onChange={e => setNewFeature(e.target.value)} 
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); }}}
              />
              <Button type="button" variant="outline" onClick={addFeature} disabled={!newFeature.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader><CardTitle>Product Media (Images & Videos) *</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg border overflow-hidden bg-slate-50 group">
                  {url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) ? (
                      <video src={url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                    ) : (
                      <img src={url} alt="Product media" className="w-full h-full object-cover" />
                    )}
                  <button type="button" onClick={() => removeImage(i)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <label className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 cursor-pointer">
                {uploadingImage ? <span className="text-sm">Uploading...</span> : <><UploadCloud className="w-8 h-8 mb-2" /><span className="text-sm">Add Image</span></>}
                <input type="file" className="hidden" accept="image/*,video/*" onChange={handleImageUpload} disabled={uploadingImage} />
              </label>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg">
          {loading ? "Saving Changes..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
