"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function AutoScrollingCategories({ categories, filter }: { categories: { id: string, name: string, icon: string }[], filter?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Multiply categories enough times to fill the screen and allow continuous scrolling
  const displayCategories = [...categories, ...categories, ...categories, ...categories, ...categories, ...categories];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      if (!isPaused && el) {
        el.scrollLeft += (1 * (deltaTime / 16)); // Scroll speed approx 1px per frame (60fps)

        // If we've scrolled past one full set of categories, reset slightly to maintain infinite loop
        // We know the width of one set is approx (scrollWidth / 6) because we duplicated it 6 times.
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = el.scrollWidth / 4; 
        }
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, categories]);

  return (
    <div className="w-full py-3 relative bg-white overflow-hidden group">
      {/* Fading edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      
      <div 
        ref={scrollRef}
        className="flex gap-8 px-4 overflow-x-auto no-scrollbar"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => {
          // Slight delay before resuming auto-scroll after touch
          setTimeout(() => setIsPaused(false), 1000);
        }}
        onWheel={() => {
          setIsPaused(true);
          // Resume after scrolling stops
          setTimeout(() => setIsPaused(false), 1000);
        }}
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
      >
        {displayCategories.map((cat, idx) => (
          <Link 
            key={`${cat.id}-${idx}`} 
            href={`/shop?category=${cat.id}${filter ? `&filter=${filter}` : ''}`} 
            className="flex flex-col items-center gap-2 shrink-0 w-[72px] md:w-[80px]"
          >
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border border-slate-100 hover:border-blue-500 hover:shadow-md transition-all bg-slate-50">
              <img src={cat.icon} alt={cat.name} className="w-full h-full object-cover" />
            </div>
            <span className="text-[10px] md:text-xs font-semibold text-slate-700 text-center leading-tight">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
