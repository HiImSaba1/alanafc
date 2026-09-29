"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type ViewTransition = { finished: Promise<void> };
type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void | Promise<void>) => ViewTransition };

export function PageTransition() {
  const router = useRouter();
  const transitionLocked = useRef(false);
  const routeReady = useRef<(() => void) | null>(null);
  const pendingTargetHref = useRef<string | null>(null);
  const routeSafetyTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const focusMain = () => window.requestAnimationFrame(() => {
      const main = document.querySelector<HTMLElement>("main");
      if (!main) return;
      if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
      main.focus({ preventScroll: true });
    });
    const finish = () => {
      window.clearTimeout(routeSafetyTimer.current);
      transitionLocked.current = false;
      routeReady.current = null;
      pendingTargetHref.current = null;
      document.documentElement.removeAttribute("data-page-transitioning");
      document.documentElement.removeAttribute("aria-busy");
      focusMain();
    };
    const navigate = (href: string) => {
      const destination = new URL(href, window.location.href);
      if (destination.origin !== window.location.origin || !["http:", "https:"].includes(destination.protocol) || destination.href === window.location.href || transitionLocked.current) return;
      const target = `${destination.pathname}${destination.search}${destination.hash}`;
      const transitionDocument = document as ViewTransitionDocument;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !transitionDocument.startViewTransition) {
        window.dispatchEvent(new Event("alana:view-transition-captured"));
        router.push(target);
        focusMain();
        return;
      }

      transitionLocked.current = true;
      pendingTargetHref.current = destination.href;
      document.documentElement.setAttribute("data-page-transitioning", "true");
      document.documentElement.setAttribute("aria-busy", "true");
      const transition = transitionDocument.startViewTransition(async () => {
        window.dispatchEvent(new Event("alana:view-transition-captured"));
        router.push(target);
        await new Promise<void>((resolve) => {
          routeReady.current = resolve;
          routeSafetyTimer.current = window.setTimeout(resolve, 5000);
        });
      });
      transition.finished.then(finish, finish);
    };

    const observer = new MutationObserver(() => {
      const resolve = routeReady.current;
      if (!resolve || !pendingTargetHref.current || window.location.href !== pendingTargetHref.current) return;
      routeReady.current = null;
      resolve();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download") || anchor.dataset.noTransition !== undefined || anchor.dataset.menuNavigation !== undefined) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || !["http:", "https:"].includes(destination.protocol) || destination.href === window.location.href) return;
      event.preventDefault();
      navigate(destination.href);
    };
    const onMenuNavigationReady = (event: Event) => navigate((event as CustomEvent<{ href?: string }>).detail?.href || "");

    document.addEventListener("click", onClick, true);
    window.addEventListener("alana:menu-navigation-ready", onMenuNavigationReady);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("alana:menu-navigation-ready", onMenuNavigationReady);
      window.clearTimeout(routeSafetyTimer.current);
      document.documentElement.removeAttribute("data-page-transitioning");
      document.documentElement.removeAttribute("aria-busy");
    };
  }, [router]);

  return null;
}
