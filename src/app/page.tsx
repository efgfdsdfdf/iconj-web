import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, ShieldCheck, Star, ChevronRight, ChevronLeft, Gift, Blinds, Sun, Shield, Menu } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product/ProductCard";
import { AutoScrollingCategories } from "@/components/AutoScrollingCategories";

export const revalidate = 0;

export default async function Home(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  const pageParam = searchParams.page;
  const page = parseInt(typeof pageParam === 'string' ? pageParam : "1");
  const limit = 20;
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  const { data: rawProducts, count } = await supabase
    .from("products")
    .select("*, stores(store_name)", { count: "exact" })
    .eq('approval_status', 'approved')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(start, end);
    
  const products = rawProducts || [];
  const totalPages = Math.ceil((count || 0) / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const { data: dbCategories } = await supabase.from("categories").select("*").order("created_at");
  const { data: settings } = await supabase.from("store_settings").select("value").eq("id", "homepage_categories").single();
  
  // Use admin's configured images, fallback to default Unsplash only if missing
  const adminCategories: { name: string, icon: string }[] = settings?.value || [];
  
  const categories = (dbCategories || []).map(cat => {
    // Find if admin uploaded a custom image for this category name
    const customMatch = adminCategories.find(ac => ac.name.toLowerCase().trim() === cat.name.toLowerCase().trim() || ac.name.toLowerCase().includes(cat.name.toLowerCase()));
    
    return {
      ...cat,
      icon: customMatch?.icon || '/images/curtains_hero.jpg'
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* QUICK CATEGORIES (MOBILE HORIZONTAL SCROLL) */}
      <section className="bg-white border-b shadow-sm mb-4">
        <Card className="border-none shadow-none rounded-none w-full overflow-hidden">
          <CardContent className="p-0">
            <AutoScrollingCategories categories={categories.filter(c => c.icon !== '/images/curtains_hero.jpg')} />
          </CardContent>
        </Card>
      </section>

      {/* HERO SECTION */}
      <section className="container mx-auto px-4 lg:pt-2 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[400px]">
          
          {/* Left Sidebar (Desktop Only) */}
          <Card className="hidden lg:block w-64 shrink-0 rounded-lg border-none shadow-sm h-full overflow-hidden">
            <nav className="flex flex-col py-2 h-full bg-white">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b text-slate-900 font-bold text-sm tracking-wide mb-1">
                <Menu className="w-5 h-5"/> RETAIL
              </div>
              
              {categories.slice(0, 5).map((cat) => (
                <Link 
                  key={`retail-desk-${cat.id}`} 
                  href={`/shop?category=${cat.id}`} 
                  className="px-4 py-2 hover:bg-slate-100 flex items-center justify-between text-sm font-medium text-slate-700"
                >
                  {cat.name} <ChevronRight className="w-4 h-4 text-slate-400"/>
                </Link>
              ))}

              <div className="px-4 py-2 mt-1">
                <Link href="/categories" className="text-blue-600 font-bold text-xs flex items-center hover:underline group">
                  See All Retail &rarr;
                </Link>
              </div>

              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border-y text-amber-900 font-bold text-sm tracking-wide my-1">
                <Truck className="w-5 h-5"/> WHOLESALE
              </div>

              {categories.slice(0, 5).map((cat) => (
                <Link 
                  key={`wholesale-desk-${cat.id}`} 
                  href={`/shop?category=${cat.id}&filter=wholesale`} 
                  className="px-4 py-2 hover:bg-amber-50 flex items-center justify-between text-sm font-medium text-slate-700"
                >
                  {cat.name} <ChevronRight className="w-4 h-4 text-slate-400"/>
                </Link>
              ))}

              <div className="px-4 py-2 mt-1">
                <Link href="/shop?filter=wholesale" className="text-amber-600 font-bold text-xs flex items-center hover:underline group">
                  See All Wholesale &rarr;
                </Link>
              </div>

              <div className="mt-auto border-t px-4 py-3 bg-slate-50">
                <Link href="/how-to-measure" className="text-blue-600 font-bold text-sm flex items-center gap-2 hover:underline"><Blinds className="w-4 h-4"/> Book Free Measurement</Link>
              </div>
            </nav>
          </Card>

          {/* Main Hero Slider */}
          <div className="flex-1 rounded-lg overflow-hidden relative shadow-sm min-h-[350px] sm:min-h-[400px] lg:h-full group bg-slate-900">
            <img src="/images/curtains_hero.jpg" alt="Premium Window Treatments" className="w-full h-full object-cover absolute inset-0 opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div>
            <div className="relative z-10 w-full h-full flex flex-col items-start justify-center text-left p-8 md:p-12 max-w-2xl">
              <span className="bg-blue-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full mb-4 flex items-center gap-1 w-max"><Star className="w-3 h-3 fill-white"/> Premium Quality</span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-lg leading-tight">Elevate Your Space<br/>with Perfect Blinds.</h1>
              <p className="text-white/90 text-sm md:text-lg mb-8 max-w-md font-medium drop-shadow-md">Custom-fitted blinds, elegant curtains, and smart window treatments tailored for your home and office in Nigeria.</p>
                <div className="flex flex-col sm:flex-row gap-4 w-full mt-2">
                  <Link href="/shop" className="w-full sm:w-auto"><Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 h-12 shadow-lg border-none text-base rounded-full flex items-center justify-center gap-2"><Star className="w-4 h-4 fill-white"/> Retail Center</Button></Link>
                  <Link href="/shop?filter=wholesale" className="w-full sm:w-auto"><Button size="lg" className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold px-6 h-12 shadow-lg border-none text-base rounded-full flex items-center justify-center gap-2"><Truck className="w-4 h-4"/> Wholesale Center</Button></Link>
                </div>
            </div>
          </div>

          {/* Right Promo Banners */}
          <div className="hidden lg:flex flex-col gap-4 w-[280px] shrink-0 h-full">
            <div className="flex-1 rounded-lg overflow-hidden relative shadow-sm bg-slate-800 border border-slate-700 p-5 flex flex-col justify-center group hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-3 text-white shadow-sm"><Sun className="w-5 h-5"/></div>
              <h3 className="font-bold text-white text-lg mb-1">100% Blackout</h3>
              <p className="text-xs text-slate-300">Total privacy and light control for your bedrooms and media rooms.</p>
              <ChevronRight className="w-5 h-5 text-blue-400 absolute bottom-5 right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="flex-1 rounded-lg overflow-hidden relative shadow-sm bg-blue-50 border border-blue-100 p-5 flex flex-col justify-center group hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-3 text-blue-600 shadow-sm"><Shield className="w-5 h-5"/></div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">Expert Installation</h3>
              <p className="text-xs text-slate-600">Professional measuring and fitting by our certified ICONJ installers.</p>
              <ChevronRight className="w-5 h-5 text-blue-400 absolute bottom-5 right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </section>

      {/* TOP SELLING PRODUCTS */}
      <section className="mb-8 w-full">
        <Card className="border-none shadow-sm rounded-none overflow-hidden bg-white">
          <div className="bg-blue-600 px-4 md:px-8 py-3 flex justify-between items-center">
            <h2 className="text-white font-bold text-lg flex items-center gap-2"><Star className="w-5 h-5 fill-white"/> Premium Window Treatments</h2>
            <Link href="/shop" className="text-white text-sm font-medium hover:underline flex items-center">See All <ChevronRight className="w-4 h-4"/></Link>
          </div>
          <CardContent className="p-0 sm:p-4 md:p-8 pt-2 sm:pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-1 sm:gap-4 md:gap-6">
              {products?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            {/* View All Button */}
            <div className="flex justify-between items-center mt-10 mb-4 px-2">
                <div className="text-sm font-semibold text-slate-500">
                  Page {page} of {totalPages || 1}
                </div>
                <div className="flex gap-2">
                  <Link href={hasPrev ? `/?page=${page - 1}` : '#'} className={!hasPrev ? 'pointer-events-none opacity-50' : ''}>
                    <Button variant="outline" size="lg" className="font-bold border-2">
                      <ChevronLeft className="w-5 h-5 mr-1" /> Previous
                    </Button>
                  </Link>
                  <Link href={hasNext ? `/?page=${page + 1}` : '#'} className={!hasNext ? 'pointer-events-none opacity-50' : ''}>
                    <Button variant="outline" size="lg" className="font-bold border-2 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-700">
                      Next <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
          </CardContent>
        </Card>
      </section>

      {/* WHY CHOOSE ICONJ */}
      <section className="container mx-auto px-4 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                <Blinds className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Custom Made-to-Measure</h3>
              <p className="text-sm text-slate-500">Every blind is tailored exactly to your window's dimensions for a perfect fit.</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Premium Materials</h3>
              <p className="text-sm text-slate-500">Sourced directly from top manufacturers globally for durability and style.</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Delivery & Installation</h3>
              <p className="text-sm text-slate-500">Fast nationwide delivery with optional professional installation available.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
