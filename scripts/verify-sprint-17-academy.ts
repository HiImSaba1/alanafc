import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { aboutAcademyPage } from "../src/data/academy-destinations";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(aboutAcademyPage.storyLayout === "sticky", "The academy story must use the sticky narrative layout.");
assert(aboutAcademyPage.stories.length === 3, "The academy story requires three narrative stages.");
const pillars = aboutAcademyPage.pillars;
assert(pillars?.length === 3, "The academy philosophy requires three pillars.");
assert(new Set(pillars.map((pillar) => pillar.title)).size === 3, "Pillar titles must be unique.");
for (const image of [aboutAcademyPage.heroImage, ...aboutAcademyPage.gallery.map((item) => item.src)]) {
  assert(image.startsWith("/"), `Academy media must be root-relative: ${image}`);
  assert(existsSync(resolve(process.cwd(), "public", image.slice(1))), `Academy media is missing: ${image}`);
}

process.stdout.write(`${JSON.stringify({ ok: true, stories: 3, pillars: 3, localImages: 4 }, null, 2)}\n`);
