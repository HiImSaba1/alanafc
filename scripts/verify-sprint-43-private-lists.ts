import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const registrations = read("src/app/admin/registrations/page.tsx");
const messages = read("src/app/admin/messages/page.tsx");
const styles = read("src/app/globals.css");

for (const [name, page, route, table] of [
  ["registrations", registrations, "/admin/registrations", "academyRegistrations"],
  ["messages", messages, "/admin/messages", "contactMessages"],
] as const) {
  if (!page.includes("await requireAdmin()") || !page.includes("PAGE_SIZE = 30")) throw new Error(`${name} list authentication or page size is incomplete.`);
  if (!page.includes('name="q"') || !page.includes('name="status"') || !page.includes("statuses.has(rawStatus)")) throw new Error(`${name} validated search filters are incomplete.`);
  if (!page.includes("COUNT(*)") || !page.includes(`.from(${table}).where(where)`) || !page.includes(".limit(PAGE_SIZE).offset")) throw new Error(`${name} server-side count or pagination is incomplete.`);
  if (!page.includes("admin-content-pagination") || !page.includes(`action="${route}"`) || !page.includes("pageHref(query, status")) throw new Error(`${name} filter-preserving navigation is incomplete.`);
}
if (!registrations.includes("guardianEmail") || !registrations.includes("guardianPhone")) throw new Error("Registration search does not cover operational contact fields.");
if (!messages.includes("senderEmail") || !messages.includes("subject")) throw new Error("Message search does not cover sender and subject fields.");
if (!styles.includes("Sprint 43: scalable private operational lists")) throw new Error("Responsive private-list filters are missing.");

console.log("Sprint 43 searchable paginated private operational lists contract passed.");
