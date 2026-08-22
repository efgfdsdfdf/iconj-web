"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export function AutoScrollingCategories({ categories }: { categories: { name: string, icon: string }[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animationFrameId: number;
    let lastScrollTime = Date.now();

    const scroll = () => {
      // Throttle slightly for smoother slower movement
      const now = Date.now();
      if (!isPaused && now - lastScrollTime > 16) { // ~60fps
        el.scrollLeft += 1;
        
        // Reset scroll position to create infinite loop illusion
        // We compare to scrollWidth / 2 because we duplicated the array
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
        lastScrollTime = now;
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused]);

  // Duplicate categories to create a seamless infinite loop
  const displayCategories = [...categories, ...categories];

  return (
    <div 
      className="flex overflow-x-auto hide-scrollbar py-3 px-4 gap-4 w-full"
      ref={scrollRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      style={{ scrollBehavior: 'auto' }} // Prevent CSS smooth scrolling from interfering with JS scroll
    >
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
  );
}
