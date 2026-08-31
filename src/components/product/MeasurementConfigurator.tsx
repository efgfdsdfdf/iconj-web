"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calculator } from "lucide-react";

export function MeasurementConfigurator({ rules, basePrice, onConfigChange }: { rules: any, basePrice: number, onConfigChange: (config: any) => void }) {
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  
  useEffect(() => {
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    
    let calculatedPrice = basePrice;
    
    if (rules?.pricing_model === 'per_sqm' && w > 0 && h > 0) {
      const sqm = (w / 100) * (h / 100);
      calculatedPrice = Math.max(basePrice * sqm, basePrice); // Minimum 1 sqm
    }
        
    onConfigChange({
      width: w,
      height: h,
      isMotorized: false,
      requiresInstall: false,
      finalPrice: calculatedPrice
    });
  }, [width, height, rules, basePrice]);

  return (
    <div className="bg-slate-50 p-5 rounded-xl border space-y-5">
      <div className="flex items-center gap-2 text-blue-800 font-bold border-b pb-3">
        <Calculator className="w-5 h-5" />
        Custom Measurements (cm)
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Width (cm)</Label>
          <Input 
            type="number" 
            placeholder={`Min: ${rules?.min_width_cm || 0}`} 
            value={width} 
            onChange={e => setWidth(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Height (cm)</Label>
          <Input 
            type="number" 
            placeholder={`Min: ${rules?.min_height_cm || 0}`} 
            value={height} 
            onChange={e => setHeight(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
