"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { removeLegacyEmojiImages } from "@/features/content/core";
import { gsap, ScrollTrigger, SplitText } from "@/lib/animations/gsap";

export function RichContent({ html }: { html: string }) {
  const root = useRef<HTMLDivElement>(null);
  const cleanHtml = removeLegacyEmojiImages(html);
  useGSAP(() => {
    const container = root.current;
    if (!container || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const imageAnimations = [...container.querySelectorAll<HTMLImageElement>("img")].map((image) => {
      gsap.set(image, { scale: 1.14, transformOrigin: "center", willChange: "transform" });
      return gsap.fromTo(image, { yPercent: -7 }, { yPercent: 7, ease: "none", scrollTrigger: { trigger: image, start: "top bottom", end: "bottom top", scrub: 0.7, invalidateOnRefresh: true } });
    });
    const textTargets = [...container.querySelectorAll<HTMLElement>("p, h2, h3, h4, li, blockquote, figcaption")].filter((target) => target.textContent?.trim()).slice(0, 100);
    const textAnimations = textTargets.map((target) => {
      const split = SplitText.create(target, { type: "lines,words", mask: "lines", linesClass: "alana-motion-line", wordsClass: "alana-motion-word", aria: "auto" });
      gsap.set(split.lines, { yPercent: 105, autoAlpha: 0 });
      const tween = gsap.to(split.lines, { paused: true, yPercent: 0, autoAlpha: 1, duration: 0.82, stagger: 0.065, ease: "power3.out", clearProps: "transform,opacity,visibility", overwrite: true });
      const trigger = ScrollTrigger.create({ trigger: target, start: "top 90%", once: true, invalidateOnRefresh: true, onEnter: () => tween.play() });
      return { split, tween, trigger };
    });
    return () => {
      imageAnimations.forEach((animation) => animation.kill());
      textAnimations.forEach(({ split, tween, trigger }) => { trigger.kill(); tween.kill(); split.revert(); });
      gsap.set(container.querySelectorAll("img"), { clearProps: "transform,willChange" });
    };
  }, { scope: root, dependencies: [cleanHtml], revertOnUpdate: true });
  return <div ref={root} dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
}
