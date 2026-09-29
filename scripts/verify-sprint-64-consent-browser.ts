import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const banner = read("src/components/layout/cookie-banner.tsx");
const browserTest = read("e2e/cookie-consent.spec.ts");

const preferences = read("src/components/layout/cookie-preferences-button.tsx");
const publicShellTest = read("e2e/public-shell.spec.ts");

if (!banner.includes("opener.current = document.activeElement") || !banner.includes("restoreFocus.current = true") || !banner.includes("opener.current?.focus")) throw new Error("Cookie consent does not restore focus to the control that opened it.");
if (!banner.includes("alana:cookie-consent-changed") || !preferences.includes('addEventListener("alana:cookie-consent-changed", readChoice)')) throw new Error("The current page is not notified immediately when consent changes.");
if (!browserTest.includes('page.goto("/cookies")') || !browserTest.includes('toBe("declined")') || !browserTest.includes('toBe("accepted")')) throw new Error("The browser contract does not verify both saved consent choices.");
if (!browserTest.includes("toBeFocused()") || !browserTest.includes('name: "Ρυθμίσεις Cookies"')) throw new Error("The browser contract does not verify dialog and footer focus behavior.");
if (!publicShellTest.includes('window.localStorage.setItem("alanafc_cookie_consent_v1", "accepted")')) throw new Error("General public browser tests are not isolated from the delayed consent banner.");

console.log("Sprint 64 cookie consent browser and focus contract passed.");
