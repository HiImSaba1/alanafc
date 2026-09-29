import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { facilitiesPage } from "../src/data/academy-destinations";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const facilities = facilitiesPage.facilityHighlights;
assert(facilities?.length === 3, "The facilities route requires the three pitch records from WordPress.");
assert(facilities.map((item) => item.metric).join("|") === "11×11|8×8|2× 5×5 + 3×3", "The pitch inventory no longer matches the verified legacy source.");
assert(facilities[0].body.includes("πραγματικού αγώνα"), "The 11x11 pitch context is incomplete.");
assert(facilities[1].title.includes("συνθετικό χλοοτάπητα"), "The 8x8 surface is incomplete.");
assert(facilities[2].body.includes("μικρές ηλικίες"), "The developmental pitch context is incomplete.");
for (const image of [facilitiesPage.heroImage, ...facilitiesPage.gallery.map((item) => item.src)]) {
  assert(existsSync(resolve(process.cwd(), "public", image.slice(1))), `Facility image is missing: ${image}`);
}

process.stdout.write(`${JSON.stringify({ ok: true, verifiedPitchRecords: 3, localImages: 4 }, null, 2)}\n`);
