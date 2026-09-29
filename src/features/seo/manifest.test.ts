import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import { siteConfig } from "@/lib/site";

describe("academy web manifest", () => {
  it("uses the Greek academy identity and approved palette", () => {
    const value = manifest();
    expect(value.name).toBe(siteConfig.name);
    expect(value.short_name).toBe(siteConfig.shortName);
    expect(value.lang).toBe("el");
    expect(value.start_url).toBe("/");
    expect(value.background_color).toBe("#f2eee6");
    expect(value.theme_color).toBe("#050505");
  });

  it("declares the real square logo favicon and its source dimensions", () => {
    const value = manifest();
    expect(value.icons).toEqual([{ src: "/icon.png", sizes: "1254x1254", type: "image/png", purpose: "any" }]);
  });
});
