import { describe, expect, it } from "vitest";
import { buildContentSeo, buildSeoImageFilename, firstContentImageSrc, seoSlug } from "./content-seo";

describe("content SEO defaults", () => {
  it("creates stable ASCII names from Greek titles", () => {
    expect(seoSlug("Νέα της Ακαδημίας")).toBe("nea_tis_akadimias");
    expect(buildSeoImageFilename({ seoName: "Νέα της Ακαδημίας", imageNumber: 1, width: 1280 }))
      .toBe("alanafc_nea_tis_akadimias_img_1_1280w.webp");
  });

  it("preserves explicit SEO values and creates safe fallbacks", () => {
    const explicit = buildContentSeo({ title: "Τίτλος", explicitTitle: "SEO τίτλος", explicitDescription: "SEO περιγραφή" });
    expect(explicit).toMatchObject({ title: "SEO τίτλος", description: "SEO περιγραφή" });
    const fallback = buildContentSeo({ title: "Τίτλος", bodyHtml: "<p>Καθαρό <strong>κείμενο</strong></p>" });
    expect(fallback.title).toContain("Alana FC Academy");
    expect(fallback.description).toBe("Καθαρό κείμενο");
  });

  it("uses only the first safe inline article image as a social fallback", () => {
    expect(firstContentImageSrc('<p>Αρχή</p><figure><img src="/uploads/media/first.webp" alt="Πρώτη"></figure><img src="/second.webp">')).toBe("/uploads/media/first.webp");
    expect(firstContentImageSrc('<img src="https://cdn.example.com/article.webp">')).toBe("https://cdn.example.com/article.webp");
    expect(firstContentImageSrc('<img src="javascript:alert(1)">')).toBeNull();
    expect(firstContentImageSrc("<p>Χωρίς εικόνα</p>")).toBeNull();
  });
});
