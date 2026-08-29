import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Filter, SlidersHorizontal, ChevronDown, Star, CheckCircle, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product/ProductCard";
import { AutoScrollingCategories } from "@/components/AutoScrollingCategories";

export const revalidate = 0;

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const supabase = await createClient();
  const params = await searchParams;
  const q = params.q;
  const category = params.category;
  const filter = params.filter; // e.g. "wholesale"

  // Fetch dynamic categories
  const { data: dbCategories } = await supabase.from("categories").select("*").eq("is_active", true).order("name");
  const { data: settings } = await supabase.from("store_settings").select("value").eq("id", "homepage_categories").single();
  const adminCategories: { name: string, icon: string }[] = settings?.value || [];
  
  const categories = (dbCategories || []).map(cat => {
    const customMatch = adminCategories.find(ac => ac.name.toLowerCase().trim() === cat.name.toLowerCase().trim() || ac.name.toLowerCase().includes(cat.name.toLowerCase()));
    return {
      ...cat,
      icon: customMatch?.icon || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&q=80'
    };
  });

  let query = supabase
    .from("products")
    .select("*, stores(store_name, slug)")
    .eq('approval_status', 'approved')
    .eq('is_active', true)
    .limit(100);

  if (category) {
    query = query.eq('category_id', category);
  }
  if (filter === 'wholesale') {
    query = query.eq('is_wholesale_enabled', true);
  } else {
    // Default to retail view
    query = query.eq('is_retail_enabled', true);
  }
  if (q) {
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  }
  
  const { data: rawProducts } = await query;
  const products = rawProducts ? [...rawProducts].sort(() => Math.random() - 0.5) : [];

  const getProductImage = (catName: string) => {
    return "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80";
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      {/* Breadcrumb Header / Wholesale Hero */}
      {filter === 'wholesale' ? (
        <>
          <div className="bg-gradient-to-r from-blue-900 via-sky-800 to-blue-900 text-white border-b-4 border-amber-500">
            <div className="container mx-auto px-4 py-12 md:py-16 flex flex-col items-center text-center">
              <span className="bg-amber-500 text-amber-950 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4">B2B Marketplace</span>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
                {category && categories?.find(c => c.id === category) 
                  ? `${categories.find(c => c.id === category)?.name} (Wholesale)`
                  : "ICONJ Wholesale Center"}
              </h1>
              <p className="text-blue-100 max-w-2xl text-lg mb-6">
                {category && categories?.find(c => c.id === category) 
                  ? `Source premium ${categories.find(c => c.id === category)?.name.toLowerCase()} in bulk directly from manufacturers and official distributors. Enjoy massive discounts and secure payments.`
                  : "Source premium custom blinds, curtains & window treatments directly from manufacturers and official distributors. Enjoy massive bulk discounts, verified sellers, and secure escrow payments."}
              </p>
              <div className="flex gap-4 items-center text-sm font-medium text-sky-200">
                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-amber-400"/> Verified Suppliers</span>
                <span className="hidden md:flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-amber-400"/> Secure Escrow</span>
                <span className="flex items-center gap-1"><Truck className="w-4 h-4 text-amber-400"/> Bulk Shipping</span>
              </div>
            </div>
          </div>
          <div className="mb-8 border-b shadow-sm bg-white">
            <AutoScrollingCategories categories={categories} filter="wholesale" />
          </div>
        </>
      ) : (
        <>
          {/* Retail Hero */}
          <div className="relative bg-slate-900 text-white mb-0 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2000" alt="Retail Store" className="absolute inset-0 w-full h-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-transparent"></div>
            <div className="container mx-auto px-4 py-12 md:py-16 relative z-10 flex flex-col items-start">
              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 flex items-center gap-2"><Star className="w-3 h-3 fill-white" /> Retail Center</span>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
                {category && categories?.find(c => c.id === category) ? categories.find(c => c.id === category)?.name : "Premium Window Treatments"}
              </h1>
              <p className="text-slate-200 max-w-xl text-base md:text-lg mb-6">
                {category && categories?.find(c => c.id === category) 
                  ? `Explore our premium collection of ${categories.find(c => c.id === category)?.name.toLowerCase()} tailored exactly to your space.`
                  : "Transform your space with our curated collection of custom blinds, elegant curtains, and smart motorization systems."}
              </p>
              <div className="flex flex-wrap gap-4 items-center text-sm font-medium text-slate-300">
                <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-400"/> Buyer Protection</span>
                <span className="flex items-center gap-1"><Truck className="w-4 h-4 text-blue-400"/> Nationwide Delivery</span>
              </div>
            </div>
          </div>
          
          {/* Breadcrumb */}
          <div className="bg-white border-b shadow-sm mb-4 lg:mb-8">
            <div className="container mx-auto px-4 py-3 flex items-center text-xs font-medium text-slate-500">
              <Link href="/" className="hover:text-blue-600">Home</Link>
              <ChevronRight className="w-3 h-3 mx-2 shrink-0" />
              <span className="text-slate-900 truncate">{q ? `Search Results for "${q}"` : category ? categories?.find(c => c.id === category)?.name || "Category" : "All Products"}</span>
            </div>
          </div>
        </>
      )}

      <div className="container mx-auto px-0 sm:px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Desktop Sidebar Filters */}
          <div className="hidden lg:block w-64 shrink-0">
            <Card className="border-none shadow-sm sticky top-24">
              <CardContent className="p-4 space-y-6">
                <div>
                  <h3 className="font-bold text-slate-900 mb-3 pb-2 border-b">Category</h3>
                  <div className="space-y-3 text-sm text-slate-600 flex flex-col">
                    <Link href={`/shop${filter ? `?filter=${filter}` : ''}`} className={`hover:text-rose-500 transition-colors ${!category ? 'font-bold text-rose-500' : ''}`}>All Categories</Link>
                    {categories?.map((c: any) => (
                      <Link 
                        key={c.id} 
                        href={`/shop?category=${c.id}${filter ? `&filter=${filter}` : ''}`} 
                        className={`hover:text-rose-500 transition-colors ${category === c.id ? 'font-bold text-rose-500' : ''}`}
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 mb-3 pb-2 border-b">Availability</h3>
                  <div className="space-y-3 text-sm text-slate-600 flex flex-col">
                    <Link href={`/shop${category ? `?category=${category}` : ''}`} className={`hover:text-blue-600 transition-colors ${!filter ? 'font-bold text-blue-600' : ''}`}>All Products</Link>
                    <Link href={`/shop?filter=wholesale${category ? `&category=${category}` : ''}`} className={`hover:text-blue-600 transition-colors ${filter === 'wholesale' ? 'font-bold text-blue-600' : ''}`}>Wholesale Only</Link>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 mb-3 pb-2 border-b">Price (₦)</h3>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="Min" className="w-full h-8 text-sm border rounded px-2" />
                    <span className="text-slate-400">-</span>
                    <input type="number" placeholder="Max" className="w-full h-8 text-sm border rounded px-2" />
                  </div>
                  <Button size="sm" className="w-full mt-3 bg-orange-500 hover:bg-orange-600">Apply</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Product Grid */}
          <div className="flex-1">
            <Card className="border-none shadow-none sm:shadow-sm bg-transparent sm:bg-white mb-4 rounded-none sm:rounded-xl">
              <CardContent className="p-0 sm:p-4 pt-2 sm:pt-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-1 sm:gap-6">
                  {products?.map((product: any) => {
                    const p = { ...product, images: product.images || [getProductImage(product.category)] };
                    return <ProductCard key={product.id} product={p} />;
                  })}
                  
                  {(!products || products.length === 0) && (
                    <div className="col-span-full py-12 text-center text-slate-500">
                      No products found. Add some from the Admin Dashboard!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
        </div>
      </div>
    </div>
  );
}

