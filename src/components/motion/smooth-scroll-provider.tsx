"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ScrollTrigger } from "@/lib/animations/gsap";

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("resize", refresh, { passive: true });
    return () => {
      window.removeEventListener("resize", refresh);
    };
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return children;
}
