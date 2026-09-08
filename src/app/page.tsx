import { createClient } from '@/lib/supabase/server';
import { AnimatedHero } from '@/components/home/AnimatedHero';
import { CategoryBentoGrid } from '@/components/home/CategoryBentoGrid';
import { CustomExperienceProcess } from '@/components/home/CustomExperienceProcess';
import { InfiniteMarquee } from '@/components/home/InfiniteMarquee';
import { FeaturedShowcase } from '@/components/home/FeaturedShowcase';
import { ShieldCheck, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'ICONJ — Customizable Blinds, Curtains & Window Accessories in Nigeria',
  description: 'ICONJ: Your space, your style. Customizable blinds, curtains & window accessories in Nigeria, ordered your way.',
};

export default async function IconjInteriorPage() {
  const supabase = await createClient();
  
  // Fetch trending products (blinds/curtains)
  const { data: rawProducts } = await supabase
    .from('products')
    .select('*')
    .eq('approval_status', 'approved')
    .eq('is_active', true)
    .limit(20);
    
  const featuredProducts = rawProducts ? [...rawProducts].sort(() => Math.random() - 0.5).slice(0, 4) : [];

  // Fetch custom category images from store_settings
  const { data: settings } = await supabase.from('store_settings').select('value').eq('id', 'homepage_categories').single();
  const adminCategories = settings?.value || [];

  const defaultCategories = [
    { name: 'Blinds', desc: 'Modern control over light & style.', img: '/images/venetian_blinds_card.jpg' },
    { name: 'Curtains', desc: 'Elegant finishing touches.', img: '/images/curtains_hero.jpg' },
    { name: 'Blackout', desc: 'Maximum privacy & darkness.', img: '/images/blackout_blinds.jpg' },
    { name: 'Sheer', desc: 'Soft natural light.', img: '/images/sheer_curtains.jpg' },
    { name: 'Roller Blinds', desc: 'Clean, minimal & modern.', img: '/images/roller_blinds_card.jpg' },
    { name: 'Zebra Blinds', desc: 'Flexible light control.', img: '/images/zebra_blinds_hero.jpg' },
  ];

  const categories = adminCategories.length > 0 
    ? adminCategories.map((ac: any) => ({
        name: ac.name,
        desc: ac.description || `Explore our premium ${ac.name}`,
        img: ac.icon || '/images/venetian_blinds_card.jpg'
      }))
    : defaultCategories;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 overflow-x-hidden selection:bg-blue-200">
      <AnimatedHero />
      <InfiniteMarquee />
      <CategoryBentoGrid categories={categories} />
      <CustomExperienceProcess />
      <FeaturedShowcase products={featuredProducts} />

      {/* Value Props Section (Static) */}
      <section className="py-24 bg-slate-950 border-t border-white/5 text-white px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <div>
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-6">
                <CheckCircle className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Guaranteed Quality</h3>
              <p className="text-slate-400 leading-relaxed">
                Every product is rigorously checked against your specifications before it leaves our facility. We guarantee a perfect fit.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure Transactions</h3>
              <p className="text-slate-400 leading-relaxed">
                Payments are securely processed and held until your custom quote is finalized and approved by you.
              </p>
            </div>
            <div className="lg:col-span-1 md:col-span-2">
              <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700">
                <h3 className="text-2xl font-bold mb-4">Ready to transform your space?</h3>
                <p className="text-slate-300 mb-8">
                  Get a free custom quote for your exact window measurements today.
                </p>
                <a href="/quote" className="inline-block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-full transition-colors">
                  Request a Quote
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
