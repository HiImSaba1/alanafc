"use client";

import { useGSAP } from "@gsap/react";
import { useRef, type ReactNode } from "react";
import { gsap } from "@/lib/animations/gsap";
import { clipInset, type ClipDirection } from "@/lib/animations/motion-contract";

export function ClipReveal({ children, className, direction = "bottom" }: {
  children: ReactNode;
  className?: string;
  direction?: ClipDirection;
}) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const element = root.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(element, { clearProps: "all" });
      return;
    }
    const from = clipInset(direction);
    gsap.fromTo(element, { clipPath: from }, { clipPath: "inset(0% 0 0 0)", duration: 1, ease: "power4.inOut", clearProps: "willChange", scrollTrigger: { trigger: element, start: "top 90%", once: true, invalidateOnRefresh: true } });
  }, { scope: root, dependencies: [direction] });
  return <div ref={root} className={className} data-clip-reveal>{children}</div>;
}
