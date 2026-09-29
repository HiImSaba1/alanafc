"use client";

import { useGSAP } from "@gsap/react";
import { useRef, type ReactNode } from "react";
import { gsap } from "@/lib/animations/gsap";

export function ParallaxMedia({ children, className = "", strength = 10, disabled = false }: { children: ReactNode; className?: string; strength?: number; disabled?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const container = root.current;
    const image = container?.querySelector<HTMLElement>("img");
    if (!container || !image || disabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const amount = Math.max(4, Math.min(strength, 14));
    gsap.set(image, { scale: 1.16, transformOrigin: "center center", willChange: "transform" });
    const animation = gsap.fromTo(image, { yPercent: -amount }, { yPercent: amount, ease: "none", scrollTrigger: { trigger: container, start: "top bottom", end: "bottom top", scrub: 0.65, invalidateOnRefresh: true } });
    return () => { animation.kill(); gsap.set(image, { clearProps: "transform,willChange" }); };
  }, { scope: root, dependencies: [disabled, strength], revertOnUpdate: true });
  return <div ref={root} className={`parallax-media ${className}`.trim()}>{children}</div>;
}
