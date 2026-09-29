import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { sportsClubPage } from "../src/data/academy-destinations";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const experiences = sportsClubPage.experienceHighlights;
assert(experiences?.length === 3, "Sportclub requires the three verified legacy experiences.");
assert(experiences.some((item) => item.title.includes("Γιορτές")), "The events experience is missing.");
assert(experiences.some((item) => item.title.includes("Φιλανθρωπικές")), "The charitable-actions experience is missing.");
assert(experiences.some((item) => item.title.includes("Καφετέρια")), "The cafe experience is missing.");
assert(sportsClubPage.galleryLayout === "community", "Sportclub must use the community gallery layout.");
assert(sportsClubPage.gallery.length === 6, "Sportclub requires six verified local photographs.");
assert(sportsClubPage.gallery.every((item) => item.caption && item.alt), "Every Sportclub image requires accessible context.");
for (const image of sportsClubPage.gallery) {
  assert(existsSync(resolve(process.cwd(), "public", image.src.slice(1))), `Sportclub image is missing: ${image.src}`);
}

process.stdout.write(`${JSON.stringify({ ok: true, verifiedExperiences: 3, verifiedLocalImages: 6 }, null, 2)}\n`);
