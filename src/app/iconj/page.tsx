import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, ShieldCheck, Truck, Users, ArrowRight, CheckCircle, Smartphone, Star, Search, Menu, ChevronDown, Check, LayoutGrid, Tag, Store } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/product/ProductCard';

export const metadata = {
  title: 'ICONJ — Everything You Need. One Marketplace.',
  description: 'Shop products from ICONJ Official and independent sellers. Discover products, compare options and order easily on ICONJ.',
};

export default async function IconjMarketingPage() {
  const supabase = await createClient();
  
  // Fetch trending products
  const { data: rawProducts } = await supabase
    .from('products')
    .select('*')
    .eq('approval_status', 'approved')
    .eq('is_active', true)
    .limit(20);
    
  const trendingProducts = rawProducts ? [...rawProducts].sort(() => Math.random() - 0.5).slice(0, 4) : [];

  
  const { data: dbCategories } = await supabase.from('categories').select('*').order('created_at');
  const { data: settings } = await supabase.from('store_settings').select('value').eq('id', 'homepage_categories').single();
  const adminCategories = settings?.value || [];
  
  const categories = (dbCategories || []).map(cat => {
    const customMatch = adminCategories.find((ac: any) => 
      ac.name.toLowerCase().trim() === cat.name.toLowerCase().trim() || 
      ac.name.toLowerCase().includes(cat.name.toLowerCase())
    );
    return {
      ...cat,
      icon: customMatch?.icon || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&q=80'
    };
  });


  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-blue-500/30 font-sans overflow-x-hidden">
      {/* 15. NAVIGATION */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-black tracking-tighter text-white">
              ICONJ<span className="text-blue-500">.</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
              <Link href="/shop" className="hover:text-white transition-colors">Shop</Link>
              <Link href="/categories" className="hover:text-white transition-colors">Categories</Link>
              <Link href="/shop?seller=iconj-official" className="hover:text-blue-400 transition-colors">ICONJ Official</Link>
              <Link href="/seller" className="hover:text-white transition-colors">Sell on ICONJ</Link>
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search products, categories..." 
                className="w-64 h-9 pl-9 pr-4 rounded-full bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <Link href="/login" className="hidden sm:block text-sm font-medium text-slate-300 hover:text-white transition-colors">Login</Link>
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-white/10 rounded-full">
                <ShoppingCart className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden text-slate-300">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-8 pb-16 md:pt-20 lg:pt-32 lg:pb-40 px-4 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-blue-400 text-xs font-semibold tracking-wide uppercase mb-6">
              <Star className="w-3.5 h-3.5 fill-blue-400" /> The Premium Marketplace
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
              Everything You Need.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">One Marketplace.</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 mb-8 max-w-lg leading-relaxed">
              Discover products from ICONJ Official and trusted independent sellers, all in one simple shopping experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/shop">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] transition-all hover:scale-105">
                  Shop Now <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="#explore">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base font-bold border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-full backdrop-blur-md transition-all">
                  Explore ICONJ
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Visual - Premium Phone Mockup */}
          <div className="relative w-full max-w-[280px] sm:max-w-md mx-auto mt-12 lg:mt-0 lg:ml-auto lg:mr-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-[3rem] blur-2xl"></div>
            <div className="relative border-[8px] border-slate-800 bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden aspect-[9/19] flex flex-col">
              {/* Fake App Header */}
              <div className="h-16 border-b border-white/10 bg-slate-950/50 flex items-center justify-between px-6 pt-4">
                <span className="text-lg font-black tracking-tighter text-white">ICONJ<span className="text-blue-500">.</span></span>
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              {/* Fake App Body */}
              <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
                <div className="w-full h-32 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex flex-col justify-end">
                  <span className="text-white/80 text-xs font-bold uppercase">New Arrival</span>
                  <span className="text-white font-bold text-lg">Premium Collection</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-32 rounded-xl bg-slate-800 p-3 flex flex-col justify-between border border-white/5">
                    <div className="w-full h-16 bg-slate-700 rounded-lg animate-pulse"></div>
                    <div className="w-2/3 h-2 bg-slate-600 rounded"></div>
                  </div>
                  <div className="h-32 rounded-xl bg-slate-800 p-3 flex flex-col justify-between border border-white/5">
                    <div className="w-full h-16 bg-slate-700 rounded-lg animate-pulse delay-75"></div>
                    <div className="w-2/3 h-2 bg-slate-600 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -left-12 top-1/4 bg-slate-800/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-xl animate-[bounce_4s_infinite]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center"><ShoppingCart className="w-5 h-5 text-blue-400"/></div>
                <div>
                  <div className="text-sm font-bold text-white">Secure Checkout</div>
                  <div className="text-xs text-slate-400">Paystack Powered</div>
                </div>
              </div>
            </div>
            <div className="absolute -right-8 bottom-1/4 bg-slate-800/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-xl animate-[bounce_5s_infinite_reverse]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-emerald-400"/></div>
                <div>
                  <div className="text-sm font-bold text-white">Official Store</div>
                  <div className="text-xs text-slate-400">Free Delivery</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TRUST / VALUE STRIP */}
      <section className="border-y border-white/5 bg-slate-900/50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 divide-x-0 md:divide-x divide-white/5">
            {[
              { icon: ShoppingCart, title: 'Shop Easily', desc: 'Find products without the stress.' },
              { icon: ShieldCheck, title: 'Shop Securely', desc: 'A simple and secure checkout experience.' },
              { icon: Truck, title: 'Delivery', desc: 'Get your orders delivered conveniently.' },
              { icon: Store, title: 'Multiple Sellers', desc: 'Discover products from ICONJ Official & others.' }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center text-center px-4">
                <feature.icon className="w-6 h-6 text-blue-400 mb-3" />
                <h3 className="text-sm font-bold text-white mb-1">{feature.title}</h3>
                <p className="text-xs text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. ICONJ OFFICIAL FEATURE */}
      <section id="explore" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-900 to-slate-900 border border-blue-800/30 p-8 md:p-16 flex flex-col md:flex-row items-center gap-10 shadow-2xl">
            {/* Glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className="flex-1 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wide uppercase mb-6 border border-emerald-500/30">
                <Truck className="w-4 h-4" /> Free Delivery
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
                Shop <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">ICONJ Official</span>
              </h2>
              <p className="text-lg text-blue-100/80 mb-8 max-w-xl">
                Get products directly from ICONJ Official and enjoy <strong className="text-white">FREE DELIVERY</strong> on eligible ICONJ Official orders.
              </p>
              <Link href="/shop?seller=iconj-official">
                <Button size="lg" className="h-14 px-8 text-base font-bold bg-white text-blue-950 hover:bg-slate-100 rounded-full shadow-lg">
                  Shop ICONJ Official
                </Button>
              </Link>
              <p className="mt-6 text-xs text-blue-200/50 max-w-lg leading-relaxed">
                * Delivery terms for independent sellers may vary. Please check the seller's delivery information before placing an order. ICONJ Official = Free delivery. Independent sellers = Delivery terms vary.
              </p>
            </div>
            
            <div className="flex-1 relative z-10 w-full max-w-md">
              <div className="aspect-square rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 p-1 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full rounded-xl bg-slate-900 border border-white/10 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(37,99,235,0.5)]">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Guaranteed Quality</h3>
                  <p className="text-sm text-slate-400">Fulfilled directly from our warehouse to your doorstep.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW ICONJ WORKS */}
      <section className="py-24 bg-slate-950 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Shopping Made Simple</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Experience a seamless journey from discovery to delivery.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0"></div>
            
            {[
              { num: '01', title: 'Discover', desc: 'Browse products from ICONJ Official and independent sellers.' },
              { num: '02', title: 'Choose', desc: 'Compare products, check reviews, and select what works for you.' },
              { num: '03', title: 'Order', desc: 'Checkout securely via Paystack and get your order delivered.' }
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-white/5 flex items-center justify-center mb-6 shadow-xl group-hover:border-blue-500/50 group-hover:scale-110 transition-all duration-300">
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500">{step.num}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. PRODUCT DISCOVERY SECTION */}
      <section className="py-24 bg-slate-900 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Discover Something You'll Love</h2>
              <p className="text-slate-400">Explore our diverse categories across the marketplace.</p>
            </div>
            <Link href="/categories">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-full">
                View All Categories <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {categories.slice(0, 6).map((cat: any) => (
              <Link href={`/shop?category=${cat.id}`} key={cat.id} className="group block">
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-800">
                  <img src={cat.icon || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&q=80'} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                  <div className="absolute bottom-0 left-0 p-6 w-full">
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{cat.name}</h3>
                    <div className="flex items-center text-sm text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                      Shop now <ArrowRight className="ml-1 w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FEATURED PRODUCTS */}
      <section className="py-24 bg-slate-950 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Trending on ICONJ</h2>
            <Link href="/shop" className="hidden sm:flex text-blue-400 hover:text-blue-300 font-medium items-center">
              See All <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {trendingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {trendingProducts.length === 0 && (
             <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
               Products will appear here once added to the catalog.
             </div>
          )}
          <div className="mt-8 sm:hidden text-center">
             <Link href="/shop">
               <Button variant="outline" className="w-full border-white/20 text-white rounded-full">View All Products</Button>
             </Link>
          </div>
        </div>
      </section>

      {/* 8. WHY ICONJ */}
      <section className="py-24 bg-slate-900 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">More Than Just a Store</h2>
            <p className="text-lg text-slate-400">
              ICONJ brings products, sellers and shoppers together in one modern marketplace built to make online shopping simpler.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: LayoutGrid, title: 'One Marketplace', desc: 'Discover products from different sellers in one beautifully designed place.' },
              { icon: CheckCircle, title: 'Simple Checkout', desc: 'A straightforward, secure purchasing experience using standard Nigerian payment rails.' },
              { icon: Store, title: 'Seller Discovery', desc: 'Find products from independent sellers alongside our premium official items.' },
              { icon: Truck, title: 'Convenient Delivery', desc: 'Clear delivery information and convenient order fulfillment across the nation.' }
            ].map((feature, i) => (
              <Card key={i} className="bg-slate-800/50 border-white/5 hover:bg-slate-800 transition-colors">
                <CardContent className="p-8 flex items-start gap-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-400">{feature.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 9. SELLER SECTION */}
      <section className="py-24 bg-black px-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-blue-900/20 to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <div className="flex-1">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
              Have Something <span className="text-blue-500">to Sell?</span>
            </h2>
            <p className="text-lg text-slate-400 mb-8 max-w-xl">
              Turn your products into a business on ICONJ. Create your store, reach new customers and grow your sales on Nigeria's modern marketplace.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/seller">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-full">
                  Become a Seller
                </Button>
              </Link>
              <Link href="/onboarding/seller">
                <Button size="lg" variant="ghost" className="w-full sm:w-auto h-14 px-8 text-base font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-full">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex-1 w-full">
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center"><Store className="w-6 h-6 text-slate-400"/></div>
                <div>
                  <div className="text-white font-bold">Seller Dashboard</div>
                  <div className="text-slate-500 text-sm">Manage your store easily</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="h-24 bg-slate-800 rounded-xl"></div>
                  <div className="h-24 bg-blue-900/30 border border-blue-500/20 rounded-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. MOBILE APP / EXPERIENCE */}
      <section className="py-24 bg-slate-950 px-4">
        <div className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-16">
          <div className="flex-1 flex justify-center">
            <div className="relative w-64 h-[500px] bg-slate-900 rounded-[2.5rem] border-8 border-slate-800 shadow-2xl overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-2xl w-1/2 mx-auto"></div>
              <div className="p-4 pt-8 h-full flex flex-col gap-4">
                <div className="h-10 bg-slate-800 rounded-full flex items-center px-4">
                  <Search className="w-4 h-4 text-slate-500"/>
                </div>
                <div className="h-32 bg-gradient-to-br from-blue-600 to-slate-800 rounded-xl"></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-24 bg-slate-800 rounded-xl"></div>
                  <div className="h-24 bg-slate-800 rounded-xl"></div>
                </div>
                <div className="h-12 mt-auto bg-slate-800 rounded-xl"></div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 mb-6">
              <Smartphone className="w-6 h-6" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
              ICONJ, Wherever You Shop
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Enjoy a smooth, fast shopping experience directly from your phone, tablet or computer browser without needing to download a heavy app.
            </p>
            <Button size="lg" variant="outline" className="h-12 px-6 rounded-full border-white/20 text-white hover:bg-white/10">
              Install ICONJ on your device
            </Button>
          </div>
        </div>
      </section>

      {/* 11. TESTIMONIALS */}
      <section className="py-24 bg-slate-900 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">People Are Shopping Smarter</h2>
            <p className="text-slate-400">See what others are saying about the ICONJ experience.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-slate-950 border-white/5">
                <CardContent className="p-8">
                  <div className="flex text-amber-400 mb-6">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-slate-300 italic mb-6">"[Testimonial placeholder - To be replaced by real verified customer reviews once collected. ICONJ provides a seamless shopping experience.]"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800"></div>
                    <div>
                      <div className="text-white font-bold text-sm">Customer Name</div>
                      <div className="text-slate-500 text-xs">Verified Buyer</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 12. FAQ */}
      <section className="py-24 bg-slate-950 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'What is ICONJ?', a: 'ICONJ is an online marketplace where shoppers can discover products from ICONJ Official and independent sellers.' },
              { q: 'Is delivery free?', a: 'Orders from ICONJ Official enjoy free delivery where applicable. Delivery terms for independent sellers may vary.' },
              { q: 'Can I sell on ICONJ?', a: 'Yes. Independent sellers can create stores and list their products on ICONJ.' },
              { q: 'Is payment secure?', a: 'ICONJ uses secure payment processing (like Paystack) for safe and reliable checkout.' },
              { q: 'Can I track my order?', a: 'Yes, provide order tracking functionality is available within your customer account dashboard.' },
              { q: 'How do I contact ICONJ?', a: 'You can reach out through our official Help Center or contact support via the live chat.' }
            ].map((faq, i) => (
              <details key={i} className="group bg-slate-900 border border-white/5 rounded-2xl overflow-hidden cursor-pointer">
                <summary className="flex items-center justify-between p-6 text-lg font-medium text-white list-none">
                  {faq.q}
                  <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-slate-400">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 13. FINAL CTA */}
      <section className="py-32 bg-blue-600 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-32 border-2 border-white rounded-xl rotate-12 animate-pulse"></div>
          <div className="absolute bottom-10 right-20 w-32 h-20 border-2 border-white rounded-xl -rotate-6 animate-pulse delay-150"></div>
          <div className="absolute top-1/2 right-1/4 w-16 h-16 border-2 border-white rounded-full animate-bounce"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Your Next Find Is Waiting.
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Discover products, explore sellers and start shopping on ICONJ.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop">
              <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-lg font-bold bg-white text-blue-600 hover:bg-slate-100 rounded-full shadow-2xl">
                Start Shopping
              </Button>
            </Link>
            <Link href="/seller">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-10 text-lg font-bold border-white text-white hover:bg-white/10 rounded-full">
                Become a Seller
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 14. FOOTER */}
      <footer className="bg-slate-950 border-t border-white/10 pt-20 pb-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="text-2xl font-black tracking-tighter text-white mb-4 block">
                ICONJ<span className="text-blue-500">.</span>
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Your marketplace for discovering, shopping and selling. Built for the modern African shopper.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Navigation</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/shop" className="hover:text-white transition-colors">Shop</Link></li>
                <li><Link href="/categories" className="hover:text-white transition-colors">Categories</Link></li>
                <li><Link href="/shop?seller=iconj-official" className="hover:text-blue-400 transition-colors">ICONJ Official</Link></li>
                <li><Link href="/seller" className="hover:text-white transition-colors">Become a Seller</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/legal/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
                <li><Link href="/legal/returns" className="hover:text-white transition-colors">Returns & Refunds</Link></li>
                <li><Link href="/legal/shipping" className="hover:text-white transition-colors">Shipping Policy</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Support</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link href="/support" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-slate-500 text-sm">
              © {new Date().getFullYear()} ICONJ. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-slate-500">
              <span className="text-sm">Nigeria's Modern Marketplace</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
