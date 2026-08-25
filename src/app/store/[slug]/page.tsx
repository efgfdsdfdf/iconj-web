import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product/ProductCard";
import { Store, ShieldCheck, MapPin, Calendar, Star } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 0;

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch the store and seller information
  const { data: store } = await supabase
    .from("stores")
    .select(`
      *,
      sellers (
        id,
        businesses (
          business_name,
          business_type,
          state,
          city
        )
      )
    `)
    .eq("slug", slug)
    .single();

  if (!store) {
    notFound();
  }

  // Fetch the products for this store
  const { data: products } = await supabase
    .from("products")
    .select("*, stores(store_name, slug)")
    .eq("store_id", store.id)
    .eq("approval_status", "approved")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const business = (store.sellers as any)?.businesses;
  const isWholesale = business?.business_type === "wholesale" || business?.business_type === "manufacturer";

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      {/* Store Banner */}
      <div className="bg-slate-900 h-48 md:h-64 relative">
        {store.banner_url ? (
          <img src={store.banner_url} alt="Store Banner" className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-900 to-slate-900 opacity-90"></div>
        )}
        <div className="absolute inset-0 flex flex-col justify-end container mx-auto px-4 pb-6">
          <div className="flex items-end gap-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden shrink-0">
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.store_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl md:text-5xl font-bold text-slate-300 uppercase">{store.store_name.charAt(0)}</span>
              )}
            </div>
            <div className="pb-2 text-white">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-md">{store.store_name}</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className={`text-[10px] md:text-xs font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm ${isWholesale ? 'bg-amber-500 text-amber-950' : 'bg-blue-600 text-white'}`}>
                  {isWholesale ? 'Wholesale Seller' : 'Retail Seller'}
                </span>
                <span className="flex items-center gap-1 text-sm font-medium opacity-90">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified ICONJ Partner
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Store Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider border-b pb-3">About Store</h3>
              <div className="space-y-4">
                {business?.business_name && (
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Legal Business Name</span>
                    <span className="text-sm font-semibold text-slate-900">{business.business_name}</span>
                  </div>
                )}
                
                <div className="flex items-start gap-2 text-slate-600 text-sm">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{business?.city || 'Lagos'}, {business?.state || 'Lagos State'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Joined {new Date(store.created_at).getFullYear()}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <Star className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>4.8/5 Positive Feedback</span>
                </div>
              </div>

              {store.description && (
                <div className="mt-6 pt-4 border-t text-sm text-slate-600 leading-relaxed">
                  {store.description}
                </div>
              )}
            </div>
          </div>

          {/* Store Products */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border mb-6">
              <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Store className="w-5 h-5 text-slate-400" /> Store Products
              </h2>
              <span className="text-sm text-slate-500 font-medium">{products?.length || 0} items</span>
            </div>

            {products && products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">No products found</h3>
                <p className="text-slate-500 max-w-md mx-auto">This store hasn&apos;t listed any products yet or they are currently pending approval.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
