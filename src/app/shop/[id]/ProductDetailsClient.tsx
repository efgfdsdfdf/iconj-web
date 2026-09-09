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
      installation_available: false,
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
  const [customNotes, setCustomNotes] = useState("");
  const [purchaseMode, setPurchaseMode] = useState<"standard" | "custom">("standard");
  const [customConfig, setCustomConfig] = useState<any>(null);

  const [shippingEstimate, setShippingEstimate] = useState<number | null>(null);
  const [shippingStatus, setShippingStatus] = useState<string>("CALCULATING");

  React.useEffect(() => {
    // Fire tracking event for product view — both legacy and new analytics endpoint
    const body = JSON.stringify({
      event_type: 'VIEWED_PRODUCT',
      metadata: { product_id: product.id, name: product.name }
    });
    fetch('/api/marketing/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }).catch(() => {});

    // New analytics endpoint — supports guests + UTM attribution
    fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'product_view',
        sessionId: sessionStorage.getItem('iconj_session_id') || '',
        properties: {
          product_id: product.id,
          product_name: product.name,
          category: product.category,
          price: product.base_selling_price,
        },
        idempotencyKey: `pv_${product.id}_${sessionStorage.getItem('iconj_session_id') || ''}_${Date.now().toString().slice(0, -3)}`,
      }),
    }).catch(() => {});
  }, [product.id, product.name]);

  React.useEffect(() => {
    let isCancelled = false;
    const fetchShipping = async () => {
      setShippingStatus("CALCULATING");
      try {
        const isCustomSize = purchaseMode === "custom" || selectedSize?.toLowerCase().includes("custom") || (customConfig && customConfig.width > 0);
        const res = await fetch("/api/shipping/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: product.id, quantity: qty, is_custom_size: isCustomSize })
        });
        const data = await res.json();
        
        if (!isCancelled) {
          if (data.status === 'CUSTOM_REQUIRED' || data.status === 'MISSING_DATA' || data.status === 'NO_RATES' || data.error) {
            setShippingStatus("BLOCKED");
          } else {
            setShippingEstimate(data.customerShippingPrice);
            setShippingStatus("READY");
          }
        }
      } catch (e) {
        if (!isCancelled) setShippingStatus("ERROR");
      }
    };
    
    const timeoutId = setTimeout(fetchShipping, 300); // debounce
    return () => { isCancelled = true; clearTimeout(timeoutId); };
  }, [product.id, qty, purchaseMode, customConfig, selectedSize]);

  const handleAddToCart = () => {
    setAdding(true);
    
    // Fire tracking event (legacy marketing events)
    fetch('/api/marketing/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'ADDED_TO_CART',
        metadata: { product_id: product.id, name: product.name, price: currentPrice, quantity: qty }
      })
    }).catch(() => {});

    // New analytics endpoint — supports guests + UTM attribution
    fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'add_to_cart',
        sessionId: sessionStorage.getItem('iconj_session_id') || '',
        properties: {
          product_id: product.id,
          product_name: product.name,
          price: currentPrice,
          quantity: qty,
          purchase_mode: purchaseMode,
        },
      }),
    }).catch(() => {});

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
            {product.variants?.compare_at_price > 0 && product.variants?.compare_at_price > currentPrice && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg text-slate-400 line-through decoration-1">
                  ₦{Number(product.variants.compare_at_price).toLocaleString()}
                </span>
                <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded">
                  -{Math.round(((product.variants.compare_at_price - currentPrice) / product.variants.compare_at_price) * 100)}%
                </span>
              </div>
            )}
            <div className="flex items-end gap-3">
              <span className="text-3xl md:text-4xl font-black text-slate-900">
                ₦{(customConfig ? customConfig.finalPrice : currentPrice).toLocaleString()}
              </span>
              <span className="text-sm font-bold text-slate-500 mb-1.5">
                / unit
              </span>
            </div>

            {shippingStatus === "CALCULATING" ? (
              <p className="text-sm text-slate-500 mt-2">Calculating shipping...</p>
            ) : shippingStatus === "READY" ? (
              <div className="flex items-center gap-2 mt-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md inline-flex border border-emerald-100 max-w-max">
                <Truck className="w-4 h-4" />
                <span className="font-medium">Estimated DDP Shipping: ₦{shippingEstimate?.toLocaleString()}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2 text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md inline-flex border border-amber-100 max-w-max">
                <Truck className="w-4 h-4" />
                <span className="font-medium">Shipping calculated at checkout</span>
              </div>
            )}
            
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
                      Do not make deductions. The supplier will make them to ensure it fits perfectly.
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

          
          {activeRules && (
            <div className="mb-6 flex p-1 bg-slate-100 rounded-lg w-full max-w-sm">
              <button 
                onClick={() => setPurchaseMode("standard")}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${purchaseMode === "standard" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
              >
                Standard Option
              </button>
              <button 
                onClick={() => setPurchaseMode("custom")}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${purchaseMode === "custom" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
              >
                Customize Measurements
              </button>
            </div>
          )}

          {activeRules && purchaseMode === "custom" && (
            <div className="mb-6">
              <MeasurementConfigurator 
                rules={activeRules} 
                basePrice={Number(product.base_selling_price) || 0} 
                onConfigChange={setCustomConfig} 
              />
            </div>
          )}
          
          {(sizes.length > 0 || colors.length > 0) && (
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

              {sizes.length > 0 && purchaseMode === "standard" && (
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
                      Do not make deductions. The supplier will make them to ensure it fits perfectly.
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

          
          {activeRules && (
            <div className="mb-6 flex p-1 bg-slate-100 rounded-lg w-full max-w-sm">
              <button 
                onClick={() => setPurchaseMode("standard")}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${purchaseMode === "standard" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
              >
                Standard Option
              </button>
              <button 
                onClick={() => setPurchaseMode("custom")}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${purchaseMode === "custom" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
              >
                Customize Measurements
              </button>
            </div>
          )}

          {activeRules && purchaseMode === "custom" && (
            <div className="mb-6">
              <MeasurementConfigurator 
                rules={activeRules} 
                basePrice={Number(product.base_selling_price) || 0} 
                onConfigChange={setCustomConfig} 
              />
            </div>
          )}
          
          {(sizes.length > 0 || colors.length > 0) && (
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

              {sizes.length > 0 && purchaseMode === "standard" && (
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

          <div className="flex gap-4">
            {(product.requires_quote || purchaseMode === "custom" || (customConfig && customConfig.width > 0) || selectedSize?.toLowerCase().includes("custom")) ? (
              <>
                <Button size="lg" onClick={() => {
                  let url = "/quote?product_id=" + product.id + "&product_name=" + encodeURIComponent(product.name);
                  if (customConfig) {
                     url += `&width=${customConfig.width}&height=${customConfig.height}&motorized=${customConfig.isMotorized}`;
                  }
                  if (customNotes) {
                     url += `&notes=${encodeURIComponent(customNotes)}`;
                  }
                  router.push(url);
                }} className="flex-1 h-14 text-lg font-bold bg-slate-900 hover:bg-slate-800 shadow-xl rounded-md uppercase tracking-wider">
                  Request Custom Quote
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={async () => {
                    const res = await fetch('/api/wishlist', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ productId: product.id })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      alert(data.action === 'added' ? 'Added to wishlist!' : 'Removed from wishlist!');
                    } else {
                      router.push('/login');
                    }
                  }}
                  className="h-14 w-14 border-slate-300 text-slate-700 hover:bg-slate-50"
                  title="Save to Wishlist"
                >
                  <Heart className="w-6 h-6" />
                </Button>
              </>
            ) : (
              <div className="flex-1 flex flex-col gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="font-semibold text-slate-900 mb-1">Standard Product Order</p>
                  <p className="text-sm text-slate-600 mb-2">Select your preferred standard options before placing your order.</p>
                  <p className="text-xs text-slate-500 italic">Please note: ICONJ currently provides the products only. Installation is not included.</p>
                </div>
                <div className="flex gap-4">
                  <Button 
                    size="lg" 
                    onClick={handleAddToCart} 
                    disabled={adding || product.stock_status === "Out of Stock"}
                    className={`flex-1 h-14 text-lg font-bold shadow-xl rounded-md uppercase tracking-wider ${
                      product.stock_status === "Out of Stock" 
                        ? "bg-slate-200 text-slate-500 cursor-not-allowed hover:bg-slate-200" 
                        : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20"
                    }`}
                  >
                    {product.stock_status === "Out of Stock" ? "Out of Stock" : adding ? "Adding..." : "Add to Cart"}
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={async () => {
                      const res = await fetch('/api/wishlist', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ productId: product.id })
                      });
                      if (res.ok) {
                        const data = await res.json();
                        alert(data.action === 'added' ? 'Added to wishlist!' : 'Removed from wishlist!');
                      } else {
                        router.push('/login');
                      }
                    }}
                    className="h-14 px-6 border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                    title="Save to Wishlist"
                  >
                    <Heart className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
