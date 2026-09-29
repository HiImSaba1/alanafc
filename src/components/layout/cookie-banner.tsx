"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { EditorialButton } from "@/components/ui/editorial-button";
import { COOKIE_CONSENT_KEY, loadCookieConsent, readCookieConsent, serializeCookieConsent, type CookieConsentChoice } from "@/features/consent/cookie-consent-storage";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const dialog = useRef<HTMLElement>(null);
  const focusOnReveal = useRef(false);
  const opener = useRef<HTMLElement | null>(null);
  const restoreFocus = useRef(false);

  useEffect(() => {
    const reveal = () => {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      focusOnReveal.current = true;
      setVisible(true);
    };
    const synchronize = (event: StorageEvent) => {
      if (event.key !== COOKIE_CONSENT_KEY) return;
      const choice = readCookieConsent(event.newValue);
      if (event.newValue !== null && choice === null) window.localStorage.removeItem(COOKIE_CONSENT_KEY);
      setVisible(choice === null);
    };
    window.addEventListener("alana:open-cookie-preferences", reveal);
    window.addEventListener("storage", synchronize);
    const savedChoice = loadCookieConsent(window.localStorage);
    const timer = savedChoice ? undefined : window.setTimeout(() => setVisible(true), 2000);
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener("alana:open-cookie-preferences", reveal);
      window.removeEventListener("storage", synchronize);
    };
  }, []);

  useEffect(() => {
    if (visible && focusOnReveal.current) {
      focusOnReveal.current = false;
      dialog.current?.focus({ preventScroll: true });
      return;
    }
    if (!visible && restoreFocus.current) {
      restoreFocus.current = false;
      opener.current?.focus({ preventScroll: true });
      opener.current = null;
    }
  }, [visible]);

  const choose = (choice: CookieConsentChoice) => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, serializeCookieConsent(choice));
    window.dispatchEvent(new CustomEvent("alana:cookie-consent-changed", { detail: choice }));
    restoreFocus.current = true;
    setVisible(false);
  };

  if (!visible) return null;
  return <aside ref={dialog} tabIndex={-1} className="cookie-banner" role="dialog" aria-modal="false" aria-labelledby="cookie-banner-title" aria-describedby="cookie-banner-description">
    <div>
      <p className="eyebrow">Πολιτική Cookies</p>
      <h2 id="cookie-banner-title">Η επιλογή είναι δική σας.</h2>
      <p id="cookie-banner-description">Χρησιμοποιούμε μόνο τις απολύτως απαραίτητες τεχνολογίες για την ασφαλή λειτουργία του ιστοτόπου. Δεν ενεργοποιούμε διαφημιστικά ή αναλυτικά cookies χωρίς συγκατάθεση.</p>
      <Link href="/cookies">Διαβάστε την Πολιτική Cookies</Link>
    </div>
    <div className="cookie-banner__actions">
      <EditorialButton label="Αποδοχή" arrow="right" variant="dark" onClick={() => choose("accepted")} />
      <EditorialButton label="Απόρριψη" arrow="right" variant="outline" onClick={() => choose("declined")} />
    </div>
  </aside>;
}
