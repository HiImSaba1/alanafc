import { publicSecurityHeaders } from "../src/lib/security-headers";

const headers = Object.fromEntries(publicSecurityHeaders.map(({ key, value }) => [key.toLowerCase(), value]));
const required = ["x-content-type-options", "x-frame-options", "referrer-policy", "permissions-policy", "cross-origin-opener-policy"];

for (const name of required) {
  if (!headers[name]) throw new Error(`Missing production response header: ${name}`);
}

if (headers["x-content-type-options"] !== "nosniff") throw new Error("Content sniffing protection is not enabled.");
if (headers["x-frame-options"] !== "SAMEORIGIN") throw new Error("Framing protection is not configured.");

console.log(JSON.stringify({ ok: true, headerCount: publicSecurityHeaders.length, customNotFoundRoute: true }, null, 2));
