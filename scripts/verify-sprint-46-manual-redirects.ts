import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const actions = read("src/features/content/redirect-actions.ts");
const page = read("src/app/admin/redirects/page.tsx");
const queries = read("src/features/content/queries.ts");
const publicPage = read("src/app/[slug]/page.tsx");
const button = read("src/components/admin/delete-redirect-button.tsx");
const activity = read("src/app/admin/activity/page.tsx");
const styles = read("src/app/globals.css");

if (!actions.includes("createManualRedirect") || !actions.includes("deleteManualRedirect") || (actions.match(/admin\.role !== "owner"/g)?.length ?? 0) < 2) throw new Error("Manual redirect mutations are not owner restricted.");
if (!actions.includes("internalPath") || !actions.includes("value.startsWith(\"//\")") || !actions.includes("value.includes(\"?\")") || !actions.includes("value.includes(\"#\")") || !actions.includes("admin|api|_next") || !actions.includes('segments[0] === "news"')) throw new Error("Supported internal public-path validation is incomplete.");
if (!actions.includes("sourcePath === targetPath") || !actions.includes("targetRedirect") || !actions.includes("Χρησιμοποιήστε τον τελικό προορισμό")) throw new Error("Redirect loop and chain prevention is incomplete.");
if (!actions.includes("UPDATE") && !actions.includes("transaction.update(legacyRedirects)")) throw new Error("Inbound redirect flattening is missing.");
if (!actions.includes('sourceExternalId: "manual"') || !actions.includes('item.sourceExternalId !== "manual"')) throw new Error("Imported redirect deletion protection is incomplete.");
if (!actions.includes("db.transaction") || !actions.includes('action: "redirect.created"') || !actions.includes('action: "redirect.deleted"')) throw new Error("Redirect mutations are not atomically audited.");
if (!page.includes("createManualRedirect") || !page.includes('name="sourcePath"') || !page.includes('name="targetPath"') || !page.includes("DeleteRedirectButton")) throw new Error("Manual redirect controls are not connected to the registry.");
if (!button.includes("window.confirm") || !button.includes("deleteManualRedirect")) throw new Error("Manual redirect deletion confirmation is missing.");
if (!activity.includes('"redirect.created"') || !activity.includes('"redirect.deleted"')) throw new Error("Redirect audit labels are missing.");
if (!queries.includes("publicRedirectByPath") || !publicPage.includes("await publicRedirectByPath(`/${slug}`)") || !publicPage.includes("permanentRedirect(legacy.targetPath)")) throw new Error("Allowed root-level manual redirects are not connected to public routing.");
if (!styles.includes("Sprint 46: guarded manual redirects")) throw new Error("Responsive manual redirect styling is missing.");

console.log("Sprint 46 guarded manual redirect management contract passed.");
