"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function SearchBar({ isMobile = false }: { isMobile?: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("id, name, category, images, base_selling_price")
        .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(5);
        
      setResults(data || []);
      setIsOpen(true);
      setLoading(false);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query, supabase]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    router.push(`/shop?q=${encodeURIComponent(query)}`);
  };

  if (isMobile) {
    return (
      <div className="relative w-full" ref={wrapperRef}>
        <form onSubmit={handleSearch} className="w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Search products..." 
            className="w-full pl-10 border-slate-200 bg-slate-100" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim() && setIsOpen(true)}
          />
        </form>
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-md shadow-xl border border-slate-100 overflow-hidden z-50">
            {loading ? (
              <div className="p-4 flex justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
            ) : results.length > 0 ? (
              <ul>
                {results.map(product => (
                  <li key={product.id} className="border-b last:border-0 border-slate-50">
                    <Link href={`/shop/${product.id}`} className="flex items-center gap-3 p-3 hover:bg-slate-50" onClick={() => setIsOpen(false)}>
                      <div className="w-10 h-10 bg-slate-100 rounded overflow-hidden shrink-0">
                        {product.images && product.images[0] && (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                        <p className="text-xs text-slate-500 truncate">{product.category}</p>
                      </div>
                    </Link>
                  </li>
                ))}
                <li className="bg-slate-50">
                  <button onClick={handleSearch} className="w-full text-center p-3 text-sm font-bold text-blue-600 hover:text-blue-700">
                    See all results for "{query}"
                  </button>
                </li>
              </ul>
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">No products found.</div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full flex" ref={wrapperRef}>
      <form onSubmit={handleSearch} className="w-full flex">
        <div className="relative flex-1">
          <Input 
            type="search" 
            placeholder="Search products, brands and categories..." 
            className="w-full pl-10 pr-4 py-6 border-2 border-slate-200 rounded-l-md rounded-r-none focus-visible:ring-0 focus-visible:border-blue-600 text-base" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim() && setIsOpen(true)}
          />
          <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
        </div>
        <Button type="submit" className="rounded-l-none rounded-r-md px-8 py-6 bg-blue-600 hover:bg-blue-700 shadow-none text-base uppercase font-bold tracking-wider">
          Search
        </Button>
      </form>

      {isOpen && (
        <div className="absolute top-[110%] left-0 right-0 bg-white rounded-lg shadow-2xl border border-slate-100 overflow-hidden z-50">
          {loading ? (
            <div className="p-6 flex justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : results.length > 0 ? (
            <ul>
              {results.map(product => (
                <li key={product.id} className="border-b border-slate-50">
                  <Link href={`/shop/${product.id}`} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors" onClick={() => setIsOpen(false)}>
                    <div className="w-14 h-14 bg-slate-100 rounded overflow-hidden shrink-0 border border-slate-200">
                      {product.images && product.images[0] && (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-slate-900 truncate">{product.name}</p>
                      <p className="text-sm text-slate-500 truncate">{product.category}</p>
                    </div>
                    <div className="font-bold text-orange-600">
                      ₦{product.base_selling_price.toLocaleString()}
                    </div>
                  </Link>
                </li>
              ))}
              <li className="bg-slate-50 border-t">
                <button onClick={handleSearch} className="w-full text-center p-4 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors uppercase tracking-wider">
                  See all results for "{query}"
                </button>
              </li>
            </ul>
          ) : (
            <div className="p-6 text-center text-slate-500">
              No products found matching "{query}". Try checking your spelling or using more general terms.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
