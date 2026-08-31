import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, ShoppingCart, Menu, ArrowRight, Truck, ShieldCheck, CheckCircle, ChevronDown, User, Star, Ruler, Info, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/product/ProductCard';

export const metadata = {
  title: 'ICONJ — Blinds, Curtains & Window Solutions',
  description: 'Shop stylish blinds, curtains and window solutions on ICONJ. Transform your home or office with window treatments designed for comfort, privacy and style.',
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
    { name: 'Venetian Blinds', desc: 'Classic adjustable styling.', img: '/images/venetian_blinds_card.jpg' },
    { name: 'Vertical Blinds', desc: 'Perfect for large windows.', img: '/images/venetian_blinds_card.jpg' }
  ];

  const categories = defaultCategories.map(cat => {
    const customMatch = adminCategories.find((ac: any) => 
      ac.name.toLowerCase().trim() === cat.name.toLowerCase().trim() || 
      ac.name.toLowerCase().includes(cat.name.toLowerCase()) ||
      cat.name.toLowerCase().includes(ac.name.toLowerCase())
    );
    return {
      ...cat,
      img: customMatch?.icon || cat.img
    };
  });


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-600/30 overflow-x-hidden">
      
      {/* 14. NAVIGATION (Custom for this page) */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="text-3xl font-black tracking-tighter text-slate-950">
              ICONJ<span className="text-amber-600">.</span>
            </Link>
            <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
              <Link href="/shop" className="hover:text-amber-600 transition-colors">Shop</Link>
              <Link href="/shop?category=blinds" className="hover:text-amber-600 transition-colors">Blinds</Link>
              <Link href="/shop?category=curtains" className="hover:text-amber-600 transition-colors">Curtains</Link>
              <Link href="/categories" className="hover:text-amber-600 transition-colors">Window Solutions</Link>
              <Link href="#inspiration" className="hover:text-amber-600 transition-colors">Inspiration</Link>
              <Link href="/onboarding/seller" className="hover:text-amber-600 transition-colors">Become a Seller</Link>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Search blinds, curtains..." 
                className="w-64 h-10 pl-9 pr-4 rounded-full bg-slate-100 border-transparent text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
            </div>
            <Link href="/login" className="hidden sm:flex text-sm font-semibold text-slate-600 hover:text-amber-600 transition-colors items-center gap-2">
              <User className="w-4 h-4" /> Account
            </Link>
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-full">
                <ShoppingCart className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden text-slate-600">
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Cinematic Background Image */}
        <div className="absolute inset-0 bg-slate-900">
          <img 
            src="/images/zebra_blinds_hero.jpg" 
            alt="Beautiful modern living room with large windows and natural light" 
            className="w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold tracking-widest uppercase mb-8">
            Beautiful Windows. Better Spaces.
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight drop-shadow-lg">
            Transform Your Windows.<br className="hidden sm:block" /> Transform Your Space.
          </h1>
          <p className="text-lg sm:text-xl text-slate-200 mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow">
            Discover stylish blinds, curtains and window solutions designed to give your home or office the perfect finish.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-none transition-all hover:scale-105">
                Shop Window Solutions
              </Button>
            </Link>
            <Link href="#collections">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-bold border-2 border-white bg-transparent text-white hover:bg-white hover:text-slate-900 rounded-none transition-all">
                Explore Collections
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. QUICK CATEGORY NAVIGATION */}
      <section id="collections" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Shop by Window Style</h2>
            <div className="w-16 h-1 bg-amber-600 mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((cat, i) => (
              <Link href={`/shop?q=${cat.name.split(' ')[0]}`} key={i} className="group block relative h-64 overflow-hidden bg-slate-900 rounded-none">
                <img src={cat.img} alt={cat.name} className="w-full h-full object-cover opacity-80 group-hover:scale-110 group-hover:opacity-60 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 w-full translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-xl font-bold text-white mb-1">{cat.name}</h3>
                  <p className="text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">{cat.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURED COLLECTION */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Find Your Perfect Window Look</h2>
              <div className="w-16 h-1 bg-amber-600"></div>
            </div>
            <Link href="/shop">
              <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100 rounded-none font-semibold">
                View All Collections <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {featuredProducts.length === 0 && (
             <div className="text-center py-24 bg-white border border-dashed border-slate-300">
               <p className="text-slate-500 font-medium">Featured window treatments will appear here.</p>
             </div>
          )}
        </div>
      </section>

      {/* 5. ROOM TRANSFORMATION SECTION */}
      <section className="py-24 bg-slate-950 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">See the Difference</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-16">
            The right window treatment can completely change the feel of a room.
          </p>
          
          <div className="grid md:grid-cols-2 gap-2 max-w-5xl mx-auto">
            <div className="relative aspect-[4/3] bg-slate-800">
              {/* Before: plain bare window, no treatment */}
              <img src="/images/sheer_curtains.jpg" alt="Window with no blinds or curtains — before" className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur text-white px-4 py-1 text-sm font-bold uppercase tracking-widest">Before</div>
            </div>
            <div className="relative aspect-[4/3] bg-slate-800">
              {/* After: same window with elegant blinds/curtains installed */}
              <img src="/images/curtains_hero.jpg" alt="Window with premium curtains installed — after" className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-amber-600 text-white px-4 py-1 text-sm font-bold uppercase tracking-widest shadow-lg">After</div>
            </div>
          </div>
          
          <div className="mt-12">
            <Link href="/shop">
              <Button size="lg" className="h-14 px-10 text-base font-bold bg-white text-slate-950 hover:bg-slate-200 rounded-none">
                Find Your Style
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. SHOP BY ROOM */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Perfect for Every Space</h2>
            <div className="w-16 h-1 bg-amber-600 mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Living Room', desc: 'Elegant sheers and drapes to frame your windows.', img: '/images/curtains_hero.jpg' },
              { name: 'Bedroom', desc: 'Blackout blinds for total privacy and darkness.', img: '/images/blackout_blinds.jpg' },
              { name: 'Office', desc: 'Clean roller blinds to control glare and light.', img: '/images/roller_blinds_card.jpg' },
              { name: 'Dining Area', desc: 'Soft sheers to add warmth and natural light.', img: '/images/sheer_curtains.jpg' },
              { name: 'Kids Room', desc: 'Colourful and safe window solutions for little ones.', img: '/images/zebra_blinds_hero.jpg' },
              { name: 'Large Windows', desc: 'Venetian and vertical blind solutions for wide windows.', img: '/images/venetian_blinds_card.jpg' }
            ].map((room, i) => (
              <Link href={`/shop?q=${room.name.split(' ')[0]}`} key={i} className="group block relative overflow-hidden bg-slate-100 aspect-[4/3]">
                <img src={room.img} alt={room.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300"></div>
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <h3 className="text-2xl font-bold text-white mb-2">{room.name}</h3>
                  <p className="text-white/90 text-sm font-medium">{room.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7. ICONJ OFFICIAL */}
      <section className="py-24 bg-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-slate-900 rounded-none shadow-2xl overflow-hidden flex flex-col md:flex-row items-stretch">
            <div className="flex-1 p-10 md:p-16 flex flex-col justify-center relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <ShieldCheck className="w-48 h-48 text-white" />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-600/20 text-amber-500 text-xs font-bold tracking-widest uppercase mb-6 border border-amber-600/30">
                  <Truck className="w-4 h-4" /> Free Delivery
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Shop ICONJ Official
                </h2>
                <p className="text-slate-300 mb-8 text-lg">
                  Explore premium blinds and curtains available directly from ICONJ Official and enjoy <strong className="text-white">FREE DELIVERY</strong> on eligible official orders.
                </p>
                <Link href="/shop?seller=iconj-official">
                  <Button size="lg" className="h-14 px-8 text-base font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-none">
                    Shop ICONJ Official
                  </Button>
                </Link>
                <p className="mt-8 text-xs text-slate-500 leading-relaxed max-w-md">
                  Independent sellers may have different delivery terms and charges. Please check the seller's delivery information before ordering.
                </p>
              </div>
            </div>
            <div className="md:w-2/5 min-h-[300px] relative hidden md:block">
              {/* Premium zebra blinds on large window */}
              <img src="/images/venetian_blinds_card.jpg" alt="Premium window blinds" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* 8. WHY CHOOSE ICONJ */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Designed for Better Spaces</h2>
            <div className="w-16 h-1 bg-amber-600 mx-auto"></div>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Style', desc: 'Find window treatments that perfectly match your interior design.', icon: Star },
              { title: 'Choice', desc: 'Explore different blinds, curtains, materials and modern styles.', icon: LayoutGrid },
              { title: 'Convenience', desc: 'Shop easily and securely from the comfort of your home.', icon: ShoppingCart },
              { title: 'Trusted Sellers', desc: 'Discover products from ICONJ Official and verified independent sellers.', icon: ShieldCheck }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6">
                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-6 text-amber-600">
                  <feature.icon className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. WINDOW SOLUTION GUIDE */}
      <section className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Not Sure Which One to Choose?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Use our guide to understand the differences and find the perfect match for your space.</p>
            <div className="w-16 h-1 bg-amber-600 mx-auto mt-6"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Blackout Blinds', desc: 'Engineered to block light completely.', best: 'Bedrooms and spaces where you want maximum darkness and privacy.', img: '/images/blackout_blinds.jpg' },
              { title: 'Sheer Curtains', desc: 'Lightweight fabrics that filter sunlight.', best: 'Living rooms and spaces where you want natural light with a softer look.', img: '/images/sheer_curtains.jpg' },
              { title: 'Zebra Blinds', desc: 'Alternating sheer and solid fabric bands.', best: 'Flexible control over light and privacy throughout the day.', img: '/images/zebra_blinds_hero.jpg' }
            ].map((guide, i) => (
              <Card key={i} className="rounded-none border-slate-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="h-48 overflow-hidden">
                  <img src={guide.img} alt={guide.title} className="w-full h-full object-cover" />
                </div>
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{guide.title}</h3>
                  <p className="text-slate-600 mb-6 text-sm">{guide.desc}</p>
                  <div className="bg-slate-50 p-4 border border-slate-100 mb-6">
                    <span className="font-bold text-slate-900 block mb-1 text-sm">Best for:</span>
                    <span className="text-slate-600 text-sm">{guide.best}</span>
                  </div>
                  <Link href={`/shop?q=${guide.title.split(' ')[0]}`} className="text-amber-600 font-bold text-sm inline-flex items-center hover:text-amber-700">
                    View Products <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 10. MEASUREMENT / INSTALLATION */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-none bg-white/10 flex items-center justify-center shrink-0">
              <Ruler className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Get the Right Fit</h2>
              <p className="text-slate-300">Learn how to measure your windows accurately before ordering.</p>
            </div>
          </div>
          <Link href="/how-to-measure">
            <Button size="lg" variant="outline" className="h-12 px-8 font-bold bg-transparent border-white text-white hover:bg-white hover:text-slate-900 rounded-none whitespace-nowrap">
              How to Measure
            </Button>
          </Link>
        </div>
      </section>

      {/* 12. CUSTOMER JOURNEY */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">From Window to Wow</h2>
            <div className="w-16 h-1 bg-amber-600 mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { num: '01', title: 'Explore', desc: 'Find the style that fits your space.' },
              { num: '02', title: 'Choose', desc: 'Select your preferred product & size.' },
              { num: '03', title: 'Order', desc: 'Complete your order securely.' },
              { num: '04', title: 'Transform', desc: 'Enjoy a better-looking space.' }
            ].map((step, i) => (
              <div key={i} className="text-center relative">
                {i < 3 && <div className="hidden md:block absolute top-10 left-[60%] w-full h-[1px] bg-amber-200"></div>}
                <div className="w-20 h-20 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 shadow-lg shadow-amber-200">
                  <span className="text-2xl font-black text-white">{step.num}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 15. INSPIRATION SECTION */}
      <section id="inspiration" className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Get Inspired</h2>
              <div className="w-16 h-1 bg-amber-600"></div>
            </div>
            <p className="text-slate-600 max-w-md text-sm md:text-right">
              Explore beautiful interior scenes and discover how the right window treatment elevates a room.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Roller blinds in living room */}
            <div className="aspect-square bg-slate-200 relative group overflow-hidden">
              <img src="/images/roller_blinds_card.jpg" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Roller blinds" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Link href="/shop?q=roller"><Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-black rounded-none">Shop Roller Blinds</Button></Link>
              </div>
            </div>
            {/* Large hero: sheer curtains with light */}
            <div className="aspect-square bg-slate-200 relative group overflow-hidden md:col-span-2 md:row-span-2">
              <img src="/images/curtains_hero.jpg" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Sheer curtains" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Link href="/shop?q=sheer"><Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-black rounded-none">Shop Sheer Curtains</Button></Link>
              </div>
            </div>
            {/* Zebra blinds */}
            <div className="aspect-square bg-slate-200 relative group overflow-hidden">
              <img src="/images/zebra_blinds_hero.jpg" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Zebra blinds" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Link href="/shop?q=zebra"><Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-black rounded-none">Shop Zebra Blinds</Button></Link>
              </div>
            </div>
            {/* Blackout blinds bedroom */}
            <div className="aspect-square bg-slate-200 relative group overflow-hidden">
              <img src="/images/blackout_blinds.jpg" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Blackout blinds" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Link href="/shop?q=blackout"><Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-black rounded-none">Shop Blackout</Button></Link>
              </div>
            </div>
            <div className="aspect-square bg-slate-200 relative group overflow-hidden">
              <img src="/images/curtains_hero.jpg" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Link href="/shop?q=living"><Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-black rounded-none">Shop Living Room</Button></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. SELLER SECTION */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Sell Your Window Products on ICONJ</h2>
            <div className="w-16 h-1 bg-amber-600 mb-6"></div>
            <p className="text-lg text-slate-600 mb-8 max-w-lg">
              Reach customers looking for blinds, curtains and window solutions. Create your store and grow your business on ICONJ.
            </p>
            <Link href="/onboarding/seller">
              <Button size="lg" className="h-14 px-8 text-base font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-none">
                Become a Seller
              </Button>
            </Link>
          </div>
          <div className="flex-1 w-full max-w-sm mx-auto">
            <div className="relative border-[8px] border-slate-900 bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden aspect-[9/19]">
              <img src="/images/seller-mockup.png" alt="ICONJ Seller Dashboard" className="w-full h-full object-cover object-top" />
            </div>
          </div>
        </div>
      </section>

      {/* 17. FAQ */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <div className="w-16 h-1 bg-amber-600 mx-auto"></div>
          </div>
          
          <div className="space-y-4">
            {[
              { q: 'What does ICONJ sell?', a: 'ICONJ specializes in blinds, curtains, window treatments and related window/interior solutions.' },
              { q: 'Do you offer free delivery?', a: 'ICONJ Official offers free delivery on eligible orders. Delivery terms for independent sellers may vary.' },
              { q: 'Can I buy from independent sellers?', a: 'Yes. ICONJ allows independent sellers to offer their high-quality window and interior products on our marketplace.' },
              { q: 'How do I know which blind is right for me?', a: 'Use our product information and Window Solution Guide to compare different styles like Blackout, Sheer, Zebra, and Roller blinds.' },
              { q: 'How can I become an ICONJ seller?', a: 'Click "Become a Seller" in the navigation menu to begin the simple seller onboarding process.' }
            ].map((faq, i) => (
              <details key={i} className="group bg-white border border-slate-200 cursor-pointer">
                <summary className="flex items-center justify-between p-6 text-lg font-bold text-slate-900 list-none">
                  {faq.q}
                  <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 18. FINAL CTA */}
      <section className="relative py-32 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/zebra_blinds_hero.jpg" className="w-full h-full object-cover opacity-40 mix-blend-overlay" />
          <div className="absolute inset-0 bg-slate-950/70"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Give Your Windows the<br />Finish They Deserve.
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Discover blinds, curtains and window solutions designed to make your space feel better.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop">
              <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-lg font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-none">
                Shop ICONJ
              </Button>
            </Link>
            <Link href="/shop?category=blinds">
              <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-lg font-bold bg-transparent border-2 border-white text-white hover:bg-white hover:text-slate-900 rounded-none">
                Explore Blinds
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 19. FOOTER */}
      <footer className="bg-white border-t border-slate-200 pt-20 pb-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
            <div className="col-span-2">
              <Link href="/" className="text-3xl font-black tracking-tighter text-slate-950 mb-4 block">
                ICONJ<span className="text-amber-600">.</span>
              </Link>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs mb-6 font-bold uppercase tracking-widest">
                Beautiful Windows. Better Spaces.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed max-w-sm">
                Premium e-commerce and home-interior marketplace specializing in blinds, curtains, and elegant window treatments.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Shop</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><Link href="/shop" className="hover:text-amber-600 transition-colors">All Products</Link></li>
                <li><Link href="/shop?category=blinds" className="hover:text-amber-600 transition-colors">Blinds</Link></li>
                <li><Link href="/shop?category=curtains" className="hover:text-amber-600 transition-colors">Curtains</Link></li>
                <li><Link href="/categories" className="hover:text-amber-600 transition-colors">Window Solutions</Link></li>
                <li><Link href="#inspiration" className="hover:text-amber-600 transition-colors">Inspiration</Link></li>
                <li><Link href="/shop?seller=iconj-official" className="hover:text-amber-600 transition-colors">ICONJ Official</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><Link href="/about" className="hover:text-amber-600 transition-colors">About Us</Link></li>
                <li><Link href="/onboarding/seller" className="hover:text-amber-600 transition-colors">Become a Seller</Link></li>
                <li><Link href="/contact" className="hover:text-amber-600 transition-colors">Contact</Link></li>
                <li><Link href="/faq" className="hover:text-amber-600 transition-colors">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><Link href="/privacy-policy" className="hover:text-amber-600 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-and-conditions" className="hover:text-amber-600 transition-colors">Terms & Conditions</Link></li>
                <li><Link href="/returns" className="hover:text-amber-600 transition-colors">Returns & Refunds</Link></li>
                <li><Link href="/faq" className="hover:text-amber-600 transition-colors">Shipping Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-slate-500 text-sm">
              © {new Date().getFullYear()} ICONJ. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
