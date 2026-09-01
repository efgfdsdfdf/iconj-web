"use client";

import Link from "next/link";
import { ShoppingCart, Menu, User, Search, Package, X, Phone, HelpCircle, ChevronDown, Heart, LogOut } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/store/cartStore";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface NavbarProps {
  categories?: { id: string; name: string }[];
}

export function Navbar({ categories = [] }: NavbarProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sellerStatus, setSellerStatus] = useState<string | null>(null);
  const tapCountRef = useRef({ count: 0, lastTap: 0 });
  
  const items = useCartStore((state) => state.items);
  const setItems = useCartStore((state) => state.setItems);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  
  useEffect(() => { 
    setMounted(true); 
    
    // Check auth status
    const checkAuth = async () => {
      // 1. INSTANT LOCAL CHECK (0ms delay) - Instantly updates the sidebar
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserEmail(session.user.email || null);
        if (session.user.user_metadata?.full_name) {
          setUserName(session.user.user_metadata.full_name.split(" ")[0]);
        } else {
          setUserName(session.user.email ? session.user.email.split("@")[0] : "User");
        }
        
        // Fetch seller status
        const { data: sellerData } = await supabase
          .from('sellers')
          .select('status')
          .eq('profile_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (sellerData) setSellerStatus(sellerData.status);
      }

      // 2. BACKGROUND NETWORK CHECK - Syncs the cloud cart
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Cloud Cart Sync Down
        const savedCart = user.user_metadata?.cart;
        if (savedCart && Array.isArray(savedCart) && savedCart.length > 0) {
          const currentLocalCart = useCartStore.getState().items;
          if (currentLocalCart.length === 0) {
            setItems(savedCart);
          } else {
            // Push local cart up if they started shopping before logging in
            fetch('/api/cart/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: currentLocalCart })
            }).catch(console.error);
          }
        }
      }
    };
    checkAuth();

    // Listen for login/logout events across tabs or from the login page!
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email || null);
        if (session.user.user_metadata?.full_name) {
          setUserName(session.user.user_metadata.full_name.split(" ")[0]);
        } else {
          setUserName(session.user.email ? session.user.email.split("@")[0] : "User");
        }
        
        const { data: sellerData } = await supabase
          .from('sellers')
          .select('status')
          .eq('profile_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (sellerData) setSellerStatus(sellerData.status);
      } else {
        setUserName(null);
        setUserEmail(null);
        setSellerStatus(null);
      }
    });

    return () => { subscription.unsubscribe(); };
  }, [supabase, setItems]);
  
  useEffect(() => { setIsMobileMenuOpen(false); }, [pathname]);

  // Cloud Cart Sync Up
  useEffect(() => {
    if (userEmail && mounted) {
      const timer = setTimeout(() => {
        fetch('/api/cart/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items })
        }).catch(console.error);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [items, userEmail, mounted]);

  const handleLogout = async () => {
    await fetch("/auth/signout", { method: "POST" });
    await supabase.auth.signOut();
    useCartStore.getState().clearCart();
    setUserName(null);
    setUserEmail(null);
    router.push("/login");
  };

  const handleAdminTap = (e: React.MouseEvent) => {
    if (userEmail === "ezeilodavid292@gmail.com") {
      e.preventDefault();
      e.stopPropagation();
      const now = Date.now();
      // Reset if more than 1s between taps
      if (now - tapCountRef.current.lastTap > 1000) {
        tapCountRef.current.count = 0;
      }
      
      tapCountRef.current.count += 1;
      tapCountRef.current.lastTap = now;
      
      if (tapCountRef.current.count >= 3) {
        tapCountRef.current.count = 0;
        router.push("/admin");
      }
    }
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isMobileMenuOpen]);

  const cartCount = items.reduce((total, item) => total + item.quantity, 0);

  if (pathname === '/iconj') return null;

  return (
    <div className="w-full">
      {/* Top Utility Bar (Jumia Style) */}
      <div className="bg-sky-100 hidden md:block border-b border-sky-200">
        <div className="container mx-auto px-4 h-9 flex items-center justify-between">
          <div className="flex gap-4 text-[11px] text-sky-800 font-medium">
            <Link href="#" className="hover:text-blue-600 flex items-center gap-1"><Phone className="w-3 h-3"/> Call to Order: 0800 ICONJ HELP</Link>
            <Link href="/faq" className="hover:text-blue-600 flex items-center gap-1"><HelpCircle className="w-3 h-3"/> Help & Support</Link>
          </div>
          <div className="flex gap-4 text-[11px] text-sky-800 font-medium">
            <Link href="/shop?filter=wholesale" className="hover:text-blue-600">Wholesale Center</Link>
            {sellerStatus === 'pending_verification' ? (
              <Link href="/seller" className="text-orange-600 font-bold hover:underline">Application Pending</Link>
            ) : sellerStatus === 'rejected' ? (
              <Link href="/seller" className="text-red-600 font-bold hover:underline">Application Rejected</Link>
            ) : sellerStatus === 'approved' ? (
              <Link href="/seller" className="text-blue-600 font-bold hover:underline">Seller Portal</Link>
            ) : (
              <Link href="/onboarding/seller" className="hover:text-blue-600 hover:underline">Sell on ICON</Link>
            )}
            <Link href="/track" className="hover:text-blue-600">Track Order</Link>
            <Link href="/shop?bundle=true" className="hover:text-blue-600 text-blue-500 font-bold">Premium Collection</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4 md:gap-8">
          
          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 -ml-2 text-slate-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>

          {/* Logo */}
          <Link href="/iconj" className="flex items-center gap-2 shrink-0">
            <div onClick={handleAdminTap} className="bg-blue-600 text-white p-2 rounded-lg shadow-sm cursor-pointer select-none">
              <Package className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 block">ICONJ</span>
          </Link>

          {/* Huge Search Bar (Jumia Style) */}
          <div className="flex-1 hidden md:flex items-center max-w-3xl">
            <SearchBar />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-4 shrink-0">
            <div className="hidden lg:block relative group">
              <Link href={userName ? "/account" : "/login"} className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 transition-colors">
                <User className="w-6 h-6 text-slate-700" />
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-xs text-slate-500 font-medium">Hello, {userName || "Sign In"}</span>
                  <span className="text-sm font-bold text-slate-900 flex items-center">Account <ChevronDown className="w-3 h-3 ml-1" /></span>
                </div>
              </Link>
              {/* Dropdown for desktop (optional enhancement) */}
              {userName && (
                <div className="absolute top-full right-0 w-48 bg-white shadow-lg border rounded-md hidden group-hover:block z-50">
                    <div className="py-2">
                      <Link href="/account" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Dashboard</Link>
                      {sellerStatus === 'pending_verification' && (
                        <Link href="/seller" className="block px-4 py-2 text-sm font-bold text-orange-600 hover:bg-orange-50">Application Pending</Link>
                      )}
                      {sellerStatus === 'rejected' && (
                        <Link href="/seller" className="block px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50">Application Rejected</Link>
                      )}
                      {sellerStatus === 'approved' && (
                        <Link href="/seller" className="block px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50">Seller Portal</Link>
                      )}
                      {userEmail === "ezeilodavid292@gmail.com" && (
                        <Link href="/admin" className="block px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50">Admin Panel</Link>
                      )}
                      <Link href="/account/orders" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Orders</Link>
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-100">Log Out</button>
                    </div>
                </div>
              )}
            </div>

            <Button variant="ghost" size="icon" className="text-slate-700 hidden sm:flex hover:bg-slate-50">
              <HelpCircle className="w-6 h-6" />
            </Button>

            <Link href="/cart">
              <div className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 transition-colors cursor-pointer relative">
                <div className="relative">
                  <ShoppingCart className="w-6 h-6 text-slate-700" />
                  {mounted && cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-slate-900 hidden lg:block">Cart</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar (Only visible on small screens) */}
        <div className="md:hidden px-4 pb-3">
            <SearchBar isMobile={true} />
          </div>
      </header>

      {/* Category Navigation Bar (Desktop) */}
      <nav className="hidden lg:flex w-full bg-slate-800 text-white shadow-md relative z-40">
        <div className="container mx-auto px-4 h-12 flex items-center gap-8 text-sm font-medium overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link href="/categories" className="flex items-center hover:text-orange-400 transition-colors">
            <Menu className="w-5 h-5 mr-2" />
            All Categories
          </Link>
          <div className="w-px h-6 bg-slate-600 shrink-0"></div>
          {categories.slice(0, 7).map(cat => (
            <Link key={cat.id} href={`/shop?category=${cat.id}`} className="hover:text-blue-400 transition-colors">
              {cat.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Menu Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-[100]" onClick={() => setIsMobileMenuOpen(false)}>
          {/* Drawer */}
          <div 
            className="fixed top-0 left-0 bottom-0 w-4/5 max-w-sm bg-white shadow-2xl flex flex-col transform transition-transform"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm">Welcome to ICONJ</p>
                  {userName ? (
                    <p className="text-xs text-blue-400 font-medium">Hello, {userName}</p>
                  ) : (
                    <Link href="/login" className="text-xs text-blue-400 font-medium hover:underline">Sign in / Register</Link>
                  )}
                </div>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <nav className="flex-1 overflow-y-auto py-2 bg-slate-50">
              <p className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100/50">Menu</p>
              <Link href="/iconj" className="block px-4 py-3.5 hover:bg-slate-100 font-medium text-slate-700 border-b border-slate-100">Home</Link>
              <Link href="/shop" className="block px-4 py-3.5 hover:bg-slate-100 font-medium text-slate-700 border-b border-slate-100">Shop All Products</Link>
              {!sellerStatus && (
                <Link href="/onboarding/seller" className="block px-4 py-3.5 hover:bg-slate-100 font-bold text-orange-600 border-b border-slate-100">Sell on ICON</Link>
              )}
              <Link href="/shop?filter=wholesale" className="block px-4 py-3.5 hover:bg-slate-100 font-bold text-blue-600 border-b border-slate-100">Wholesale Center</Link>
              <Link href="/about" className="block px-4 py-3.5 hover:bg-slate-100 font-medium text-slate-700 border-b border-slate-100">About Us</Link>
              <Link href="/account/support" className="block px-4 py-3.5 hover:bg-slate-100 font-medium text-slate-700 border-b border-slate-100">Contact Us</Link>
              
              <p className="px-4 py-3 mt-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100/50">Retail Categories</p>
              {categories.slice(0, 6).map(cat => (
                <Link key={`retail-mob-${cat.id}`} href={`/shop?category=${cat.id}`} className="block px-4 py-3.5 hover:bg-slate-100 font-medium text-slate-700 border-b border-slate-100">
                  {cat.name}
                </Link>
              ))}
              <Link href="/categories" className="block px-4 py-3.5 hover:bg-slate-100 font-bold text-blue-600 border-b border-slate-100">
                See All Retail &rarr;
              </Link>
              
              <p className="px-4 py-3 mt-4 text-xs font-bold text-amber-800 uppercase tracking-wider bg-amber-50">Wholesale Categories</p>
              {categories.slice(0, 6).map(cat => (
                <Link key={`wholesale-mob-${cat.id}`} href={`/shop?category=${cat.id}&filter=wholesale`} className="block px-4 py-3.5 hover:bg-amber-100 font-medium text-amber-900 border-b border-slate-100">
                  {cat.name} (Bulk)
                </Link>
              ))}
              <Link href="/shop?filter=wholesale" className="block px-4 py-3.5 hover:bg-amber-100 font-bold text-amber-600 border-b border-slate-100">
                See All Wholesale &rarr;
              </Link>
              
              <p className="px-4 py-3 mt-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100/50">My Account</p>
              <Link href="/account" className="block px-4 py-3.5 hover:bg-slate-100 font-medium text-slate-700 border-b border-slate-100">Dashboard</Link>
              <Link href="/cart" className="block px-4 py-3.5 hover:bg-slate-100 font-medium text-slate-700 border-b border-slate-100">My Cart</Link>
              <Link href="/account/orders" className="block px-4 py-3.5 hover:bg-slate-100 font-medium text-slate-700 border-b border-slate-100">Track Order</Link>
              {sellerStatus === 'pending_verification' && (
                <Link href="/seller" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3.5 hover:bg-orange-50 font-bold text-orange-600 border-b border-slate-100">Application Pending</Link>
              )}
              {sellerStatus === 'rejected' && (
                <Link href="/seller" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3.5 hover:bg-red-50 font-bold text-red-600 border-b border-slate-100">Application Rejected</Link>
              )}
              {sellerStatus === 'approved' && (
                <Link href="/seller" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3.5 hover:bg-blue-50 font-bold text-blue-600 border-b border-slate-100">Seller Portal</Link>
              )}
              
              {userEmail === "ezeilodavid292@gmail.com" && (
                <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3.5 hover:bg-blue-50 font-bold text-blue-700 border-b border-slate-100">Admin Panel</Link>
              )}

              {userName && (
                <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-4 mt-4 bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-colors">
                  <LogOut className="w-5 h-5" /> Log Out
                </button>
              )}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}


