"use client";

import Link from "next/link";
import { ShoppingCart, Menu, User, Search, Package, X, Phone, HelpCircle, ChevronDown, Heart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/store/cartStore";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [tapCount, setTapCount] = useState(0);
  
  const items = useCartStore((state) => state.items);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  
  useEffect(() => { 
    setMounted(true); 
    
    // Check auth status
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
        const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
        if (profile && profile.name) {
          setUserName(profile.name.split(" ")[0]);
        } else {
          // Fallback to the first part of their email if profile fetch fails (e.g. RLS)
          setUserName(user.email ? user.email.split("@")[0] : "User");
        }
      }
    };
    checkAuth();
  }, [supabase]);
  
  useEffect(() => { setIsMobileMenuOpen(false); }, [pathname]);

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
      const newCount = tapCount + 1;
      setTapCount(newCount);
      if (newCount >= 5) {
        setTapCount(0);
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
            <Link href="/track" className="hover:text-blue-600">Track Order</Link>
            <Link href="/shop?bundle=true" className="hover:text-rose-600 text-rose-500 font-bold">Shop Gift Bundles</Link>
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
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div onClick={handleAdminTap} className="bg-blue-600 text-white p-2 rounded-lg shadow-sm cursor-pointer select-none">
              <Package className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 block">ICONJ</span>
          </Link>

          {/* Huge Search Bar (Jumia Style) */}
          <div className="flex-1 hidden md:flex items-center max-w-3xl">
            <div className="relative w-full flex">
              <Input type="search" placeholder="Search products, brands and categories..." className="w-full pl-10 pr-4 py-6 border-2 border-slate-200 rounded-l-md rounded-r-none focus-visible:ring-0 focus-visible:border-blue-600 text-base" />
              <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <Button className="rounded-l-none rounded-r-md px-8 py-6 bg-blue-600 hover:bg-blue-700 shadow-none text-base uppercase font-bold tracking-wider">
                Search
              </Button>
            </div>
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
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input type="search" placeholder="Search products..." className="w-full pl-10 border-slate-200" />
          </div>
        </div>
      </header>

      {/* Category Navigation Bar (Desktop) */}
      <nav className="hidden lg:flex w-full bg-slate-800 text-white shadow-md relative z-40">
        <div className="container mx-auto px-4 h-12 flex items-center gap-8 text-sm font-medium">
          <button className="flex items-center gap-2 hover:text-orange-400 transition-colors">
            <Menu className="w-5 h-5" /> All Categories
          </button>
          <div className="w-px h-6 bg-slate-600"></div>
          <Link href="/shop" className="hover:text-orange-400 transition-colors">Newborn Essentials</Link>
          <Link href="/shop" className="hover:text-orange-400 transition-colors">Baby Feeding</Link>
          <Link href="/shop" className="hover:text-orange-400 transition-colors">Baby Care & Bath</Link>
          <Link href="/shop" className="hover:text-orange-400 transition-colors">Toys & Development</Link>
          <Link href="/shop" className="hover:text-orange-400 transition-colors">Maternity</Link>
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
              <Link href="/" className="block px-4 py-3.5 hover:bg-slate-100 font-medium text-slate-700 border-b border-slate-100">Home</Link>
              <Link href="/shop" className="block px-4 py-3.5 hover:bg-slate-100 font-medium text-slate-700 border-b border-slate-100">Shop All Products</Link>
              <Link href="/about" className="block px-4 py-3.5 hover:bg-slate-100 font-medium text-slate-700 border-b border-slate-100">About Us</Link>
              <Link href="/contact" className="block px-4 py-3.5 hover:bg-slate-100 font-medium text-slate-700 border-b border-slate-100">Contact Us</Link>
              
              <p className="px-4 py-3 mt-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100/50">Our Categories</p>
              <Link href="/shop" className="block px-4 py-3.5 hover:bg-slate-100 font-medium text-slate-700 border-b border-slate-100">Newborn Essentials</Link>
              <Link href="/shop" className="block px-4 py-3.5 hover:bg-slate-100 font-medium text-slate-700 border-b border-slate-100">Baby Feeding</Link>
              <Link href="/shop" className="block px-4 py-3.5 hover:bg-slate-100 font-medium text-slate-700 border-b border-slate-100">Baby Care & Bath</Link>
              <Link href="/shop" className="block px-4 py-3.5 hover:bg-slate-100 font-medium text-slate-700 border-b border-slate-100">Maternity</Link>
              
              <p className="px-4 py-3 mt-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100/50">My Account</p>
              <Link href="/account" className="block px-4 py-3.5 hover:bg-slate-100 font-medium text-slate-700 border-b border-slate-100">Dashboard</Link>
              <Link href="/cart" className="block px-4 py-3.5 hover:bg-slate-100 font-medium text-slate-700 border-b border-slate-100">My Cart</Link>
              <Link href="/account/orders" className="block px-4 py-3.5 hover:bg-slate-100 font-medium text-slate-700 border-b border-slate-100">Track Order</Link>
              
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


