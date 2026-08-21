"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import { Star, Truck, Check, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ProductDetailsClient({ product, images }: { product: any, images: string[] }) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const [activeImage, setActiveImage] = useState(images[0]);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  // Parse variants or use fallbacks
  const variants = product.variants || {};
  const sizes = variants.sizes?.length > 0 ? variants.sizes : [];
  const motors = variants.motors?.length > 0 ? variants.motors : [];
  const fabrics = variants.fabrics?.length > 0 ? variants.fabrics : [];

  // Local Selection State
  const [selectedSize, setSelectedSize] = useState(sizes[0] || "");
  const [selectedMotor, setSelectedMotor] = useState(motors[0] || "");
  const [selectedFabric, setSelectedFabric] = useState(fabrics[0] || "");

  const handleAddToCart = () => {
    setAdding(true);
    addItem({
      id: product.id,
      name: product.name,
      price: product.base_selling_price,
      quantity: qty,
      width: selectedSize || "Standard",
      height: selectedSize || "Standard",
      motorType: selectedMotor || "Manual",
      image: images[0],
    });
    setTimeout(() => {
      setAdding(false);
      router.push("/cart");
    }, 500);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-8 lg:gap-12">
      {/* Left: Image Gallery */}
      <div className="w-full lg:w-1/2 flex flex-col gap-4">
        <div className="aspect-square bg-slate-50 rounded-lg overflow-hidden border">
          <img src={activeImage} alt={product.name} className="w-full h-full object-cover" />
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {images.map((img: string, idx: number) => (
              <button 
                key={idx} 
                onClick={() => setActiveImage(img)}
                className={`w-20 h-20 shrink-0 rounded-md overflow-hidden border-2 transition-colors ${activeImage === img ? "border-orange-500" : "border-transparent opacity-70 hover:opacity-100"}`}
              >
                <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Product Info & Configurator */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <div className="mb-2 flex items-center gap-2">
          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Official Store</span>
          {product.stock_status === "In Stock" ? (
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded">In Stock</span>
          ) : (
            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded">{product.stock_status || "Pre-order"}</span>
          )}
        </div>
        
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2 leading-tight">{product.name}</h1>
        
        <div className="flex items-center gap-2 mb-4">
          <div className="flex text-amber-400">
            <Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current text-slate-200"/>
          </div>
          <a href="#" className="text-sm text-blue-600 hover:underline">12 Verified Ratings</a>
          <span className="text-slate-300">|</span>
          <span className="text-sm text-slate-500">SKU: {product.sku}</span>
        </div>

        <div className="mb-6 pb-6 border-b">
          <div className="flex items-end gap-3">
            <span className="text-3xl md:text-4xl font-black text-slate-900">₦{Number(product.base_selling_price).toLocaleString()}</span>
            <span className="text-lg text-slate-400 line-through mb-1">₦{(Number(product.base_selling_price) * 1.15).toLocaleString()}</span>
            <span className="bg-orange-100 text-orange-600 text-sm font-bold px-2 py-1 rounded mb-1.5 ml-2">-15%</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">+ delivery charges depending on location</p>
        </div>

        {/* Dynamic Configurator */}
        <div className="space-y-6 mb-8">
          
          {sizes.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-bold text-slate-900">Select Size / Dimension</Label>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s: string, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedSize(s)}
                    className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${selectedSize === s ? "border-orange-500 bg-orange-50 text-orange-700" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {motors.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-bold text-slate-900">Select Motor Type</Label>
              <div className="flex flex-wrap gap-2">
                {motors.map((m: string, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedMotor(m)}
                    className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${selectedMotor === m ? "border-orange-500 bg-orange-50 text-orange-700" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {fabrics.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-bold text-slate-900">Select Fabric</Label>
              <div className="flex flex-wrap gap-2">
                {fabrics.map((f: string, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedFabric(f)}
                    className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${selectedFabric === f ? "border-orange-500 bg-orange-50 text-orange-700" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-base font-bold text-slate-900">Quantity</Label>
            <div className="flex items-center w-32 h-10 border rounded-md overflow-hidden">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 text-slate-600 border-r"><Minus className="w-4 h-4"/></button>
              <div className="flex-1 h-full flex items-center justify-center font-bold text-slate-900">{qty}</div>
              <button onClick={() => setQty(qty + 1)} className="w-10 h-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 text-slate-600 border-l"><Plus className="w-4 h-4"/></button>
            </div>
          </div>
        </div>

        {product.requires_quote ? (
          <Button size="lg" onClick={() => router.push("/quote")} className="w-full h-14 text-lg font-bold bg-slate-900 hover:bg-slate-800 shadow-xl rounded-md uppercase tracking-wider">
            Request Custom Quote
          </Button>
        ) : (
          <Button 
            size="lg" 
            onClick={handleAddToCart} 
            disabled={adding}
            className="w-full h-14 text-lg font-bold bg-orange-500 hover:bg-orange-600 shadow-xl rounded-md shadow-orange-500/20 uppercase tracking-wider"
          >
            {adding ? "Adding to Cart..." : "Add to Cart"}
          </Button>
        )}
      </div>
    </div>
  );
}
