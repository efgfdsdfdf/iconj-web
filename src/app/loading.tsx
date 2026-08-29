import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-between py-12">
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
      <div className="mt-auto">
        <p className="text-slate-500 font-medium tracking-wide">Build better. Grow faster.</p>
      </div>
    </div>
  );
}
