"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function ConditionalLayout({ children, hideOnPaths }: { children: ReactNode, hideOnPaths: string[] }) {
  const pathname = usePathname();
  const shouldHide = hideOnPaths.includes(pathname);
  
  if (shouldHide) return null;
  return <>{children}</>;
}
