"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, UploadCloud, X } from "lucide-react";

export default function SellerEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const unwrappedParams = use(params);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sellerBusiness, setSellerBusiness] = useState<any>(null);
  const [originalProduct, setOriginalProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    selling_price: "",
    description: "",
    stock_status: "In Stock",
    category_id: ""
  });

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

      const { data: catData } = await supabase.from('categories').select('*').eq('is_active', true);
      if (catData) setCategories(catData);

      const { data: productData, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', unwrappedParams.id)
        .eq('seller_id', sellerData.id)
        .single();

      if (error || !productData) {
        alert("Product not found or you don't have permission.");
        return router.push('/seller/products');
      }

      setOriginalProduct(productData);
      setFormData({
        name: productData.name,
        sku: productData.sku,
        selling_price: productData.base_selling_price?.toString() || "",
        description: productData.description || "",
        stock_status: productData.stock_status || "In Stock",
        category_id: productData.category_id || ""
      });
      setImages(productData.images || []);
      setInitialLoading(false);
    }
    loadData();
  }, [supabase, router, unwrappedParams.id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/seller/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Upload failed');
      
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerBusiness || !originalProduct) return;
    if (!formData.category_id) return alert("Please select a category");
    
    setLoading(true);

    const categoryName = categories.find(c => c.id === formData.category_id)?.name || '';

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name,
          sku: formData.sku,
          base_selling_price: parseFloat(formData.selling_price),
          description: formData.description,
          stock_status: formData.stock_status,
          category_id: formData.category_id,
          category: categoryName,
          images: images,
          approval_status: originalProduct.approval_status === 'rejected' ? 'pending' : originalProduct.approval_status
        })
        .eq('id', unwrappedParams.id)
        .eq('seller_id', sellerBusiness.id);

      if (error) throw error;
      router.push('/seller/products');
    } catch (err) {
      console.error(err);
      alert("Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="p-12 text-center text-slate-500">Loading product details...</div>;
  }

  const bType = sellerBusiness?.businesses?.business_type;
  const isRetail = (bType === 'retail' || bType === 'manufacturer');
  const isWholesale = (bType === 'wholesale' || bType === 'manufacturer');

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Edit Product</h1>
      
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-8 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <h3 className="font-bold text-blue-900">Listing Enforcement</h3>
          <p className="text-sm text-blue-800 mt-1">
            This product is mapped to the following marketplace(s) based on your business type:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-blue-900 font-medium">
            {isRetail && <li>ICONJ Retail Marketplace</li>}
            {isWholesale && <li>ICONJ Wholesale Center (B2B)</li>}
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Product Title</Label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Newborn Onesie" />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <select 
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.category_id}
                onChange={e => setFormData({...formData, category_id: e.target.value})}
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="e.g. NB-ONE-01" />
              </div>
              <div className="space-y-2">
                <Label>Price (₦)</Label>
                <Input type="number" required value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: e.target.value})} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="h-32" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Product Images</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg border overflow-hidden bg-slate-50 group">
                  <img src={url} alt="Product" className="w-full h-full object-cover" />
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
                    <span className="text-sm font-medium">Add Image</span>
                  </>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
              </label>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg">
          {loading ? "Saving Changes..." : "Save Product Changes"}
        </Button>
      </form>
    </div>
  );
}
