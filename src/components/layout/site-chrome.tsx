"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PageTransition } from "@/components/motion/page-transition";
import { SmoothScrollProvider } from "@/components/motion/smooth-scroll-provider";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { CookieBanner } from "./cookie-banner";
import type { OwnerPublicSite } from "@/features/site-settings/owner-content-contract";

export function SiteChrome({ children, site }: { children: ReactNode; site: OwnerPublicSite }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return children;
  return <SmoothScrollProvider><PageTransition /><a className="skip-link" href="#main-content">Μετάβαση στο κύριο περιεχόμενο</a><SiteHeader site={site} />{children}<SiteFooter site={site} /><CookieBanner /></SmoothScrollProvider>;
}
