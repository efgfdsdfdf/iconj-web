"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function ConditionalLayout({ children, hideOnPaths }: { children: ReactNode, hideOnPaths: string[] }) {
  const pathname = usePathname();
  const shouldHide = hideOnPaths.some(path => 
    path.endsWith('/*') 
      ? pathname.startsWith(path.replace('/*', '')) 
      : pathname === path
  );
  
  if (shouldHide) return null;
  return <>{children}</>;
}
