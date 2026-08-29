"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, DollarSign, Store, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function MobileSidebar({ storeName }: { storeName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const closeSidebar = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="p-2 md:hidden mr-2 -ml-2 text-slate-600 hover:text-slate-900 focus:outline-none">
        <Menu className="w-6 h-6" />
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 bg-slate-900 border-r-slate-800 text-slate-300">
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center px-6 bg-slate-950 font-bold text-white tracking-wider border-b border-slate-800 relative">
            ICON SELLER
          </div>
          <div className="p-4 border-b border-slate-800">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Store</p>
            <p className="text-sm text-white font-medium truncate">{storeName || "My Store"}</p>
          </div>
          <nav className="flex-1 py-6 px-3 space-y-1">
            <Link onClick={closeSidebar} href="/seller" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white transition-colors ${pathname === '/seller' ? 'bg-slate-800 text-white' : ''}`}>
              <LayoutDashboard className="w-5 h-5 text-slate-400" /> Dashboard
            </Link>
            <Link onClick={closeSidebar} href="/seller/orders" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white transition-colors ${pathname?.startsWith('/seller/orders') ? 'bg-slate-800 text-white' : ''}`}>
              <ShoppingCart className="w-5 h-5 text-slate-400" /> Orders
            </Link>
            <Link onClick={closeSidebar} href="/seller/products" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white transition-colors ${pathname?.startsWith('/seller/products') ? 'bg-slate-800 text-white' : ''}`}>
              <Package className="w-5 h-5 text-slate-400" /> Products
            </Link>
            <Link onClick={closeSidebar} href="/seller/finance" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white transition-colors ${pathname?.startsWith('/seller/finance') ? 'bg-slate-800 text-white' : ''}`}>
              <DollarSign className="w-5 h-5 text-slate-400" /> Finance Ledger
            </Link>
            <Link onClick={closeSidebar} href="/seller/wallet" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white transition-colors ${pathname?.startsWith('/seller/wallet') ? 'bg-slate-800 text-white' : ''}`}>
              <DollarSign className="w-5 h-5 text-emerald-400" /> Wallet
            </Link>
            <Link onClick={closeSidebar} href="/seller/payouts" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white transition-colors ${pathname?.startsWith('/seller/payouts') ? 'bg-slate-800 text-white' : ''}`}>
              <DollarSign className="w-5 h-5 text-slate-400" /> Payout Account
            </Link>
            <Link onClick={closeSidebar} href="/seller/store" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white transition-colors ${pathname?.startsWith('/seller/store') ? 'bg-slate-800 text-white' : ''}`}>
              <Store className="w-5 h-5 text-slate-400" /> Store Settings
            </Link>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
