"use client";

import { Search } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function LiveSearch({ placeholder = "Search..." }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="relative flex-1 sm:w-64">
      <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
      <input
        type="search"
        defaultValue={searchParams.get("search")?.toString() || ""}
        onChange={(e) => {
          if ((window as any).searchTimeout) clearTimeout((window as any).searchTimeout);
          (window as any).searchTimeout = setTimeout(() => {
            handleSearch(e.target.value);
          }, 400); // 400ms debounce
        }}
        placeholder={placeholder}
        className="w-full pl-10 h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
      />
    </div>
  );
}
