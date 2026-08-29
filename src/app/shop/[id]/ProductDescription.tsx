"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function ProductDescription({ product }: { product: any }) {
  const [open, setOpen] = useState(false);
  
  const hasFeatures = product.features?.length > 0;
  const hasSpecs = product.specifications?.length > 0;
  const descriptionText = product.description || "No description provided.";
  
  // Decide if it's long enough to need truncation
  // A rough estimate: if description is > 300 chars, or if there are many specs
  const isLong = descriptionText.length > 300 || (product.specifications?.length > 4);

  const FullContent = () => (
    <div className="space-y-8">
      <div 
        className="text-slate-700 leading-relaxed text-sm md:text-base prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: descriptionText }}
      />

      {(hasFeatures || hasSpecs) && (
        <div className="pt-6 border-t mt-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b">Product Details</h2>
          
          {hasFeatures && (
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 mb-3">Key Features</h3>
              <ul className="grid sm:grid-cols-2 gap-3">
                {product.features.map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasSpecs && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Specifications</h3>
              <div className="border rounded-md overflow-hidden shadow-sm">
                {product.specifications.map((spec: any, idx: number) => (
                  <div key={idx} className={`flex text-sm ${idx % 2 === 0 ? "bg-slate-50" : "bg-white"} border-b last:border-0`}>
                    <div className="w-1/3 py-3 px-4 font-bold text-slate-700 border-r">{spec.key}</div>
                    <div className="w-2/3 py-3 px-4 text-slate-600">{spec.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 relative">
      <h2 className="text-xl font-bold text-slate-900 mb-4 pb-4 border-b">Product Description</h2>
      
      <div className={`relative ${isLong ? 'max-h-[400px] overflow-hidden' : ''}`}>
        <FullContent />
        
        {isLong && (
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent flex items-end justify-center pb-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger className="bg-white border border-slate-300 text-blue-600 font-semibold shadow-md rounded-full px-8 py-2.5 hover:bg-blue-50 transition-colors">
                See More Details
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold border-b pb-4 mb-4">Product Overview</DialogTitle>
                </DialogHeader>
                <FullContent />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}
