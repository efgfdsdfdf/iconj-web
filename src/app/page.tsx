import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, ShieldCheck, Truck, Clock, CreditCard, Star, ChevronDown, PackageCheck } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

import { ProductCard } from "@/components/product/ProductCard";

export const revalidate = 0;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: products } = await supabase.from("products").select("*").limit(8);

  const getProductImage = (category: string) => {
    if (category?.includes("Motorized")) return "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80";
    if (category?.includes("Blackout")) return "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600&q=80";
    if (category?.includes("Track") || category?.includes("Curtain")) return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80";
    return "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80";
  };

  const categories = [
    { name: "Motorized Blinds", icon: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&q=80" },
    { name: "Blackout Shades", icon: "https://images.unsplash.com/photo-1615873968403-89e068629265?w=200&q=80" },
    { name: "Curtain Tracks", icon: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&q=80" },
    { name: "Honeycomb", icon: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200&q=80" },
    { name: "Outdoor Patio", icon: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&q=80" },
    { name: "Custom Sizes", icon: "https://images.unsplash.com/photo-1600607688969-a5bfcd64bd40?w=200&q=80" },
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scroll-infinite {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-infinite {
          animation: scroll-infinite 10s linear infinite;
          width: max-content;
        }
        @media (min-width: 768px) {
          .animate-scroll-infinite {
            animation: scroll-infinite 20s linear infinite;
          }
        }
        .animate-scroll-infinite:hover, .animate-scroll-infinite:active {
          animation-play-state: paused;
        }
      `}} />
      
      {/* QUICK CATEGORIES (Auto Horizontal Scroll) */}
      <section className="container mx-auto px-4 mb-8 pt-4 overflow-hidden">
        <Card className="border-none shadow-sm rounded-lg overflow-hidden">
          <CardContent className="p-4 overflow-hidden relative">
            <div className="flex gap-4 md:gap-8 animate-scroll-infinite pb-2">
              {[...categories, ...categories, ...categories].map((cat, i) => (
                <Link href="/shop" key={i} className="flex flex-col items-center gap-2 w-[80px] shrink-0 group">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-transparent group-hover:border-orange-500 transition-colors p-1 bg-slate-50">
                    <img src={cat.icon} alt={cat.name} className="w-full h-full rounded-full object-cover" />
                  </div>
                  <span className="text-xs text-center font-medium text-slate-700 whitespace-normal line-clamp-2 leading-tight">{cat.name}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* JUMIA STYLE HERO SECTION */}
      <section className="container mx-auto px-4 lg:pt-2 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[400px]">
          
          {/* Left Sidebar (Desktop Only) */}
          <Card className="hidden lg:block w-64 shrink-0 rounded-lg border-none shadow-sm h-full overflow-hidden">
            <nav className="flex flex-col py-2 h-full bg-white">
              <Link href="/shop" className="px-4 py-2 hover:bg-slate-100 flex items-center justify-between text-sm font-medium text-slate-700">Smart Motorized Blinds <ChevronRight className="w-4 h-4 text-slate-400"/></Link>
              <Link href="/shop" className="px-4 py-2 hover:bg-slate-100 flex items-center justify-between text-sm font-medium text-slate-700">100% Blackout Shades <ChevronRight className="w-4 h-4 text-slate-400"/></Link>
              <Link href="/shop" className="px-4 py-2 hover:bg-slate-100 flex items-center justify-between text-sm font-medium text-slate-700">Smart Curtain Tracks <ChevronRight className="w-4 h-4 text-slate-400"/></Link>
              <Link href="/shop" className="px-4 py-2 hover:bg-slate-100 flex items-center justify-between text-sm font-medium text-slate-700">Honeycomb Cellular Blinds <ChevronRight className="w-4 h-4 text-slate-400"/></Link>
              <Link href="/shop" className="px-4 py-2 hover:bg-slate-100 flex items-center justify-between text-sm font-medium text-slate-700">Roman Shades <ChevronRight className="w-4 h-4 text-slate-400"/></Link>
              <Link href="/shop" className="px-4 py-2 hover:bg-slate-100 flex items-center justify-between text-sm font-medium text-slate-700">Outdoor Patio Shading <ChevronRight className="w-4 h-4 text-slate-400"/></Link>
              <Link href="/shop" className="px-4 py-2 hover:bg-slate-100 flex items-center justify-between text-sm font-medium text-slate-700">Custom Manual Blinds <ChevronRight className="w-4 h-4 text-slate-400"/></Link>
            </nav>
          </Card>

          {/* Main Hero Slider */}
          <div className="flex-1 rounded-lg overflow-hidden relative shadow-sm min-h-[350px] sm:min-h-[400px] lg:h-full group bg-slate-900">
            <img src="https://images.unsplash.com/photo-1600607688969-a5bfcd64bd40?q=80&w=2000" alt="Premium Smart Blinds" className="w-full h-full object-cover opacity-60 absolute inset-0" />
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center p-6">
              <span className="bg-orange-500 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-sm mb-4">Official Store</span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-lg leading-tight">Automate Your Home.<br/>Elevate Your Style.</h1>
              <p className="text-white/90 text-sm md:text-lg mb-8 max-w-lg font-medium drop-shadow-md">Premium motorized and manual window coverings shipped directly from manufacturer to your door in Nigeria.</p>
              <Link href="/shop"><Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 h-12 shadow-lg border-none text-base">SHOP NOW</Button></Link>
            </div>
          </div>

          {/* Right Promo Banners */}
          <div className="hidden lg:flex flex-col gap-4 w-[280px] shrink-0 h-full">
            <div className="flex-1 rounded-lg overflow-hidden relative shadow-sm bg-blue-50 border p-4 flex flex-col justify-center">
              <h3 className="font-bold text-slate-900 text-lg mb-1">Direct Factory Pricing</h3>
              <p className="text-xs text-slate-600 mb-3">Save up to 30% buying direct from Qingyuan Leyou via ICONJ.</p>
              <ShieldCheck className="w-8 h-8 text-blue-600 opacity-20 absolute bottom-4 right-4" />
            </div>
            <div className="flex-1 rounded-lg overflow-hidden relative shadow-sm bg-orange-50 border border-orange-100 p-4 flex flex-col justify-center">
              <h3 className="font-bold text-slate-900 text-lg mb-1">Nationwide Delivery</h3>
              <p className="text-xs text-slate-600 mb-3">Fast and secure shipping to all 36 states in Nigeria.</p>
              <Truck className="w-8 h-8 text-orange-500 opacity-20 absolute bottom-4 right-4" />
            </div>
          </div>
        </div>
      </section>

      {/* TOP SELLING PRODUCTS */}
      <section className="container mx-auto px-4 mb-8">
        <Card className="border-none shadow-sm rounded-lg overflow-hidden bg-white">
          <div className="bg-orange-500 px-4 py-3 flex justify-between items-center">
            <h2 className="text-white font-bold text-lg">Top Selling Items</h2>
            <Link href="/shop" className="text-white text-sm font-medium hover:underline flex items-center">See All <ChevronRight className="w-4 h-4"/></Link>
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products?.map((product: any, idx: number) => {
                // Attach fallback image if missing
                const p = { ...product, images: product.images || [getProductImage(product.category)] };
                return <ProductCard key={product.id} product={p} hideOnLg={idx === 4} />;
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* TRUST & PROOF SECTION */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><Truck className="w-6 h-6"/></div>
              <h3 className="font-bold text-slate-900">Nationwide Delivery</h3>
              <p className="text-xs text-slate-500">Secure shipping across Nigeria with tracking updates.</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600"><CreditCard className="w-6 h-6"/></div>
              <h3 className="font-bold text-slate-900">Secure Payments</h3>
              <p className="text-xs text-slate-500">100% secure payments via Paystack. Card or Bank Transfer.</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600"><PackageCheck className="w-6 h-6"/></div>
              <h3 className="font-bold text-slate-900">Factory Direct Quality</h3>
              <p className="text-xs text-slate-500">Authentic materials shipped direct from Qingyuan Leyou.</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600"><Clock className="w-6 h-6"/></div>
              <h3 className="font-bold text-slate-900">24/7 Support</h3>
              <p className="text-xs text-slate-500">Dedicated customer service team ready to assist your order.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
