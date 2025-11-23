"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./footer";

export function ConditionalFooter() {
  const pathname = usePathname();
  
  // Don't show footer on dashboard pages
  const isDashboard = pathname?.startsWith("/super-admin") || 
                      pathname?.startsWith("/tenant-admin") || 
                      pathname?.startsWith("/cashier") ||
                      pathname?.includes("dashboard");

  if (isDashboard) {
    return null;
  }

  return <Footer />;
}

