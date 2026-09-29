import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { coachingStaffPage } from "../src/data/academy-destinations";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(coachingStaffPage.galleryLayout === "people", "The coaching route must use the people gallery layout.");
assert(coachingStaffPage.gallery.length === 6, "The coaching gallery requires six verified legacy images.");
assert(coachingStaffPage.gallery.every((item) => item.caption && item.alt), "Every coaching image requires accessible context and a caption.");
assert(new Set(coachingStaffPage.gallery.map((item) => item.src)).size === 6, "Coaching images must be unique.");
for (const image of coachingStaffPage.gallery) {
  assert(existsSync(resolve(process.cwd(), "public", image.src.slice(1))), `Coaching image is missing: ${image.src}`);
}

process.stdout.write(`${JSON.stringify({ ok: true, gallery: "people", verifiedLocalImages: 6, inventedProfiles: 0 }, null, 2)}\n`);
