import { describe, expect, it } from "vitest";
import { publicPageMetadata } from "./public-metadata";

describe("publicPageMetadata", () => {
  it("keeps canonical, Open Graph and Twitter metadata aligned", () => {
    const metadata = publicPageMetadata({ title: "Εγγραφές", description: "Περιγραφή", path: "/eggrafes-2026-2027", image: "/hero.jpg", imageAlt: "Εγγραφές παιδιών" });
    expect(metadata.alternates).toEqual({ canonical: "/eggrafes-2026-2027" });
    expect(metadata.openGraph).toMatchObject({ title: "Εγγραφές | Alana FC Academy", url: "/eggrafes-2026-2027", images: [{ url: "/hero.jpg", alt: "Εγγραφές παιδιών" }] });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image", images: ["/hero.jpg"] });
  });
});
