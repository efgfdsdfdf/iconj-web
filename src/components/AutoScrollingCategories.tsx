"use client";

import Link from "next/link";

export function AutoScrollingCategories({ categories }: { categories: { name: string, icon: string }[] }) {
  // Multiply categories enough times to fill any screen and loop smoothly
  const multipliers = Array.from({ length: 20 });
  const displayCategories = multipliers.flatMap(() => categories);

  return (
    <>
      <style>{`
        @keyframes custom-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); } 
        }
        .animate-custom-marquee {
          display: flex;
          width: max-content;
          animation: custom-marquee 80s linear infinite;
        }
        .animate-custom-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="overflow-hidden w-full py-3 relative bg-white">
        {/* Optional fading edges for better visual effect */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        
        <div className="animate-custom-marquee gap-8 px-4">
          {displayCategories.map((cat, idx) => (
            <Link 
              key={idx} 
              href={`/shop?category=${encodeURIComponent(cat.name)}`} 
              className="flex flex-col items-center gap-2 group shrink-0 w-[72px] md:w-[80px]"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border border-slate-100 group-hover:border-blue-500 group-hover:shadow-md transition-all">
                <img src={cat.icon} alt={cat.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] md:text-xs font-semibold text-slate-700 text-center leading-tight">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
