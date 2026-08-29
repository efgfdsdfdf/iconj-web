import { ChevronRight, Check, Star, Truck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductDetailsClient } from "./ProductDetailsClient";
import { Reviews } from "./Reviews";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductDescription } from "./ProductDescription";

export const revalidate = 0;

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user?.email === "ezeilodavid292@gmail.com";
  
  // Use admin client to bypass the known Supabase RLS infinite recursion bug on profiles
  const { createClient: createAdminClient } = require('@supabase/supabase-js');
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data: productRaw, error } = await supabaseAdmin
    .from("products")
    .select("*, stores(store_name, slug, logo_url, created_at), inventory(available_quantity), wholesale_pricing(*), product_configuration_rules(*)")
    .eq("id", id)
    .single();

  const { data: recommended } = await supabaseAdmin
    .from("products")
    .select("*, stores(store_name, slug)")
    .neq("id", id)
    .eq("is_active", true)
    .limit(5);

  let product = productRaw;
  if (product) {
    // Format wholesale pricing for the client component
    if (product.wholesale_pricing && product.wholesale_pricing.length > 0) {
      product.pricing_tiers = product.wholesale_pricing.map((tier: any) => ({
        minQty: tier.min_quantity,
        maxQty: tier.max_quantity,
        price: Number(tier.price_per_unit)
      }));
    }
    
    // Determine stock status based on inventory table if it exists
    if (product.inventory && product.inventory.length > 0) {
      const totalInventory = product.inventory.reduce((sum: number, item: any) => sum + (item.available_quantity || 0), 0);
      product.stock_status = totalInventory > 0 ? "In Stock" : "Out of Stock";
    }
  }
  
  // Protect non-approved products from public viewing
  if (product && !isAdmin) {
    if (product.approval_status !== 'approved' || !product.is_active) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
          <div className="text-center p-8 bg-white rounded-xl shadow-sm border max-w-md mx-4">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Product Unavailable</h1>
            <p className="text-slate-500 mb-6">This product is currently pending review or has been deactivated by the seller.</p>
            <Link href="/shop" className="bg-blue-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-blue-700">Return to Shop</Link>
          </div>
        </div>
      );
    }
  }

  if (error || !product) {
    console.error("Product fetch error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Product Not Found</h1>
          <Link href="/shop" className="text-blue-600 hover:underline">Return to Shop</Link>
        </div>
      </div>
    );
  }

  // Fallback image handling
  const getProductImage = (category: string) => {
    if (category?.includes("Motorized")) return "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80";
    if (category?.includes("Blackout")) return "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600&q=80";
    if (category?.includes("Track") || category?.includes("Curtain")) return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80";
    return "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80";
  };
  
  const images = product.images && product.images.length > 0 ? product.images : [getProductImage(product.category)];

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <div className="bg-white border-b shadow-sm mb-4 lg:mb-8">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center text-xs font-medium text-slate-500 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <ChevronRight className="w-3 h-3 mx-2 shrink-0" />
            <Link href="/shop" className="hover:text-blue-600">Products</Link>
            <ChevronRight className="w-3 h-3 mx-2 shrink-0" />
            <span className="text-slate-900 truncate max-w-[200px]">{product.name}</span>
          </div>
          {isAdmin && (
            <Link href={`/admin/products/${product.id}/edit`} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 flex items-center gap-1 shrink-0">
              Edit Product
            </Link>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Pass data to Client Component for interactivity */}
        <ProductDetailsClient 
          product={product} 
          images={images} 
          rules={product.product_configuration_rules?.[0]} 
        />
        
        {/* Rich Content Below The Fold */}
        <div className="mt-8 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8 min-w-0 w-full overflow-hidden">
            <ProductDescription product={product} />
          </div>

          {/* Trust Sidebar & Seller Info */}
          <div className="space-y-4 min-w-0">
            {/* Jumia-style Sold By Card */}
            <div className="bg-white rounded-lg shadow-sm border p-5">
              <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Sold By</h3>
              {product.stores ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 border overflow-hidden shrink-0">
                      {product.stores.logo_url ? (
                        <img src={product.stores.logo_url} alt={product.stores.store_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg">
                          {product.stores.store_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <Link href={`/store/${product.stores.slug}`} className="font-bold text-base text-blue-600 hover:underline">
                        {product.stores.store_name}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-100 text-emerald-700">
                          Verified Seller
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-orange-100 border overflow-hidden shrink-0 flex items-center justify-center">
                      <span className="font-bold text-orange-600">IC</span>
                    </div>
                    <div>
                      <div className="font-bold text-base text-slate-900">ICONJ Official</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-slate-100 text-slate-700">
                          Direct from Brand
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Info */}
            <div className="bg-white rounded-lg shadow-sm border p-5">
              <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Delivery & Returns</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center shrink-0"><Truck className="w-5 h-5 text-blue-600" /></div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900">Nationwide Delivery</h4>
                    <p className="text-xs text-slate-500 mt-1">Ships direct to anywhere in Nigeria. Delivery time typically 7-14 working days.</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t">
                  <div className="w-10 h-10 rounded bg-emerald-50 flex items-center justify-center shrink-0"><ShieldCheck className="w-5 h-5 text-emerald-600" /></div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900">Buyer Protection</h4>
                    <p className="text-xs text-slate-500 mt-1">Guaranteed factory quality. Protected payments via Paystack.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Reviews productId={product.id} initialReviews={product.variants?.__reviews || []} />
          </div>
        </div>

        {/* Recommended Products */}
        <div className="mt-16 mb-8 border-t pt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">You Might Also Like</h2>
            <Link href="/shop" className="text-blue-600 hover:underline text-sm font-medium">View All</Link>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory no-scrollbar">
            {recommended?.map((rec: any) => {
              const p = { ...rec, images: rec.images || [] };
              return (
                <div key={rec.id} className="w-[160px] md:w-[220px] lg:w-[240px] shrink-0 snap-start">
                  <ProductCard product={p} />
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
