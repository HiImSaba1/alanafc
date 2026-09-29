import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const banner = read("src/components/layout/cookie-banner.tsx");
const preferences = read("src/components/layout/cookie-preferences-button.tsx");
const footer = read("src/components/layout/site-footer.tsx");
const cookies = read("src/app/cookies/page.tsx");
const styles = read("src/app/globals.css");

if (!banner.includes("StorageEvent") || !banner.includes('addEventListener("storage", synchronize)') || !banner.includes("const choice = readCookieConsent(event.newValue)") || !banner.includes("setVisible(choice === null)")) throw new Error("Cookie consent does not synchronize safely between browser tabs.");
if (!banner.includes("focusOnReveal") || !banner.includes("dialog.current?.focus") || !banner.includes("tabIndex={-1}")) throw new Error("Manually reopened cookie settings do not receive accessible focus.");
if (!banner.includes("window.setTimeout(() => setVisible(true), 2000)")) throw new Error("The automatic banner reveal must not steal keyboard focus.");
if (!preferences.includes("compact = false") || !preferences.includes("footer-cookie-settings") || !preferences.includes('aria-live="polite"')) throw new Error("The reusable cookie-preference control is incomplete.");
if (!preferences.includes('"Αποδοχή"') || !preferences.includes('"Απόρριψη"') || !preferences.includes('"Δεν έχει οριστεί"')) throw new Error("The saved consent choice is not explained in Greek.");
if (!footer.includes("<CookiePreferencesButton compact />") || !cookies.includes("<CookiePreferencesButton />")) throw new Error("Cookie settings are not reachable from both the footer and policy page.");
if (!styles.includes("Sprint 63: persistent, accessible cookie-preference management") || !styles.includes(".footer-cookie-settings:focus-visible") || !styles.includes(".cookie-banner:focus")) throw new Error("Cookie preference focus and rolling-link styling is incomplete.");

console.log("Sprint 63 persistent and accessible cookie consent management passed.");
