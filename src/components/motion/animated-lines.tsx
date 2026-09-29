"use client";

import { useGSAP } from "@gsap/react";
import { useCallback, useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, SplitText } from "@/lib/animations/gsap";

export function AnimatedLines({ children, as: Tag = "p", className, id, start = "top 88%" }: {
  children: ReactNode;
  as?: "p" | "span" | "small" | "div" | "h1" | "h2" | "h3";
  className?: string;
  id?: string;
  start?: string;
}) {
  const element = useRef<HTMLElement>(null);
  const setElement = useCallback((node: HTMLElement | null) => { element.current = node; }, []);

  useGSAP(() => {
    const target = element.current;
    if (!target) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(target, { clearProps: "all" });
      return;
    }
    const split = SplitText.create(target, { type: "lines,words", mask: "lines", linesClass: "alana-motion-line", wordsClass: "alana-motion-word", aria: "auto" });
    gsap.set(split.lines, { yPercent: 108, autoAlpha: 0 });
    const tween = gsap.to(split.lines, { paused: true, yPercent: 0, autoAlpha: 1, duration: 0.9, stagger: 0.08, ease: "power3.out", clearProps: "transform,opacity,visibility", overwrite: true });
    const trigger = ScrollTrigger.create({ trigger: target, start, once: true, invalidateOnRefresh: true, onEnter: () => tween.play() });
    return () => { trigger.kill(); tween.kill(); split.revert(); };
  }, { scope: element });

  const props = { ref: setElement, className, id, "data-animated-lines": true };
  if (Tag === "span") return <span {...props}>{children}</span>;
  if (Tag === "small") return <small {...props}>{children}</small>;
  if (Tag === "div") return <div {...props}>{children}</div>;
  if (Tag === "h1") return <h1 {...props}>{children}</h1>;
  if (Tag === "h2") return <h2 {...props}>{children}</h2>;
  if (Tag === "h3") return <h3 {...props}>{children}</h3>;
  return <p {...props}>{children}</p>;
}
