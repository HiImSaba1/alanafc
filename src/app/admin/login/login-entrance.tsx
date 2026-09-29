"use client";

import { useGSAP } from "@gsap/react";
import { useRef, type ReactNode } from "react";
import { gsap, SplitText } from "@/lib/animations/gsap";
import { LOGIN_ENTRANCE_MOTION } from "@/lib/animations/motion-contract";

export function LoginEntrance({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLElement>(null);
  useGSAP(() => {
    const root = scope.current;
    if (!root) return;
    const visual = root.querySelector<HTMLElement>("[data-login-visual]");
    const image = root.querySelector<HTMLElement>("[data-login-image]");
    const heading = root.querySelector<HTMLElement>("[data-login-heading]");
    const reveals = root.querySelectorAll<HTMLElement>("[data-login-reveal]");
    if (!visual || !heading) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set([visual, image, heading, ...reveals], { clearProps: "all" });
      root.dataset.motionReady = "true";
      return;
    }
    const split = SplitText.create(heading, { type: "lines,words", mask: "lines", linesClass: "alana-login-line", wordsClass: "alana-login-word", aria: "auto" });
    gsap.set(visual, { clipPath: "inset(100% 0 0 0)" });
    gsap.set(image, { scale: 1.08 });
    gsap.set(split.lines, { yPercent: 112, autoAlpha: 0 });
    gsap.set(reveals, { y: 28, autoAlpha: 0 });
    const timeline = gsap.timeline({ defaults: { ease: "power4.out" }, onComplete: () => { root.dataset.motionReady = "true"; gsap.set([visual, image, ...reveals], { clearProps: "willChange" }); } });
    timeline.to(visual, { clipPath: "inset(0% 0 0 0)", duration: LOGIN_ENTRANCE_MOTION.visualDuration, ease: "power4.inOut" })
      .to(image, { scale: 1, duration: LOGIN_ENTRANCE_MOTION.imageDuration, ease: "power3.out" }, 0)
      .to(split.lines, { yPercent: 0, autoAlpha: 1, duration: LOGIN_ENTRANCE_MOTION.lineDuration, stagger: LOGIN_ENTRANCE_MOTION.lineStagger, ease: "power3.out" }, "-=0.8")
      .to(reveals, { y: 0, autoAlpha: 1, duration: LOGIN_ENTRANCE_MOTION.revealDuration, stagger: LOGIN_ENTRANCE_MOTION.revealStagger, ease: "power3.out" }, "-=0.55");
    return () => { timeline.kill(); split.revert(); };
  }, { scope });
  return <main ref={scope} className="grid min-h-svh bg-zinc-950 lg:grid-cols-2" data-login-motion>{children}</main>;
}
