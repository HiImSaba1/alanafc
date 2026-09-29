import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const migration = read("database/migrations/0010_site_settings.sql");
const schema = read("src/lib/db/schema.ts");
const settings = read("src/features/site-settings/registration-settings.ts");
const actions = read("src/features/site-settings/actions.ts");
const page = read("src/app/eggrafes-2026-2027/page.tsx");
const admin = read("src/app/admin/site/registrations/page.tsx");
const form = read("src/components/registrations/registration-form.tsx");
const guide = read("src/components/registrations/registration-program-guide.tsx");
const packageJson = read("package.json");
const e2eRunner = read("scripts/run-local-e2e.ts");
const destination = read("src/components/content/academy-destination-page.tsx");
const managedPages = ["about-us", "coaching-staff", "our-facilities", "sportclub-alana", "contact-us"].map((route) => read(`src/app/${route}/page.tsx`));

if (!/CREATE TABLE(?: IF NOT EXISTS)? `site_settings`/.test(migration) || !schema.includes('mysqlTable("site_settings"')) throw new Error("Site settings migration/schema contract is missing.");
if (!settings.includes("defaultRegistrationSettings") || !settings.includes("registrationGroupOptions")) throw new Error("Registration fallback/group contract is missing.");
if (!actions.includes("onDuplicateKeyUpdate") || !actions.includes('revalidatePath("/eggrafes-2026-2027")')) throw new Error("Registration settings publication contract is missing.");
if (!page.includes('dynamic = "force-dynamic"') || !page.includes("getRegistrationSettings") || !page.includes("groups={groups}")) throw new Error("Public registrations page is not dynamically connected to settings.");
if (!admin.includes("Χωρίστε τα με κόμμα") || !admin.includes("Αποθήκευση και δημοσίευση")) throw new Error("Owner editing guidance is incomplete.");
if (!form.includes("groups.map") || !guide.includes('program.groups.join(" · ")')) throw new Error("Public form/programme options are not driven by settings.");
if (!destination.includes("managedBodyHtml") || managedPages.some((source) => !source.includes("publicPageBySlug") || !source.includes('dynamic = "force-dynamic"'))) throw new Error("Managed public pages are not connected to published admin content.");
if (!existsSync(resolve(root, "public/programma_proponisewn_alana.jpg"))) throw new Error("Programme image is missing.");
if (!packageJson.includes('node --env-file=.env.local --import=tsx scripts/run-local-e2e.ts') || !e2eRunner.includes('Local browser tests are blocked') || !e2eRunner.includes('localHosts.has(databaseUrl.hostname)')) throw new Error("Local browser tests are not isolated from the production database.");

process.stdout.write(`${JSON.stringify({ ok: true, migration: "0010_site_settings", adminRoute: "/admin/site/registrations", publicRoute: "/eggrafes-2026-2027", dynamicGroups: true, writesPerformed: false }, null, 2)}\n`);
