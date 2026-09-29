import { describe, expect, it } from "vitest";
import { siteConfig } from "@/lib/site";
import { academyStructuredData, safeStructuredData } from "./site-structured-data";

describe("academy SEO contract", () => {
  it("contains the complete canonical public route inventory", () => {
    const routes = siteConfig.publicRoutes.map((route) => route.href);
    expect(routes).toEqual(expect.arrayContaining(["/", "/about-us", "/coaching-staff", "/our-facilities", "/sportclub-alana", "/news", "/eggrafes-2026-2027", "/contact-us"]));
    expect(routes.some((route) => route.startsWith("/admin") || route.startsWith("/api"))).toBe(false);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it("publishes a Greek local sports identity without executable markup", () => {
    const data = academyStructuredData();
    expect(data["@type"]).toContain("SportsOrganization");
    expect(data.address.addressLocality).toBe("Αλεξανδρούπολη");
    expect(data.contactPoint).toHaveLength(2);
    expect(safeStructuredData({ value: "</script>" })).not.toContain("</script>");
  });
});
