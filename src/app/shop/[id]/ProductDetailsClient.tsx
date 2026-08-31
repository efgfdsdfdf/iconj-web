"use client";
import React from 'react';

import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, Truck, Check, Minus, Plus, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { MeasurementConfigurator } from "@/components/product/MeasurementConfigurator";

export function ProductDetailsClient({ product, images, rules }: { product: any, images: string[], rules?: any }) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const [activeImage, setActiveImage] = useState(images[0]);
  
  // Inject default custom measurement rules for blinds/shades if missing
  const isBlindOrShade = product.name?.toLowerCase().includes('blind') || product.name?.toLowerCase().includes('shade') || product.name?.toLowerCase().includes('curtain');
  
  // Memoize to prevent infinite re-renders!
  const activeRules = React.useMemo(() => {
    return rules || (isBlindOrShade ? {
      pricing_model: "per_sqm",
      min_width_cm: 30,
      max_width_cm: 300,
      min_height_cm: 30,
      max_height_cm: 300,
      motorization_available: true,
      motorization_fee: 15000,
      installation_available: true,
      base_installation_fee: 5000
    } : null);
  }, [rules, isBlindOrShade]);
  const moq = product.moq || 1;
  const pricingTiers = product.pricing_tiers || [];
  const [qty, setQty] = useState(moq);
  const [adding, setAdding] = useState(false);

  const getCurrentPrice = () => {
    const basePrice = Number(product.base_selling_price) || 0;
    if (!pricingTiers || pricingTiers.length === 0) return basePrice;
    
    const sortedTiers = [...pricingTiers].sort((a: any, b: any) => b.minQty - a.minQty);
    for (const tier of sortedTiers) {
      if (qty >= tier.minQty) {
        return tier.price;
      }
    }
    return basePrice;
  };
  
  const currentPrice = getCurrentPrice();

  // Parse variants or use fallbacks
  const variants = product.variants || {};
  const colors = variants.colors?.length > 0 ? variants.colors : [];
  const sizes = variants.sizes?.length > 0 ? variants.sizes : [];
  const motors = variants.motors?.length > 0 ? variants.motors : [];
  const fabrics = variants.fabrics?.length > 0 ? variants.fabrics : [];

  // Local Selection State
  const [selectedColor, setSelectedColor] = useState(colors[0] || "");
  const [selectedSize, setSelectedSize] = useState(sizes[0] || "");
  const [selectedMotor, setSelectedMotor] = useState(motors[0] || "");
  const [selectedFabric, setSelectedFabric] = useState(fabrics[0] || "");
  const [customConfig, setCustomConfig] = useState<any>(null);
  const [customNotes, setCustomNotes] = useState("");

  const handleAddToCart = () => {
    setAdding(true);
    addItem({
      id: product.id,
      name: product.name,
      basePrice: Number(product.base_selling_price) || 0,
      price: customConfig ? customConfig.finalPrice : currentPrice,
      quantity: qty,
      moq: moq,
      pricingTiers: pricingTiers,
      storeName: product.stores?.store_name || "ICON Official",
      width: customConfig ? `${customConfig.width}cm` : (selectedSize || "Standard"),
      height: customConfig ? `${customConfig.height}cm` : (selectedSize || "Standard"),
      motorType: customConfig?.isMotorized ? "Motorized" : (selectedMotor || "Manual"),
      fabric: selectedFabric || "",
      selectedVariant: selectedFabric || "",
      customNotes: customNotes || "",
      image: images[0],
      requiresInstall: customConfig?.requiresInstall || false,
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
          {activeImage?.match(/\\.(mp4|webm|ogg|mov)(\\?.*)?$/i) ? (
            <video src={activeImage} className="w-full h-full object-cover" autoPlay muted loop playsInline controls />
          ) : (
            <img src={activeImage} alt={product.name} className="w-full h-full object-cover" />
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {images.map((img: string, idx: number) => (
              <button 
                key={idx} 
                onClick={() => setActiveImage(img)}
                className={`w-20 h-20 shrink-0 rounded-md overflow-hidden border-2 transition-colors ${activeImage === img ? "border-orange-500" : "border-transparent opacity-70 hover:opacity-100"}`}
              >
                {img.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) ? (
                  <video src={img} className="w-full h-full object-cover" />
                ) : (
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Product Info & Configurator */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <div className="mb-2 flex items-center gap-2">
          {product.stores?.store_name ? (
            <Link href={`/store/${product.stores.slug}`} className="bg-orange-100 hover:bg-orange-200 transition-colors text-orange-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
              {product.stores.store_name}
            </Link>
          ) : (
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Official Store</span>
          )}
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
          {product.brand && (
            <>
              <span className="text-slate-300">|</span>
              <span className="text-sm text-slate-500">Brand: <span className="font-semibold text-slate-900">{product.brand}</span></span>
            </>
          )}
        </div>

        <div className="mb-6 pb-6 border-b">
          <div className="flex flex-col gap-2">
            <div className="flex items-end gap-3">
              <span className="text-3xl md:text-4xl font-black text-slate-900">
                ₦{(customConfig ? customConfig.finalPrice : currentPrice).toLocaleString()}
              </span>
              <span className="text-sm font-semibold text-slate-500 mb-1.5">
                '/ unit'
              </span>
            </div>
            
            {pricingTiers.length > 0 && (
              <div className="mt-4 bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                <p className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                  Wholesale Pricing Tiers
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {pricingTiers.map((tier: any, idx: number) => {
                    const isActive = qty >= tier.minQty && (!tier.maxQty || qty <= tier.maxQty);
                    return (
                      <div key={idx} className={`p-2 rounded border text-center ${isActive ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-500' : 'bg-white/60 border-slate-200'}`}>
                        <div className="text-xs font-semibold text-slate-600 mb-1">
                          {tier.minQty} {tier.maxQty ? `- ${tier.maxQty}` : '+'} units
                        </div>
                        <div className={`font-bold ${isActive ? 'text-blue-700' : 'text-slate-900'}`}>
                          ₦{tier.price.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {moq > 1 && (
              <p className="text-sm font-medium text-orange-600 mt-2">Minimum Order Quantity: {moq} units</p>
            )}
          </div>
        </div>

        {/* Dynamic Configurator */}
        <div className="space-y-6 mb-8">
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-md shadow-sm">
                <Ruler className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Need a perfect fit?</h4>
                <p className="text-xs text-slate-600 mt-0.5">Learn how to accurately measure your windows.</p>
              </div>
            </div>
            <Dialog>
              <DialogTrigger className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-white border border-amber-200 px-3 py-1.5 rounded hover:bg-amber-100 transition-colors">
                Guide
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">How to Measure</DialogTitle>
                  <DialogDescription>
                    Follow our simple guide to get the perfect fit for your window.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 md:grid-cols-2 mt-4">
                  <div className="border rounded-lg p-5">
                    <h3 className="font-bold flex items-center gap-2 mb-3"><Ruler className="w-4 h-4 text-amber-600"/> Inside Mount (Recess)</h3>
                    <p className="text-sm text-slate-600 mb-3">For a clean, built-in look where the blind fits inside the window frame.</p>
                    <ul className="text-sm list-disc pl-4 space-y-2 text-slate-600 mb-4">
                      <li><strong>Width:</strong> Measure inside width at top, middle, and bottom. Use narrowest.</li>
                      <li><strong>Drop:</strong> Measure inside length at left, middle, right. Use longest.</li>
                    </ul>
                    <div className="bg-blue-50 p-3 rounded text-xs text-blue-800 flex gap-2">
                      <Info className="w-4 h-4 shrink-0" />
                      Do not make deductions. The factory will make them to ensure it fits perfectly.
                    </div>
                  </div>
                  <div className="border rounded-lg p-5">
                    <h3 className="font-bold flex items-center gap-2 mb-3"><Ruler className="w-4 h-4 text-amber-600"/> Outside Mount (Exact)</h3>
                    <p className="text-sm text-slate-600 mb-3">The blind sits outside the frame to make the window look larger or block maximum light.</p>
                    <ul className="text-sm list-disc pl-4 space-y-2 text-slate-600 mb-4">
                      <li><strong>Width:</strong> Add at least 10cm to each side past the window frame to minimize light gap.</li>
                      <li><strong>Drop:</strong> Measure from where headrail will sit, down to where blind finishes.</li>
                    </ul>
                    <div className="bg-amber-50 p-3 rounded text-xs text-amber-800 flex gap-2">
                      <Info className="w-4 h-4 shrink-0" />
                      We will make the blind exactly to your measurements. No deductions will be made.
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          
          {activeRules ? (
            <MeasurementConfigurator 
              rules={activeRules} 
              basePrice={Number(product.base_selling_price) || 0} 
              onConfigChange={setCustomConfig} 
            />
          ) : (sizes.length > 0 || colors.length > 0) && (
            <div className="space-y-6">
              
              {colors.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-base font-bold text-slate-900">Select Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((c: string, idx: number) => (
                      <button 
                        key={idx} 
                        onClick={() => setSelectedColor(c)}
                        className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${selectedColor === c ? "border-orange-500 bg-orange-50 text-orange-700" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
            <Label className="text-base font-bold text-slate-900">Customization / Delivery Notes (Optional)</Label>
            <textarea 
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Please ensure proper packaging, or specific customization request..."
              className="w-full border rounded-md p-3 text-sm min-h-[80px] focus:ring-1 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-bold text-slate-900">Quantity</Label>
            <div className="flex flex-col gap-1 w-1/3">
              <div className="flex items-center border rounded-md h-12 bg-white">
                <button 
                  onClick={() => setQty(Math.max(moq, qty - 1))} 
                  disabled={qty <= moq}
                  className={`p-2 transition-colors ${qty <= moq ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-slate-100 text-slate-600'}`}
                >
                  <Minus className="w-5 h-5" />
                </button>
                <input 
                  type="number"
                  min={moq}
                  value={qty}
                  onChange={(e) => setQty(Math.max(moq, parseInt(e.target.value) || moq))}
                  className="w-full text-center py-2 font-medium bg-slate-50 border-x focus:outline-none" 
                />
                <button onClick={() => setQty(qty + 1)} className="p-2 hover:bg-slate-100 text-slate-600 transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
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
            disabled={adding || product.stock_status === "Out of Stock"}
            className={`w-full h-14 text-lg font-bold shadow-xl rounded-md uppercase tracking-wider ${
              product.stock_status === "Out of Stock" 
                ? "bg-slate-200 text-slate-500 cursor-not-allowed hover:bg-slate-200" 
                : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20"
            }`}
          >
            {product.stock_status === "Out of Stock" ? "Out of Stock" : adding ? "Adding to Cart..." : "Add to Cart"}
          </Button>
        )}
      </div>
    </div>
  );
}
