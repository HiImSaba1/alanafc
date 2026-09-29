import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const requiredFiles = [
  "src/components/admin/admin-workspace-shell.tsx",
  "src/components/admin/content-editor.tsx",
  "src/features/content/template-catalog.ts",
  "src/components/content/content-view.tsx",
];

for (const file of requiredFiles) if (!existsSync(resolve(root, file))) throw new Error(`Missing Sprint 29 file: ${file}`);

const editor = read("src/components/admin/content-editor.tsx");
const schema = read("src/lib/db/schema.ts");
const view = read("src/components/content/content-view.tsx");
const shell = read("src/components/admin/admin-workspace-shell.tsx");

for (const key of ["longform", "gallery", "interview", "cinematic", "sidebar"]) {
  if (!read("src/lib/content-template-keys.ts").includes(`\"${key}\"`)) throw new Error(`Template ${key} is missing from the shared contract.`);
  if (!view.includes(`template-${key}`) && !view.includes("content-view--template-${template}")) throw new Error(`Public template rendering contract is missing for ${key}.`);
}
if (!editor.includes('name="articleTemplate"')) throw new Error("Editor does not submit the selected article template.");
if (!schema.includes('mysqlEnum("article_template", [...articleTemplateKeys])')) throw new Error("Database schema does not persist the article template.");
if (!shell.includes('aria-controls="admin-navigation-panel"')) throw new Error("Admin navigation disclosure is missing its accessible relationship.");
if (!view.includes("content-story-sidebar") || !view.includes("galleryFirst")) throw new Error("Public editorial template compositions are incomplete.");
if (!view.includes("data-article-template={template}")) throw new Error("Public post does not expose its selected editorial template.");

console.log("Sprint 29 admin workspace and five-template editorial contract passed.");
