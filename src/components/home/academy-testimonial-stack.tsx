"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ParallaxMedia } from "@/components/motion";
import type { OwnerTestimonial } from "@/features/site-settings/owner-content-contract";
import { gsap, SplitText } from "@/lib/animations/gsap";

export function AcademyTestimonialStack({ testimonials, title, eyebrow }: { testimonials: OwnerTestimonial[]; title: string; eyebrow: string }) {
  const testimonialCount = testimonials.length;
  const [selected, setSelected] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const root = useRef<HTMLElement>(null);
  const card = useRef<HTMLElement>(null);
  const drag = useRef({ pointerId: -1, startX: 0, startY: 0 });

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);
  const start = useCallback(() => {
    stop();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) timer.current = setInterval(() => setSelected((value) => (value + 1) % testimonialCount), 7000);
  }, [stop, testimonialCount]);
  const move = useCallback((direction: number) => {
    setSelected((value) => (value + direction + testimonialCount) % testimonialCount);
    start();
  }, [start, testimonialCount]);

  useEffect(() => { start(); return stop; }, [start, stop]);

  useGSAP(() => {
    const active = root.current?.querySelector<HTMLElement>("[data-active-testimonial]");
    const quote = active?.querySelector<HTMLElement>("blockquote");
    const portrait = active?.querySelector<HTMLElement>("[data-portrait]");
    if (!active || !quote || !portrait) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(portrait, { clipPath: "inset(0)" });
      gsap.set(active.querySelectorAll("[data-reveal]"), { clearProps: "all" });
      return;
    }
    const split = SplitText.create(quote, { type: "lines", mask: "lines" });
    const timeline = gsap.timeline()
      .fromTo(portrait, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0)", duration: 1, ease: "power4.inOut" })
      .fromTo(split.lines, { yPercent: 110 }, { yPercent: 0, duration: .72, stagger: .06, ease: "power4.out" }, "-=.55")
      .fromTo(active.querySelectorAll("[data-reveal]"), { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .4, stagger: .05 }, "-=.3");
    return () => { timeline.kill(); split.revert(); };
  }, { scope: root, dependencies: [selected], revertOnUpdate: true });

  const reset = useCallback(() => {
    if (card.current) gsap.to(card.current, { x: 0, rotation: 0, autoAlpha: 1, duration: .35, overwrite: true });
    drag.current = { pointerId: -1, startX: 0, startY: 0 };
    start();
  }, [start]);
  const finish = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerId !== drag.current.pointerId) return;
    const distance = event.clientX - drag.current.startX;
    if (Math.abs(distance) < 55) { reset(); return; }
    move(distance < 0 ? 1 : -1);
  }, [move, reset]);

  const item = testimonials[selected];
  return <section ref={root} role="region" aria-labelledby="testimonial-title" className="academy-testimonials" onMouseEnter={stop} onMouseLeave={start} onFocusCapture={stop} onBlurCapture={start}>
    <header><div><h2 id="testimonial-title">{title}</h2><p className="eyebrow">{eyebrow}</p></div></header>
    <article ref={card} key={`${item.name}-${selected}`} data-active-testimonial data-testid="testimonial-card" onPointerDown={(event) => { if (event.button !== 0) return; stop(); drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY }; }} onPointerMove={(event) => { if (event.pointerId !== drag.current.pointerId) return; const x = event.clientX - drag.current.startX; const y = event.clientY - drag.current.startY; if (Math.abs(x) <= Math.abs(y)) return; event.preventDefault(); gsap.set(event.currentTarget, { x: gsap.utils.clamp(-120, 120, x), rotation: x / 80 }); }} onPointerUp={finish} onPointerCancel={reset}>
      <div data-portrait className="academy-testimonials__portrait"><ParallaxMedia className="academy-testimonials__portrait-media" strength={10}><Image src={item.image} alt="" fill sizes="(min-width: 1024px) 30vw, 90vw" className="object-contain" /></ParallaxMedia></div>
      <div><span data-reveal>0{selected + 1} / 0{testimonialCount}</span><blockquote>“{item.quote}”</blockquote><p data-reveal>{item.name}</p><p data-reveal>{item.role}</p></div>
    </article>
    <footer><div>{testimonials.map((entry, index) => <button key={`${entry.name}-${index}`} type="button" aria-label={`Μαρτυρία ${index + 1}`} aria-current={selected === index ? "true" : undefined} onClick={() => { setSelected(index); start(); }}><Image src={entry.image} alt="" fill sizes="48px" className="object-cover" /></button>)}</div><div><button type="button" onClick={() => move(-1)} aria-label="Προηγούμενη μαρτυρία"><ArrowLeft /></button><button type="button" onClick={() => move(1)} aria-label="Επόμενη μαρτυρία"><ArrowRight /></button></div></footer>
  </section>;
}
