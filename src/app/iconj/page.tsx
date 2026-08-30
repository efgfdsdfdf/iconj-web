import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Ruler, Wrench, ShieldCheck, ArrowRight, Play, CheckCircle2, ChevronRight, Home, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Welcome to ICONJ | Premium Window Treatments",
  description: "Discover, measure, and install premium window blinds and curtains with ICONJ.",
};

export default function IconjLandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {/* HERO SECTION */}
      <section className="relative w-full h-[600px] flex items-center justify-center overflow-hidden bg-slate-900">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2000" 
            alt="Beautiful living room with blinds" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/60 to-slate-900"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-12">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/20 text-blue-300 font-semibold text-sm mb-6 border border-blue-500/30 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" /> The Ultimate Window Styling Guide
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Transform Your Windows with <span className="text-blue-500">Confidence.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            From discovering the perfect style to easy measurement and stress-free installation, we guide you every step of the way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg shadow-blue-900/20">
                Explore Products <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="#guide">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-white/10 text-white border-white/20 hover:bg-white/20 rounded-full backdrop-blur-sm">
                View Installation Guide
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* DISCOVER STYLES */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Discover Your Style</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">Browse our premium collection of window treatments designed to elevate any room in your home or office.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Roller Blinds", desc: "Sleek, modern, and highly functional. Perfect for light control.", img: "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=800&q=80" },
            { title: "Venetian Blinds", desc: "Classic elegance with precise privacy and light tilting.", img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80" },
            { title: "Smart Blinds", desc: "Motorized convenience controlled from your smartphone.", img: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&q=80" }
          ].map((item, i) => (
            <Link href="/shop" key={i} className="group block">
              <Card className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl bg-white h-full flex flex-col">
                <div className="relative h-64 overflow-hidden">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                  <h3 className="absolute bottom-4 left-6 text-2xl font-bold text-white">{item.title}</h3>
                </div>
                <CardContent className="p-6 flex-1 flex flex-col">
                  <p className="text-slate-600 mb-4 flex-1">{item.desc}</p>
                  <span className="text-blue-600 font-semibold flex items-center group-hover:gap-2 transition-all">
                    View Options <ChevronRight className="w-4 h-4 ml-1" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* THE GUIDE (MEASURE & INSTALL) */}
      <section id="guide" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Your Complete Guide</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">We make buying window blinds incredibly simple. Follow these steps to get the perfect fit.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
            {/* Connecting line for desktop */}
            <div className="hidden lg:block absolute top-24 left-[15%] right-[15%] h-0.5 bg-slate-200 z-0"></div>

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-6 shadow-sm ring-8 ring-white">
                <Ruler className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">1. Measure</h3>
              <p className="text-slate-600 mb-6">Learn how to measure your windows perfectly with our simple 3-minute video guide, or book our professionals to do it for you.</p>
              <div className="space-y-3 w-full max-w-xs">
                <Button variant="outline" className="w-full rounded-full flex items-center justify-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
                  <Play className="w-4 h-4" /> Watch Measuring Video
                </Button>
                <Link href="/book-measurement" className="w-full block">
                  <Button variant="ghost" className="w-full rounded-full text-slate-600 underline">
                    Book Free Measurement
                  </Button>
                </Link>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center mb-6 shadow-md ring-8 ring-white">
                <Home className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">2. Order</h3>
              <p className="text-slate-600 mb-6">Browse our marketplace, customize your dimensions, choose your colors, and place your order securely.</p>
              <Link href="/shop" className="w-full max-w-xs block">
                <Button className="w-full rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
                  Start Shopping
                </Button>
              </Link>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 shadow-sm ring-8 ring-white">
                <Wrench className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">3. Install</h3>
              <p className="text-slate-600 mb-6">Follow our step-by-step DIY installation manual, or simply select "Expert Installation" at checkout.</p>
              <Button variant="outline" className="w-full max-w-xs rounded-full flex items-center justify-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                <FileTextIcon className="w-4 h-4" /> Read Install Manual
              </Button>
            </div>

          </div>
        </div>
      </section>

      {/* WHY ICONJ */}
      <section className="py-20 px-4 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Why choose ICONJ?</h2>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              We are Nigeria's leading marketplace for premium window furnishings. Whether you are a homeowner looking to upgrade one room, or a contractor sourcing bulk materials.
            </p>
            <ul className="space-y-4">
              {[
                "Direct from verified manufacturers and suppliers",
                "Wholesale and Retail pricing available",
                "Nationwide delivery across Nigeria",
                "Optional professional installation service"
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-slate-200">{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src="https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80" alt="Blinds" className="rounded-2xl h-64 w-full object-cover" />
            <img src="https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=600&q=80" alt="Blinds 2" className="rounded-2xl h-64 w-full object-cover mt-8" />
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-24 px-4 bg-blue-600 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to upgrade your space?</h2>
        <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">Join thousands of satisfied customers who have transformed their homes and offices with ICONJ.</p>
        <Link href="/shop">
          <Button size="lg" className="h-14 px-10 text-lg font-bold bg-white text-blue-900 hover:bg-slate-100 rounded-full shadow-xl">
            Go to Shop Now
          </Button>
        </Link>
      </section>
    </main>
  );
}

// Quick inline icon component to avoid extra imports
function FileTextIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  )
}

