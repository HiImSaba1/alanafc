import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const storage = read("src/features/consent/cookie-consent-storage.ts");
const tests = read("src/features/consent/cookie-consent-storage.test.ts");
const banner = read("src/components/layout/cookie-banner.tsx");
const preferences = read("src/components/layout/cookie-preferences-button.tsx");

if (!storage.includes("export function loadCookieConsent") || !storage.includes("storage.removeItem(COOKIE_CONSENT_KEY)")) throw new Error("Invalid consent records are not cleaned from browser storage.");
if (!banner.includes("loadCookieConsent(window.localStorage)") || !preferences.includes("loadCookieConsent(window.localStorage)")) throw new Error("Consent consumers do not use the cleanup-aware loader.");
if (!banner.includes("event.newValue !== null && choice === null") || !banner.includes("window.localStorage.removeItem(COOKIE_CONSENT_KEY)")) throw new Error("Invalid records received from another tab are not removed.");
if (!tests.includes("removes invalid records while preserving valid consent") || !tests.includes("expect(stored).toBeNull()") || !tests.includes('expect(stored).toBe("declined")')) throw new Error("Consent cleanup lacks regression coverage.");

console.log("Sprint 67 invalid cookie consent cleanup passed.");
