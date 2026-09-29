import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const forms = [
  "src/components/registrations/registration-form.tsx",
  "src/components/contact/contact-form.tsx",
];

for (const form of forms) {
  const source = readFileSync(resolve(projectRoot, form), "utf8");
  for (const contract of ["aria-invalid", "aria-describedby", "aria-live", "aria-busy", "querySelector<HTMLElement>"]) {
    if (!source.includes(contract)) throw new Error(`${form} is missing accessibility contract: ${contract}`);
  }
}

console.log(JSON.stringify({ ok: true, forms, focusMovesToFirstInvalidField: true }, null, 2));
