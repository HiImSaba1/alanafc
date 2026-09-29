"use client";

import { useEffect, useState } from "react";
import { EditorialButton } from "@/components/ui/editorial-button";
import { COOKIE_CONSENT_KEY, loadCookieConsent, type CookieConsentChoice } from "@/features/consent/cookie-consent-storage";

export function CookiePreferencesButton({ compact = false }: { compact?: boolean }) {
  const [choice, setChoice] = useState<CookieConsentChoice | null>(null);
  useEffect(() => {
    const readChoice = () => setChoice(loadCookieConsent(window.localStorage));
    const synchronize = (event: StorageEvent) => {
      if (event.key === COOKIE_CONSENT_KEY) readChoice();
    };
    readChoice();
    window.addEventListener("storage", synchronize);
    window.addEventListener("alana:cookie-consent-changed", readChoice);
    return () => {
      window.removeEventListener("storage", synchronize);
      window.removeEventListener("alana:cookie-consent-changed", readChoice);
    };
  }, []);
  const reopen = () => {
    window.localStorage.removeItem(COOKIE_CONSENT_KEY);
    setChoice(null);
    window.dispatchEvent(new CustomEvent("alana:cookie-consent-changed", { detail: null }));
    window.dispatchEvent(new Event("alana:open-cookie-preferences"));
  };
  if (compact) return <button type="button" className="footer-cookie-settings" onClick={reopen}><span className="footer-roll"><span>Ρυθμίσεις Cookies</span><span aria-hidden="true">Ρυθμίσεις Cookies</span></span></button>;
  return <div className="cookie-preference-control"><p aria-live="polite">Αποθηκευμένη επιλογή: <strong>{choice === "accepted" ? "Αποδοχή" : choice === "declined" ? "Απόρριψη" : "Δεν έχει οριστεί"}</strong></p><EditorialButton label="Αλλαγή επιλογής" arrow="right" variant="outline" onClick={reopen} /></div>;
}
