import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, ShieldCheck, Heart, Star, ChevronRight, Baby, Gift, Shield } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product/ProductCard";

export const revalidate = 0;

export default async function Home() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: settings } = await supabase.from("store_settings").select("value").eq("id", "homepage_categories").single();
  const categories: { name: string, icon: string }[] = settings?.value || [
    { name: "Newborn Essentials", icon: "https://images.unsplash.com/photo-1555252834-406eb1be18f4?w=200&q=80" },
    { name: "Baby Feeding", icon: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=200&q=80" },
    { name: "Baby Bath & Care", icon: "https://images.unsplash.com/photo-1544640808-32cb4fbaee4d?w=200&q=80" },
    { name: "Toys & Development", icon: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=200&q=80" },
    { name: "Maternity", icon: "https://images.unsplash.com/photo-1517590858763-7e61a6b412ee?w=200&q=80" },
    { name: "Gifts & Bundles", icon: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=200&q=80" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* QUICK CATEGORIES (MOBILE HORIZONTAL SCROLL) */}
      <section className="bg-white border-b shadow-sm mb-4">
        <Card className="border-none shadow-none rounded-none w-full overflow-hidden">
          <CardContent className="p-0">
            <div className="flex overflow-x-auto hide-scrollbar snap-x py-3 px-4 gap-4 md:justify-center">
              {categories.map((cat, idx) => (
                <Link key={idx} href={`/shop?category=${encodeURIComponent(cat.name)}`} className="flex flex-col items-center gap-2 group snap-start shrink-0 w-[72px] md:w-[80px]">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border border-slate-100 group-hover:border-blue-500 group-hover:shadow-md transition-all">
                    <img src={cat.icon} alt={cat.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs text-center font-medium text-slate-700 whitespace-normal line-clamp-2 leading-tight">{cat.name}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* HERO SECTION */}
      <section className="container mx-auto px-4 lg:pt-2 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[400px]">
          
          {/* Left Sidebar (Desktop Only) */}
          <Card className="hidden lg:block w-64 shrink-0 rounded-lg border-none shadow-sm h-full overflow-hidden">
            <nav className="flex flex-col py-2 h-full bg-white">
              <Link href="/shop?category=Newborn" className="px-4 py-2 hover:bg-slate-100 flex items-center justify-between text-sm font-medium text-slate-700">Newborn Essentials <ChevronRight className="w-4 h-4 text-slate-400"/></Link>
              <Link href="/shop?category=Feeding" className="px-4 py-2 hover:bg-slate-100 flex items-center justify-between text-sm font-medium text-slate-700">Baby Feeding <ChevronRight className="w-4 h-4 text-slate-400"/></Link>
              <Link href="/shop?category=Bath" className="px-4 py-2 hover:bg-slate-100 flex items-center justify-between text-sm font-medium text-slate-700">Baby Care & Bath <ChevronRight className="w-4 h-4 text-slate-400"/></Link>
              <Link href="/shop?category=Safety" className="px-4 py-2 hover:bg-slate-100 flex items-center justify-between text-sm font-medium text-slate-700">Baby Safety <ChevronRight className="w-4 h-4 text-slate-400"/></Link>
              <Link href="/shop?category=Travel" className="px-4 py-2 hover:bg-slate-100 flex items-center justify-between text-sm font-medium text-slate-700">Baby Travel <ChevronRight className="w-4 h-4 text-slate-400"/></Link>
              <Link href="/shop?category=Toys" className="px-4 py-2 hover:bg-slate-100 flex items-center justify-between text-sm font-medium text-slate-700">Toys & Development <ChevronRight className="w-4 h-4 text-slate-400"/></Link>
              <Link href="/shop?category=Maternity" className="px-4 py-2 hover:bg-slate-100 flex items-center justify-between text-sm font-medium text-slate-700">Maternity & Mother Care <ChevronRight className="w-4 h-4 text-slate-400"/></Link>
              <div className="mt-auto border-t px-4 py-3">
                <Link href="/shop?bundle=true" className="text-blue-600 font-bold text-sm flex items-center gap-2 hover:underline"><Gift className="w-4 h-4"/> Shop Gift Bundles</Link>
              </div>
            </nav>
          </Card>

          {/* Main Hero Slider */}
          <div className="flex-1 rounded-lg overflow-hidden relative shadow-sm min-h-[350px] sm:min-h-[400px] lg:h-full group bg-rose-50">
            <img src="https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=2000" alt="Premium Mother and Baby Products" className="w-full h-full object-cover absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20"></div>
            <div className="relative z-10 w-full h-full flex flex-col items-start justify-center text-left p-8 md:p-12 max-w-2xl">
              <span className="bg-rose-500 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full mb-4 flex items-center gap-1 w-max"><Heart className="w-3 h-3"/> Thoughtfully Chosen</span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-lg leading-tight">Everything You Need<br/>for Motherhood & Baby.</h1>
              <p className="text-white/90 text-sm md:text-lg mb-8 max-w-md font-medium drop-shadow-md">Premium newborn essentials, maternity care, and nursery products safely delivered to your doorstep anywhere in Nigeria.</p>
              <div className="flex flex-wrap gap-4">
                <Link href="/shop"><Button size="lg" className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-8 h-12 shadow-lg border-none text-base rounded-full">Shop Baby Essentials</Button></Link>
                <Link href="/shop?category=Maternity"><Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-bold px-8 h-12 text-base rounded-full backdrop-blur-sm">Shop for Mum</Button></Link>
              </div>
            </div>
          </div>

          {/* Right Promo Banners */}
          <div className="hidden lg:flex flex-col gap-4 w-[280px] shrink-0 h-full">
            <div className="flex-1 rounded-lg overflow-hidden relative shadow-sm bg-rose-50 border border-rose-100 p-5 flex flex-col justify-center group hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-3 text-rose-500 shadow-sm"><Baby className="w-5 h-5"/></div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">Newborn Starters</h3>
              <p className="text-xs text-slate-600">Perfectly curated bundles for your baby's first months.</p>
              <ChevronRight className="w-5 h-5 text-rose-400 absolute bottom-5 right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="flex-1 rounded-lg overflow-hidden relative shadow-sm bg-blue-50 border border-blue-100 p-5 flex flex-col justify-center group hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-3 text-blue-500 shadow-sm"><Shield className="w-5 h-5"/></div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">Trusted Quality</h3>
              <p className="text-xs text-slate-600">Carefully sourced materials prioritizing safety and comfort.</p>
              <ChevronRight className="w-5 h-5 text-blue-400 absolute bottom-5 right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </section>

      {/* TOP SELLING PRODUCTS */}
      <section className="mb-8 w-full">
        <Card className="border-none shadow-sm rounded-none overflow-hidden bg-white">
          <div className="bg-rose-500 px-4 md:px-8 py-3 flex justify-between items-center">
            <h2 className="text-white font-bold text-lg flex items-center gap-2"><Star className="w-5 h-5 fill-white"/> Mother's Picks & Best Sellers</h2>
            <Link href="/shop" className="text-white text-sm font-medium hover:underline flex items-center">See All <ChevronRight className="w-4 h-4"/></Link>
          </div>
          <CardContent className="p-4 md:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products?.map((product: any, idx: number) => {
                // Keep the placeholder images for now if they don't have real ones, but this logic assumes existing images
                return <ProductCard key={product.id} product={product} hideOnLg={false} />;
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* TRUST & PROOF SECTION */}
      <section className="container mx-auto px-4 mt-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Why Shop With ICONJ?</h2>
          <p className="text-slate-500 mt-2">We prioritize safety, comfort, and convenience for growing families.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border border-slate-200 shadow-sm bg-white hover:border-blue-200 transition-colors">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><Truck className="w-6 h-6"/></div>
              <h3 className="font-bold text-slate-900">Nationwide Delivery</h3>
              <p className="text-xs text-slate-500">Secure and trackable shipping directly to you, anywhere in Nigeria.</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 shadow-sm bg-white hover:border-emerald-200 transition-colors">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600"><ShieldCheck className="w-6 h-6"/></div>
              <h3 className="font-bold text-slate-900">Secure Payments</h3>
              <p className="text-xs text-slate-500">100% secure checkout via Paystack. Card, USSD, or Bank Transfer.</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 shadow-sm bg-white hover:border-rose-200 transition-colors">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500"><Heart className="w-6 h-6"/></div>
              <h3 className="font-bold text-slate-900">Carefully Selected</h3>
              <p className="text-xs text-slate-500">Products thoughtfully chosen for quality, safety, and modern parenting.</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 shadow-sm bg-white hover:border-purple-200 transition-colors">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600"><Baby className="w-6 h-6"/></div>
              <h3 className="font-bold text-slate-900">Dedicated Support</h3>
              <p className="text-xs text-slate-500">Our team is ready to help resolve issues quickly and seamlessly.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

