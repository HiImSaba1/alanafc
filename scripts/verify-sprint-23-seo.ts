import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { academyStructuredData, safeStructuredData } from "../src/features/seo/site-structured-data";
import { siteConfig } from "../src/lib/site";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const requiredRoutes = ["/", "/about-us", "/coaching-staff", "/our-facilities", "/sportclub-alana", "/news", "/eggrafes-2026-2027", "/contact-us"];
const routes = siteConfig.publicRoutes.map((route) => route.href);
assert(requiredRoutes.every((route) => routes.includes(route as (typeof routes)[number])), "The canonical public route inventory is incomplete.");
assert(new Set(routes).size === routes.length, "Canonical public routes must be unique.");
assert(routes.every((route) => !route.startsWith("/admin") && !route.startsWith("/api")), "Private routes must never enter the sitemap inventory.");

const structuredData = academyStructuredData();
assert(structuredData["@type"].includes("SportsOrganization"), "SportsOrganization structured data is missing.");
assert(structuredData["@type"].includes("SportsActivityLocation"), "SportsActivityLocation structured data is missing.");
assert(structuredData.address.addressLocality === "Αλεξανδρούπολη", "The academy locality is incorrect.");
const logoPath = new URL(structuredData.logo).pathname;
assert(existsSync(resolve(process.cwd(), "public", logoPath.slice(1))), "The structured-data logo does not exist locally.");
assert(!safeStructuredData({ unsafe: "</script>" }).includes("</script>"), "Structured data serialization permits script termination.");

process.stdout.write(`${JSON.stringify({ ok: true, canonicalRoutes: routes.length, privateRoutes: 0, structuredTypes: structuredData["@type"] }, null, 2)}\n`);
