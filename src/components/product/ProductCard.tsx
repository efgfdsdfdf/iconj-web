"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart } from "lucide-react";
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
      image: product.images?.[0] || "https://images.unsplash.com/photo-1555252834-406eb1be18f4?w=600&q=80"
    });
  };

  const isFeatured = product.metadata?.is_featured || product.is_featured;
  const isBundle = product.metadata?.is_bundle;
  const ageRange = product.metadata?.age_range;

  return (
    <Link 
      href={`/shop/${product.id}`} 
      className={`group flex flex-col h-full bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-3 border border-slate-100 ${hideOnLg ? 'hidden lg:flex' : ''}`}
    >
      <div className="aspect-[4/5] bg-slate-100 rounded mb-3 relative overflow-hidden">
        <img 
          src={product.images?.[0] || "https://images.unsplash.com/photo-1555252834-406eb1be18f4?w=600&q=80"} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isFeatured && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
              <Heart className="w-2.5 h-2.5" /> Mother's Pick
            </span>
          )}
          {isBundle && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
              Bundle
            </span>
          )}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        {ageRange && (
          <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">{ageRange}</span>
        )}
        <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-2 leading-tight">{product.name}</h3>
        <div className="mt-auto pt-2 flex flex-col gap-2">
          <p className="font-black text-rose-600 text-sm md:text-base">₦{product.base_selling_price?.toLocaleString() || "0"}</p>
          <Button 
            className="w-full bg-slate-900 hover:bg-slate-800 text-xs py-1 h-8 shadow-sm flex items-center justify-center gap-1.5" 
            onClick={handleAddToCart}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Add to Cart
          </Button>
        </div>
      </div>
    </Link>
  );


}