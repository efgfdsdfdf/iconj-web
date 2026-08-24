"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, CheckCircle } from "lucide-react";

export default function SellerAddProductPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [sellerBusiness, setSellerBusiness] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    selling_price: "",
    description: "",
    stock_status: "In Stock"
  });

  // Fetch the seller's business info to enforce retail/wholesale listing limits
  useEffect(() => {
    async function loadSellerInfo() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      const { data: sellerData } = await supabase
        .from('sellers')
        .select(`
          id,
          business_id,
          businesses ( business_type )
        `)
        .eq('profile_id', user.id)
        .single();
        
      if (sellerData) {
        setSellerBusiness(sellerData);
      }
    }
    loadSellerInfo();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerBusiness) return;
    
    setLoading(true);

    // ENFORCE SECTOR LISTING BASED ON ONBOARDING BUSINESS TYPE
    const bType = sellerBusiness.businesses?.business_type;
    const isRetail = (bType === 'retail' || bType === 'manufacturer');
    const isWholesale = (bType === 'wholesale' || bType === 'manufacturer');

    try {
      const { error } = await supabase.from('products').insert({
        seller_id: sellerBusiness.id,
        name: formData.name,
        sku: formData.sku,
        base_selling_price: parseFloat(formData.selling_price),
        description: formData.description,
        stock_status: formData.stock_status,
        approval_status: 'pending', // Requires admin approval
        is_retail_enabled: isRetail,
        is_wholesale_enabled: isWholesale
      });

      if (error) throw error;
      router.push('/seller/products');
    } catch (err) {
      console.error(err);
      alert("Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  if (!sellerBusiness) {
    return <div className="p-12 text-center text-slate-500">Loading seller profile...</div>;
  }

  const bType = sellerBusiness.businesses?.business_type;
  const isRetail = (bType === 'retail' || bType === 'manufacturer');
  const isWholesale = (bType === 'wholesale' || bType === 'manufacturer');

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Add New Product</h1>
      
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-8 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <h3 className="font-bold text-blue-900">Automatic Listing Enforcement</h3>
          <p className="text-sm text-blue-800 mt-1">
            Because you registered as a <strong>{bType.toUpperCase()}</strong> business during onboarding, 
            this product will automatically be restricted to the following marketplace(s):
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="e.g. NB-ONE-01" />
              </div>
              <div className="space-y-2">
                <Label>Price (?)</Label>
                <Input type="number" required value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: e.target.value})} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="h-32" />
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
