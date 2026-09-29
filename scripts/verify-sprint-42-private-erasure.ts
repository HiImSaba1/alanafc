import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const button = read("src/components/admin/delete-private-submission-button.tsx");
const registrationActions = read("src/features/registrations/actions.ts");
const contactActions = read("src/features/contact/actions.ts");
const registrationPage = read("src/app/admin/registrations/[id]/page.tsx");
const contactPage = read("src/app/admin/messages/[id]/page.tsx");
const activity = read("src/app/admin/activity/page.tsx");
const styles = read("src/app/globals.css");

if (!button.includes("window.confirm") || !button.includes("δεν μπορούν να ανακτηθούν") || !button.includes("Trash2")) throw new Error("Explicit irreversible-deletion confirmation is incomplete.");
for (const [name, source, action, event, table] of [
  ["registration", registrationActions, "deleteRegistration", "registration.deleted", "academyRegistrations"],
  ["contact", contactActions, "deleteContactMessage", "contact.deleted", "contactMessages"],
] as const) {
  if (!source.includes(`export async function ${action}`) || !source.includes('admin.role !== "owner"')) throw new Error(`${name} erasure is not owner restricted.`);
  if (!source.includes("db.transaction") || !source.includes(`transaction.delete(${table})`) || !source.includes(`action: "${event}"`)) throw new Error(`${name} erasure is not atomically audited.`);
  if (!source.includes("revalidatePath(\"/admin/notifications\")") || !source.includes("revalidatePath(\"/admin/activity\")")) throw new Error(`${name} erasure does not refresh private operational views.`);
}
if (!registrationPage.includes('admin.role === "owner"') || !registrationPage.includes('kind="registration"')) throw new Error("Registration erasure control is missing or exposed to editors.");
if (!contactPage.includes('admin.role === "owner"') || !contactPage.includes('kind="contact"')) throw new Error("Contact erasure control is missing or exposed to editors.");
if (!activity.includes('"registration.deleted"') || !activity.includes('"contact.deleted"')) throw new Error("Erasure audit events lack readable labels.");
if (!styles.includes("Sprint 42: explicit private-submission erasure")) throw new Error("Responsive erasure-control styling is missing.");

console.log("Sprint 42 owner-only atomic private-submission erasure contract passed.");
