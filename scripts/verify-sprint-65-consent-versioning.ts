import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const storage = read("src/features/consent/cookie-consent-storage.ts");
const tests = read("src/features/consent/cookie-consent-storage.test.ts");
const banner = read("src/components/layout/cookie-banner.tsx");
const preferences = read("src/components/layout/cookie-preferences-button.tsx");
const browserTest = read("e2e/cookie-consent.spec.ts");

if (!storage.includes("COOKIE_POLICY_VERSION = 1") || !storage.includes("serializeCookieConsent") || !storage.includes("readCookieConsent")) throw new Error("Versioned cookie consent storage is incomplete.");
if (!storage.includes('raw === "accepted" || raw === "declined"') || !storage.includes("value.policyVersion !== COOKIE_POLICY_VERSION")) throw new Error("Legacy compatibility or obsolete-policy invalidation is missing.");
if (!banner.includes("serializeCookieConsent(choice)") || !banner.includes("loadCookieConsent(window.localStorage")) throw new Error("The banner does not use the versioned consent contract.");
if (!preferences.includes("loadCookieConsent(window.localStorage")) throw new Error("The preference status does not use the versioned consent contract.");
if (!tests.includes("rejects malformed and obsolete records") || !browserTest.includes("JSON.parse(window.localStorage")) throw new Error("Consent versioning lacks unit or browser coverage.");

console.log("Sprint 65 versioned and resilient cookie consent storage passed.");
