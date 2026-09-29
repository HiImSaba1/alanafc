"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "@/lib/animations/gsap";
import type { OwnerPublicSite } from "@/features/site-settings/owner-content-contract";

export function SiteHeader({ site }: { site: OwnerPublicSite }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const pathname = usePathname();
  const navigation = site.navigation.filter((item) => item.enabled);
  const root = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const navigateFromOpenMenu = (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    if (href === pathname) { setOpen(false); return; }
    window.dispatchEvent(new CustomEvent("alana:menu-navigation-ready", { detail: { href } }));
  };

  useEffect(() => {
    const closeAfterCapture = () => setOpen(false);
    window.addEventListener("alana:view-transition-captured", closeAfterCapture);
    return () => window.removeEventListener("alana:view-transition-captured", closeAfterCapture);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const menu = panel.current;
    const focusable = menu?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [];
    const background = document.querySelectorAll<HTMLElement>("body main, body footer");
    background.forEach((element) => { element.inert = true; });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let focusFrame = 0;
    let trapFocusFrame = 0;
    let focusAttempts = 0;
    const focusFirstLink = () => {
      const first = focusable[0];
      if (!first) return;
      first.focus({ preventScroll: true });
      if (document.activeElement !== first && focusAttempts < 60) {
        focusAttempts += 1;
        focusFrame = window.requestAnimationFrame(focusFirstLink);
      }
    };
    const focusTimer = window.setTimeout(focusFirstLink, reduced ? 0 : 420);
    const preventScroll = (event: Event) => { event.preventDefault(); };
    const keepFocusInsideMenu = (target: HTMLElement | undefined) => {
      if (!target) return;
      target.focus({ preventScroll: true });
      window.cancelAnimationFrame(trapFocusFrame);
      trapFocusFrame = window.requestAnimationFrame(() => {
        if (panel.current?.getAttribute("aria-hidden") === "false" && document.activeElement !== target) target.focus({ preventScroll: true });
      });
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); return; }
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) event.preventDefault();
      if (event.key !== "Tab" || focusable.length < 2) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!menu?.contains(document.activeElement)) { event.preventDefault(); keepFocusInsideMenu(event.shiftKey ? last : first); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); keepFocusInsideMenu(last); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); keepFocusInsideMenu(first); }
    };
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", preventScroll, { passive: false, capture: true });
    window.addEventListener("touchmove", preventScroll, { passive: false, capture: true });
    return () => {
      window.clearTimeout(focusTimer);
      window.cancelAnimationFrame(focusFrame);
      window.cancelAnimationFrame(trapFocusFrame);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", preventScroll, true);
      window.removeEventListener("touchmove", preventScroll, true);
      background.forEach((element) => { element.inert = false; });
    };
  }, [open]);

  useGSAP(() => {
    const menu = panel.current;
    if (!menu) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const links = menu.querySelectorAll("[data-menu-line]");
    const details = menu.querySelectorAll("[data-menu-detail]");
    if (reduced) {
      gsap.set(menu, { clipPath: open ? "inset(0)" : "inset(100% 0 0 0)", autoAlpha: open ? 1 : 0, pointerEvents: open ? "auto" : "none" });
      gsap.set([...links, ...details], { clearProps: "all" });
      return;
    }
    gsap.killTweensOf([menu, ...links, ...details]);
    const timeline = gsap.timeline();
    if (open) {
      gsap.set(menu, { autoAlpha: 1, pointerEvents: "auto" });
      gsap.set(links, { yPercent: 115, autoAlpha: 0 });
      gsap.set(details, { y: 24, opacity: 0, visibility: "visible" });
      gsap.set(menu, { clipPath: "inset(100% 0 0 0)" });
      timeline.to(menu, { clipPath: "inset(0% 0 0 0)", duration: 1.12, ease: "power4.inOut" })
        .to(links, { yPercent: 0, autoAlpha: 1, stagger: 0.07, duration: 0.78, ease: "power4.out" }, 0.36)
        .to(details, { y: 0, opacity: 1, stagger: 0.065, duration: 0.7, ease: "power3.out" }, 0.54);
    } else {
      timeline.to(links, { yPercent: -112, autoAlpha: 0, duration: 0.42, stagger: { each: 0.035, from: "end" }, ease: "power3.in" })
        .to(details, { y: -18, opacity: 0, duration: 0.36, stagger: { each: 0.035, from: "end" }, ease: "power3.in" }, 0)
        .to(menu, { clipPath: "inset(0 0 100% 0)", duration: 0.82, ease: "power4.inOut", onComplete: () => gsap.set(menu, { autoAlpha: 0, pointerEvents: "none", scrollTop: 0 }) }, 0.12);
    }
    return () => timeline.kill();
  }, { scope: root, dependencies: [open] });

  return (
    <header ref={root} className="site-header" data-scrolled={scrolled || open ? "true" : undefined} data-open={open ? "true" : undefined}>
      <div className="site-header__bar">
        <Link href="/" className="site-logo" aria-label="Alana FC Academy — Αρχική">
          <Image src="/alana_fc_academy_images_wordpress/new-logo-png-alana_main.png" alt="" width={340} height={180} priority />
        </Link>
        <button ref={trigger} type="button" className="menu-trigger" aria-expanded={open} aria-controls="site-menu" aria-label={open ? "Κλείσιμο μενού" : "Άνοιγμα μενού"} onClick={() => setOpen((value) => !value)}>
          <span className="menu-trigger__label">{open ? "Κλείσιμο" : "Μενού"}</span><span className="menu-trigger__icon" aria-hidden="true"><i /><i /></span>
        </button>
      </div>
      <div ref={panel} id="site-menu" className="site-menu" aria-hidden={!open}>
        <div className="site-menu__main">
          <nav aria-label="Κύρια πλοήγηση">
            {navigation.map((item, index) => <div className="site-menu__mask" key={item.href}><Link href={item.href} data-menu-navigation aria-current={pathname === item.href ? "page" : undefined} onClick={(event) => navigateFromOpenMenu(event, item.href)} onMouseEnter={() => setActiveImage(index)} onFocus={() => setActiveImage(index)}><span className="site-menu__index">{String(index + 1).padStart(2, "0")}</span><span className="site-menu__label" data-menu-line><span>{item.label}</span><span aria-hidden="true">{item.label}</span></span><ArrowUpRight /></Link></div>)}
          </nav>
          <div className="site-menu__preview" data-menu-detail aria-hidden="true">
            {navigation.map((item, index) => <Image key={item.href} src={item.image} alt="" fill sizes="40vw" className={index === activeImage ? "is-active" : ""} />)}
          </div>
        </div>
        <div className="site-menu__foot" data-menu-detail><p>Αλεξανδρούπολη · Ελλάδα</p><a href={`mailto:${site.email}`}>{site.email}</a><span>Ποδόσφαιρο · Εκπαίδευση · Ομάδα</span></div>
      </div>
    </header>
  );
}
