import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const banner = read("src/components/layout/cookie-banner.tsx");
const preferences = read("src/components/layout/cookie-preferences-button.tsx");
const chrome = read("src/components/layout/site-chrome.tsx");
const legal = read("src/components/layout/legal-page.tsx");
const cookies = read("src/app/cookies/page.tsx");
const privacy = read("src/app/privacy/page.tsx");
const styles = read("src/app/globals.css");
const storage = read("src/features/consent/cookie-consent-storage.ts");

if (!storage.includes("alanafc_cookie_consent_v1") || !banner.includes('choose("accepted")') || !banner.includes('choose("declined")') || !banner.includes("window.localStorage.setItem")) throw new Error("Persistent accept and decline choices are incomplete.");
if (!banner.includes("<EditorialButton") || !banner.includes('href="/cookies"') || !banner.includes('role="dialog"')) throw new Error("The accessible EditorialButton consent card is incomplete.");
if (!chrome.includes("<CookieBanner />") || chrome.indexOf('pathname.startsWith("/admin")') > chrome.indexOf("<CookieBanner />")) throw new Error("The banner is not confined to the public site chrome.");
if (!preferences.includes("alana:open-cookie-preferences") || !preferences.includes("removeItem(COOKIE_CONSENT_KEY)")) throw new Error("Visitors cannot reopen and change consent.");
if (!legal.includes("AnimatedLines") || !legal.includes("StaggerReveal") || !cookies.includes("data-reveal-item") || !privacy.includes("data-reveal-item")) throw new Error("The legal-page editorial motion structure is incomplete.");
if (!cookies.includes("δεν ενεργοποιούνται cookies διαφήμισης") || !cookies.includes("CookiePreferencesButton")) throw new Error("The cookie policy does not describe the current implementation accurately.");
if (!privacy.includes("Φωτογραφικό υλικό ανηλίκων") || !privacy.includes("Δεν ζητάμε ΑΜΚΑ") || !privacy.includes("Τα δικαιώματά σας")) throw new Error("The academy privacy policy omits core child-data protections.");
if (!styles.includes("Sprint 59: public consent and legal experience") || !styles.includes("cookie-banner__actions") || !styles.includes("legal-page__layout")) throw new Error("Responsive consent and legal styling is missing.");

console.log("Sprint 59 public cookie consent and Greek legal experience passed.");
