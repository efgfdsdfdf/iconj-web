"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

export function ProductCard({ product, hideOnLg = false }: { product: any, hideOnLg?: boolean }) {
  const addItem = useCartStore(state => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: product.id,
      name: product.name,
      price: product.base_selling_price,
      quantity: 1,
      image: product.images?.[0] || "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80"
    });
  };

  return (
    <Link 
      href={`/shop/${product.id}`} 
      className={`group flex flex-col h-full bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-3 border border-slate-100 ${hideOnLg ? "hidden lg:flex" : ""}`}
    >
      <div className="aspect-square bg-slate-100 rounded mb-3 relative overflow-hidden">
        <img 
          src={product.images?.[0] || "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80"} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
        />
        <span className="absolute top-2 right-2 bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded">-15%</span>
      </div>
      
      <h3 className="font-medium text-sm text-slate-700 line-clamp-2 leading-tight mb-2 group-hover:text-orange-500">{product.name}</h3>
      
      <div className="mt-auto mb-3">
        <span className="text-base font-bold text-slate-900 block">?{Number(product.base_selling_price).toLocaleString()}</span>
        <span className="text-xs text-slate-400 line-through">?{(Number(product.base_selling_price) * 1.15).toLocaleString()}</span>
      </div>

      <Button 
        onClick={handleAddToCart} 
        variant="outline" 
        className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
      >
        <ShoppingCart className="w-4 h-4 mr-2" /> Add
      </Button>
    </Link>
  );
}
