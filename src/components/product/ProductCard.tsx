"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Check } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useState } from "react";

export function ProductCard({ product, hideOnLg = false }: { product: any, hideOnLg?: boolean }) {
  const addItem = useCartStore(state => state.addItem);
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      basePrice: Number(product.base_selling_price) || 0,
      price: Number(product.base_selling_price) || 0,
      quantity: product.moq || 1,
      moq: product.moq || 1,
      pricingTiers: product.pricing_tiers || [],
      storeName: product.stores?.store_name || "ICON Official",
      image: product.images?.[0] || "https://images.unsplash.com/photo-1555252834-406eb1be18f4?w=600&q=80"
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const isFeatured = product.metadata?.is_featured || product.is_featured;
  const isBundle = product.metadata?.is_bundle || product.is_bundle;
  const ageRange = product.metadata?.age_range || product.age_range;
  const isOutOfStock = product.stock_status === "Out of Stock";

  return (
    <div 
      className={`group flex flex-col h-full bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-3 border border-slate-100 ${hideOnLg ? 'hidden lg:flex' : ''} ${isOutOfStock ? 'opacity-75 grayscale-[0.2]' : ''}`}
    >
      <Link href={`/shop/${product.id}`} className="block relative aspect-[4/5] bg-slate-100 rounded mb-3 overflow-hidden">
        <img 
          src={product.images?.[0] || "https://images.unsplash.com/photo-1555252834-406eb1be18f4?w=600&q=80"} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {isOutOfStock && (
            <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wide">
              Out of Stock
            </span>
          )}
          {!isOutOfStock && isFeatured && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
              <Heart className="w-2.5 h-2.5" /> Designer&apos;s Pick
            </span>
          )}
          {!isOutOfStock && isBundle && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
              Bundle
            </span>
          )}
        </div>
      </Link>
      
      <div className="flex-1 flex flex-col">
        <Link href={`/shop/${product.id}`} className="block mb-1">
          {ageRange && (
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">{ageRange}</span>
          )}
          <h3 className="font-bold text-slate-900 text-sm line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{product.name}</h3>
          {product.stores?.store_name && (
            <p className="text-[11px] text-slate-500 mt-1">Sold by <span className="font-semibold text-slate-700">{product.stores.store_name}</span></p>
          )}
        </Link>
        <div className="mt-auto pt-2 flex flex-col gap-2">
          <p className="font-black text-rose-600 text-sm md:text-base">₦{product.base_selling_price?.toLocaleString() || "0"}</p>
          <Button 
            disabled={isOutOfStock}
            className={`w-full text-xs py-1 h-8 shadow-sm flex items-center justify-center gap-1.5 
              ${isOutOfStock ? 'bg-slate-200 text-slate-500 cursor-not-allowed hover:bg-slate-200' 
              : added ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
              : 'bg-slate-900 hover:bg-slate-800 text-white'}`} 
            onClick={handleAddToCart}
          >
            {!isOutOfStock && (added ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />)}
            {isOutOfStock ? 'Out of Stock' : added ? 'Added!' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </div>
  );
}
