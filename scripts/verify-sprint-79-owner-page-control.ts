import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const contract = read("src/features/site-settings/owner-content-contract.ts");
const ownerQuery = read("src/features/site-settings/owner-content.ts");
const ownerAction = read("src/features/site-settings/owner-content-actions.ts");
const homepage = read("src/app/page.tsx");
const siteAdmin = read("src/app/admin/site/page.tsx");
const registrationContract = read("src/features/site-settings/registration-settings.ts");
const registrationAction = read("src/features/site-settings/actions.ts");
const registrationPage = read("src/app/eggrafes-2026-2027/page.tsx");
const registrationAdmin = read("src/app/admin/site/registrations/page.tsx");
const destination = read("src/components/content/academy-destination-page.tsx");
const enhancer = read("src/components/admin/dynamic-settings-list-enhancer.tsx");

for (const field of ["sectionOrder", "newsEyebrow", "newsTitle", "newsButtonLabel", "newsEmptyText", "servicesEyebrow", "servicesTitle", "testimonialsEyebrow", "testimonialsTitle", "sponsorsEyebrow", "sponsorsTitle"]) {
  if (!contract.includes(field) || !ownerAction.includes(field)) throw new Error(`Homepage owner field is not fully persisted: ${field}`);
}
if (!ownerQuery.includes("...defaultOwnerContentSettings.homepage") || !ownerQuery.includes("...stored.homepage")) throw new Error("Stored owner settings are not backward-compatible with new defaults.");
if (!homepage.includes("homepage.sectionOrder.filter") || !homepage.includes('section.id === "services"') || !homepage.includes('section.id === "contact"')) throw new Error("Homepage sections are not rendered from the saved order/visibility contract.");
if (!siteAdmin.includes("homepageSectionCount") || !siteAdmin.includes("homepageSectionLabels") || !enhancer.includes("homepageSectionCount") || !enhancer.includes("locked: true")) throw new Error("Homepage section ordering controls are incomplete or allow identity deletion.");
if (!registrationContract.includes('z.enum(["form", "programs"])') || !registrationAction.includes("registrationSection") || !registrationPage.includes("settings.sectionOrder.filter") || !registrationAdmin.includes("registrationSectionCount")) throw new Error("Registration page section ordering is incomplete.");
if (!destination.includes("!managedBodyHtml && data.pillars") || !destination.includes("!managedBodyHtml ? <section className={`academy-destination__gallery")) throw new Error("Managed page content still renders stale parallel destination sections.");
if (!ownerAction.includes('revalidatePath("/", "layout")') || !registrationAction.includes('revalidatePath("/eggrafes-2026-2027")')) throw new Error("Immediate public revalidation is missing.");

process.stdout.write(`${JSON.stringify({ ok: true, homepageCopyEditable: true, homepageSectionOrdering: true, registrationSectionOrdering: true, staleParallelSectionsRemoved: true, immediateRevalidation: true, writesPerformed: false }, null, 2)}\n`);
