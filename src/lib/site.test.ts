import { describe, expect, it } from "vitest";
import { siteConfig } from "./site";

describe("Greek public site contract", () => {
  it("keeps navigation routes unique and internal", () => {
    const paths = siteConfig.navigation.map((item) => item.href);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.every((path) => path.startsWith("/"))).toBe(true);
    expect(paths).not.toContain("/");
    expect(siteConfig.navigation[0]).toMatchObject({ label: "Εγγραφές", href: "/eggrafes-2026-2027" });
  });

  it("contains no English locale or language-switch route", () => {
    const paths = [...siteConfig.navigation, ...siteConfig.legalNavigation].map((item) => item.href);
    expect(paths).not.toContain("/en");
    expect(siteConfig.navigation.map((item) => item.label).join(" ")).not.toMatch(/Home|About|Contact|News/);
  });

  it("uses the approved academy mailbox", () => {
    expect(siteConfig.email).toBe("f.c.alana@hotmail.com");
  });

  it("uses the approved branded image for generic shared links", () => {
    expect(siteConfig.socialImage).toBe("/alanafc-shared-links.jpg");
  });
});
