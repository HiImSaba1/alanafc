"use client";

import { useGSAP } from "@gsap/react";
import { useRef, type ReactNode } from "react";
import { gsap } from "@/lib/animations/gsap";

export function StaggerReveal({ children, className, selector = "[data-reveal-item]" }: { children: ReactNode; className?: string; selector?: string }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const element = root.current;
    if (!element) return;
    const targets = element.querySelectorAll(selector);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(targets, { clearProps: "all" });
      return;
    }
    gsap.fromTo(targets, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.72, stagger: 0.075, ease: "power3.out", clearProps: "transform,opacity", scrollTrigger: { trigger: element, start: "top 90%", once: true } });
  }, { scope: root, dependencies: [selector] });
  return <div ref={root} className={className}>{children}</div>;
}
