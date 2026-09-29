"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { EditorialButton } from "@/components/ui/editorial-button";
import { ParallaxMedia } from "@/components/motion/parallax-media";
import { gsap } from "@/lib/animations/gsap";
import type { OwnerHeroSlide } from "@/features/site-settings/owner-content-contract";

export function HomeHeroSlider({ slides }: { slides: OwnerHeroSlide[] }) {
  const [active, setActive] = useState(0);
  const root = useRef<HTMLElement>(null);
  const timer = useRef<number | null>(null);
  const drag = useRef({ pointerId: -1, startX: 0, startY: 0 });

  const stop = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
  }, []);
  const move = useCallback((direction: number) => {
    setActive((value) => (value + direction + slides.length) % slides.length);
  }, [slides.length]);
  const start = useCallback(() => {
    stop();
    if (root.current?.matches(":hover") || root.current?.contains(document.activeElement)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden) return;
    timer.current = window.setInterval(() => move(1), 7000);
  }, [move, stop]);

  useEffect(() => {
    start();
    const onVisibilityChange = () => document.hidden ? stop() : start();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [start, stop]);

  useEffect(() => {
    const preloaders = slides.map((slide) => {
      const image = new window.Image();
      image.decoding = "async";
      image.src = slide.image;
      return image;
    });
    return () => preloaders.forEach((image) => { image.src = ""; });
  }, [slides]);

  useGSAP(() => {
    const current = root.current?.querySelector<HTMLElement>(`[data-hero-slide="${active}"]`);
    const copy = root.current?.querySelector<HTMLElement>("[data-hero-copy]");
    if (!current || !copy || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = copy.querySelectorAll("[data-hero-reveal]");
    const timeline = gsap.timeline()
      .fromTo(current, { autoAlpha: 0, clipPath: "inset(0 0 100% 0)" }, { autoAlpha: 1, clipPath: "inset(0)", duration: 1, ease: "power4.inOut" })
      .fromTo(targets, { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .68, stagger: .075, ease: "power3.out" }, "-=.5");
    return () => timeline.kill();
  }, { scope: root, dependencies: [active], revertOnUpdate: true });

  const slide = slides[active];
  const select = (index: number) => {
    setActive(index);
    start();
  };
  const beginDrag = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || (event.target as Element).closest("a,button")) return;
    stop();
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY };
    try { event.currentTarget.setPointerCapture?.(event.pointerId); } catch { /* Touch capture is not available in every browser. */ }
  };
  const endDrag = (event: PointerEvent<HTMLElement>) => {
    if (drag.current.pointerId !== event.pointerId) return;
    const x = event.clientX - drag.current.startX;
    const y = event.clientY - drag.current.startY;
    drag.current.pointerId = -1;
    if (Math.abs(x) >= 55 && Math.abs(x) > Math.abs(y)) move(x < 0 ? 1 : -1);
    start();
  };

  return <section ref={root} className="home-hero" aria-roledescription="carousel" aria-label="Κύριες επιλογές Alana FC" tabIndex={0} onKeyDown={(event) => { if (event.key === "ArrowLeft") move(-1); if (event.key === "ArrowRight") move(1); }} onMouseEnter={stop} onMouseLeave={start} onFocusCapture={stop} onBlurCapture={start} onPointerDown={beginDrag} onPointerUp={endDrag} onPointerCancel={start}>
    <div className="home-hero__slides" aria-live="off">
      {slides.map((item, index) => <ParallaxMedia key={item.href} className="home-hero__media" strength={8}>
        <div data-hero-slide={index} data-active={index === active ? "true" : undefined} className="home-hero__slide" aria-hidden={index !== active}>
          <Image src={item.image} alt={index === active ? item.alt : ""} fill priority={index === 0} sizes="100vw" className="object-cover" />
        </div>
      </ParallaxMedia>)}
      <span className="home-hero__overlay" aria-hidden="true" />
    </div>
    <div key={slide.href} className="home-hero__content" data-hero-copy>
      <div className="home-hero__meta" data-hero-reveal><p>Αλεξανδρούπολη · Ελλάδα</p><p>{String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")} · {slide.eyebrow}</p></div>
      <h1 id="home-title" className="home-hero__title" data-hero-reveal>{slide.title}</h1>
      <div className="home-hero__foot" data-hero-reveal><p className="home-hero__intro">{slide.description}</p><EditorialButton href={slide.href} label={slide.button} arrow="right" variant="light" /></div>
    </div>
    <div className="home-hero__controls" aria-label="Έλεγχος διαφανειών">
      <button type="button" onClick={() => { move(-1); start(); }} aria-label="Προηγούμενη διαφάνεια"><ArrowLeft /></button>
      <div>{slides.map((item, index) => <button key={item.href} type="button" onClick={() => select(index)} aria-label={`Διαφάνεια ${index + 1}: ${item.eyebrow}`} aria-current={index === active ? "true" : undefined} />)}</div>
      <button type="button" onClick={() => { move(1); start(); }} aria-label="Επόμενη διαφάνεια"><ArrowRight /></button>
    </div>
  </section>;
}
