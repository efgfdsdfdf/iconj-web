"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export function SplashScreen() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Check if we already showed the splash screen in this session
    let hasSeenSplash = null;
    try { hasSeenSplash = sessionStorage.getItem("hasSeenSplash"); } catch(e) {}
    
    if (hasSeenSplash) {
      setShowSplash(false);
    } else {
      // Show for 2 seconds, then fade out
      const timer = setTimeout(() => {
        setShowSplash(false);
        try { sessionStorage.setItem("hasSeenSplash", "true"); } catch(e) {}
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showSplash) return null;

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-between py-12 animate-out fade-out duration-500 fill-mode-forwards" style={{ animationDelay: '1.5s' }}>
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Blue Circle Icon */}
        <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center shadow-lg mb-8">
          <span className="text-white font-bold text-2xl tracking-wider">ICONJ</span>
        </div>
        
        {/* Loading Indicator */}
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-sm font-medium text-slate-500 animate-pulse uppercase tracking-widest">Loading</p>
      </div>
      
      {/* Slogan at the bottom */}
      <div className="mt-auto pb-8">
        <p className="text-slate-500 font-medium tracking-wide">Build better. Grow faster.</p>
      </div>
    </div>
  );
}
