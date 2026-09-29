import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const storage = read("src/features/consent/cookie-consent-storage.ts");
const tests = read("src/features/consent/cookie-consent-storage.test.ts");
const policy = read("src/app/cookies/page.tsx");

if (!storage.includes("COOKIE_CONSENT_MAX_AGE_DAYS = 180") || !storage.includes("CLOCK_SKEW_TOLERANCE_MS") || !storage.includes("age > COOKIE_CONSENT_MAX_AGE_DAYS * DAY_IN_MS")) throw new Error("Consent expiry and clock-skew boundaries are incomplete.");
if (!storage.includes("Date.parse(value.savedAt)") || !storage.includes("Number.isFinite(savedAt)")) throw new Error("Invalid consent timestamps are not rejected safely.");
if (!tests.includes("renews expired consent") || !tests.includes("expect(readCookieConsent(expired, now)).toBeNull()") || !tests.includes("expect(readCookieConsent(future, now)).toBeNull()")) throw new Error("Consent expiry lacks deterministic unit coverage.");
if (!policy.includes("για έως 180 ημέρες") || !policy.includes("Μετά τη λήξη θα σας ζητηθεί νέα επιλογή")) throw new Error("The public cookie policy does not disclose the implemented retention period.");

console.log("Sprint 66 cookie consent expiry and policy disclosure passed.");
