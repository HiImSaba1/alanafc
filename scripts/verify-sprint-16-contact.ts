import { siteConfig } from "../src/lib/site";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(/^\+30\d{10}$/.test(siteConfig.phone), "The public mobile number must use the Greek E.164 format.");
assert(/^\+30\d{10}$/.test(siteConfig.landline), "The public landline must use the Greek E.164 format.");
assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(siteConfig.email), "The public contact email is invalid.");
assert(siteConfig.email === "f.c.alana@hotmail.com", "The public receiver must remain the academy's official address.");
assert(siteConfig.address.includes("Αλεξανδρούπολη"), "The public address must identify Alexandroupoli.");

process.stdout.write(`${JSON.stringify({
  ok: true,
  contactRoute: "/contact-us",
  publicEmail: siteConfig.email,
  phoneLinks: 2,
}, null, 2)}\n`);
