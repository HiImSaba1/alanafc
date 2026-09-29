import { describe, expect, it } from "vitest";
import { articleTemplateKeys } from "@/lib/content-template-keys";
import { articleTemplateCatalog, isArticleTemplateKey } from "./template-catalog";

describe("article template catalog", () => {
  it("keeps the five active Acadimies editorial formats", () => {
    expect(articleTemplateKeys).toEqual(["longform", "gallery", "interview", "cinematic", "sidebar"]);
    expect(Object.keys(articleTemplateCatalog)).toEqual([...articleTemplateKeys]);
  });

  it("rejects unknown template values", () => {
    expect(isArticleTemplateKey("gallery")).toBe(true);
    expect(isArticleTemplateKey("matchday")).toBe(false);
    expect(isArticleTemplateKey("<script>")).toBe(false);
  });
});
