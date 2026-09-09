import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/ProductCard";
import { CheckCircle2, ChevronRight, Star, ShieldCheck, Zap } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 60; // Revalidate every minute

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { createClient: createAdminClient } = require('@supabase/supabase-js');
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data } = await supabaseAdmin.from('landing_pages').select('title, subheadline, hero_image_url').eq('slug', slug).single();
  if (!data) return { title: 'Not Found | ICONJ' };
  
  return {
    title: `${data.title} | ICONJ Exclusive Offer`,
    description: data.subheadline || 'Exclusive offer on premium window blinds at ICONJ.',
    openGraph: {
      title: data.title,
      images: data.hero_image_url ? [data.hero_image_url] : [],
    }
  };
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Use admin client to fetch landing page and joined product to bypass RLS for now
  const { createClient: createAdminClient } = require('@supabase/supabase-js');
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: lp } = await supabaseAdmin
    .from('landing_pages')
    .select('*, product:product_id(*, stores(store_name, slug))')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!lp) notFound();

  // Simple script to track ad views
  const viewTrackingScript = `
    if (typeof window !== 'undefined') {
      const sid = sessionStorage.getItem('iconj_session_id');
      if (sid) {
        fetch('/api/analytics/events', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            eventType: 'landing_page_view',
            sessionId: sid,
            properties: { slug: '${slug}', lp_id: '${lp.id}' }
          })
        }).catch(console.error);
      }
    }
  `;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50" style={{ '--theme-color': lp.theme_color || '#f97316' } as React.CSSProperties}>
      <script dangerouslySetInnerHTML={{ __html: viewTrackingScript }} />
      
      {/* Minimal Header */}
      <header className="bg-white py-4 shadow-sm relative z-10">
        <div className="container mx-auto px-4 flex justify-center">
          <Link href="/" className="text-2xl font-extrabold tracking-tight text-slate-900">
            ICONJ
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-900 text-white">
          {lp.hero_image_url && (
            <div className="absolute inset-0 opacity-40 mix-blend-overlay">
              <img src={lp.hero_image_url} alt="Hero" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="relative container mx-auto px-4 py-20 md:py-32 text-center max-w-4xl">
            <span className="inline-block py-1 px-3 rounded-full bg-[var(--theme-color)] text-white text-xs font-bold tracking-widest uppercase mb-6">
              Special Offer
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              {lp.headline}
            </h1>
            {lp.subheadline && (
              <p className="text-lg md:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                {lp.subheadline}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={lp.product_id ? `/shop/${lp.product_id}` : '/shop'}>
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold" style={{ backgroundColor: 'var(--theme-color)' }}>
                  Shop the Offer <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="p-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-50 flex items-center justify-center mb-4 text-[var(--theme-color)] shadow-sm">
                  <Star className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Premium Quality</h3>
                <p className="text-slate-600">Built to last with high-grade materials and exceptional craftsmanship.</p>
              </div>
              <div className="p-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-50 flex items-center justify-center mb-4 text-[var(--theme-color)] shadow-sm">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Secure & Trusted</h3>
                <p className="text-slate-600">Secure checkout via Paystack with buyer protection guarantees.</p>
              </div>
              <div className="p-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-50 flex items-center justify-center mb-4 text-[var(--theme-color)] shadow-sm">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Fast Fulfillment</h3>
                <p className="text-slate-600">Quick processing and nationwide delivery right to your doorstep.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Content & Product Showcase */}
        <section className="py-16 md:py-24 bg-slate-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-6">Why Choose ICONJ?</h2>
                <div className="prose prose-slate prose-lg" dangerouslySetInnerHTML={{ __html: lp.body_content || '<p>Upgrade your space with our premium selection.</p>' }} />
                
                <ul className="mt-8 space-y-4">
                  {['Free consultation on custom orders', 'Wide variety of designs and colors', 'Excellent customer support'].map((benefit, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-[var(--theme-color)]" /> {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--theme-color)] to-slate-200 blur-3xl opacity-20 rounded-full" />
                {lp.product && (
                  <div className="relative bg-white p-6 rounded-2xl shadow-xl border border-slate-100 max-w-sm mx-auto">
                    <div className="text-center mb-4">
                      <span className="text-xs font-bold text-red-600 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full">Featured Deal</span>
                    </div>
                    <ProductCard product={lp.product} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="bg-slate-900 py-8 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} ICONJ. All rights reserved.</p>
      </footer>
    </div>
  );
}
