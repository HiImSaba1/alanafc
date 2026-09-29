"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import { EditorialButton } from "@/components/ui/editorial-button";
import { CookiePreferencesButton } from "./cookie-preferences-button";
import { gsap } from "@/lib/animations/gsap";
import { siteConfig } from "@/lib/site";
import type { OwnerPublicSite } from "@/features/site-settings/owner-content-contract";

export function SiteFooter({ site }: { site: OwnerPublicSite }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const footer = root.current;
    const curtain = footer?.closest<HTMLElement>(".site-footer-curtain");
    if (!footer || !curtain || typeof ResizeObserver === "undefined") return;
    const updateHeight = () => curtain.style.setProperty("--footer-curtain-height", `${Math.ceil(footer.scrollHeight)}px`);
    const observer = new ResizeObserver(updateHeight);
    observer.observe(footer);
    updateHeight();
    return () => { observer.disconnect(); curtain.style.removeProperty("--footer-curtain-height"); };
  }, []);
  useGSAP(() => {
    const footer = root.current;
    if (!footer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = footer.querySelectorAll("[data-footer-reveal]");
    gsap.set(targets, { y: 28, autoAlpha: 0 });
    const timeline = gsap.timeline({ scrollTrigger: { trigger: footer, start: "bottom bottom", once: true } })
      .to(targets, { y: 0, autoAlpha: 1, duration: 0.72, stagger: 0.065, ease: "power3.out" });
    return () => timeline.kill();
  }, { scope: root });
  return (
    <div className="site-footer-curtain">
      <div className="site-footer-curtain__stage">
        <div className="site-footer-curtain__sticky">
    <footer ref={root} className="site-footer space-y-10">
      <div className="site-footer__top">
        <div><p data-footer-reveal className="eyebrow">{site.footerEyebrow}</p><h2 data-footer-reveal>{site.footerTitle}</h2><div data-footer-reveal><EditorialButton href={site.footerButtonHref} label={site.footerButtonLabel} arrow="right" variant="light" /></div></div>
        <nav aria-label="Πλοήγηση υποσέλιδου">{site.navigation.filter((item) => item.enabled).map((item) => <Link data-footer-reveal href={item.href} key={item.href}><span className="footer-roll"><span>{item.label}</span><span aria-hidden="true">{item.label}</span></span><ArrowUpRight /></Link>)}</nav>
      </div>
      <div className="site-footer__wordmark" data-footer-reveal aria-label="Alana FC Academy">{site.footerWordmark}</div>
      <div className="site-footer__bottom"><span>© {new Date().getFullYear()} ALANA FC ACADEMY</span><a href={`mailto:${site.email}`}><span className="footer-roll"><span>{site.email}</span><span aria-hidden="true">{site.email}</span></span></a><nav aria-label="Νομικές πληροφορίες">{siteConfig.legalNavigation.map((item) => <Link href={item.href} key={item.href}><span className="footer-roll"><span>{item.label}</span><span aria-hidden="true">{item.label}</span></span></Link>)}<CookiePreferencesButton compact /></nav></div>
    </footer>
        </div>
      </div>
    </div>
  );
}
