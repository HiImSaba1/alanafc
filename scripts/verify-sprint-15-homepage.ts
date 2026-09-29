import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { academySponsors } from "../src/data/academy-sponsors";
import { academyTestimonials } from "../src/data/academy-testimonials";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function verifyLocalImage(image: string, label: string) {
  assert(image.startsWith("/"), `${label} must use a root-relative image path.`);
  const file = resolve(process.cwd(), "public", image.slice(1));
  assert(existsSync(file), `${label} image is missing: ${image}`);
}

assert(academyTestimonials.length === 5, "Sprint 15 requires exactly five verified testimonials.");
assert(new Set(academyTestimonials.map((item) => item.id)).size === academyTestimonials.length, "Testimonial IDs must be unique.");
assert(new Set(academyTestimonials.map((item) => item.name)).size === academyTestimonials.length, "Testimonial names must be unique.");
for (const item of academyTestimonials) {
  assert(item.name.trim().length > 1, "Every testimonial requires a name.");
  assert(item.role.trim().length > 1, `${item.name} requires a role.`);
  assert(item.quote.trim().length >= 60, `${item.name} requires a substantive quote.`);
  verifyLocalImage(item.image, item.name);
}

assert(academySponsors.length === 3, "Sprint 15 requires the three sponsors verified in the WordPress export.");
assert(new Set(academySponsors.map((item) => item.name)).size === academySponsors.length, "Sponsor names must be unique.");
for (const sponsor of academySponsors) {
  const href = new URL(sponsor.href);
  assert(href.protocol === "https:", `${sponsor.name} must use an HTTPS destination.`);
  verifyLocalImage(sponsor.image, sponsor.name);
}

process.stdout.write(`${JSON.stringify({
  ok: true,
  testimonials: academyTestimonials.length,
  sponsors: academySponsors.length,
  localImages: academyTestimonials.length + academySponsors.length,
}, null, 2)}\n`);
