import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const core = read("src/features/content/core.ts");
const normalizer = read("scripts/normalize-imported-post-slugs.ts");
const queries = read("src/features/content/queries.ts");
const article = read("src/app/news/[slug]/page.tsx");
const footer = read("src/components/layout/site-footer.tsx");
const styles = read("src/app/globals.css");
const schema = read("src/lib/db/schema.ts");
const migration = read("database/migrations/0008_widen_legacy_redirect_paths.sql");

if (!core.includes("conciseGreeklishSlug") || !core.includes("normalizeGreekTitleConjunctions") || !core.includes('replace(/(^|\\s)και(?=\\s|$)/gu, "$1and")') || !core.includes("maxLength = 80") || !core.includes('replace(/-[^-]*$/, "")')) throw new Error("Concise Greeklish slug and conjunction normalization is incomplete.");
if (!normalizer.includes("--confirm-normalize-imported-slugs") || !normalizer.includes('database !== "next_alanafcacademy"') || !normalizer.includes('process.env.NODE_ENV === "production"')) throw new Error("Slug migration environment boundaries are incomplete.");
if (!normalizer.includes("beginTransaction") || !normalizer.includes("rollback") || !normalizer.includes("slug-normalizing-") || !normalizer.includes("ON DUPLICATE KEY UPDATE") || !normalizer.includes("UPDATE legacy_redirects SET target_path=? WHERE target_path=?")) throw new Error("Atomic collision-safe slug migration and redirect flattening are incomplete.");
if (!normalizer.includes("writesPerformed: confirmed") || !normalizer.includes("redirectPathsTooLong") || !normalizer.includes("redirectSourceCapacity")) throw new Error("Dry-run reconciliation is incomplete.");
if (!schema.includes('sourcePath: varchar("source_path", { length: 240 })') || !migration.includes("varchar(240) NOT NULL")) throw new Error("Long legacy redirect paths are not supported by the indexed-safe schema and migration.");
if (!queries.includes("publicPostRedirect") || !queries.includes("legacyRedirects.targetPath") || !article.includes("await publicPostRedirect(slug)") || !article.includes("permanentRedirect(legacy.targetPath)")) throw new Error("Permanent legacy news URL redirects are incomplete.");
if (!footer.includes('className="site-footer space-y-10"') || !footer.includes("ResizeObserver") || !footer.includes('--footer-curtain-height') || !styles.includes("height: auto; min-height: 0") || !styles.includes("padding: 2.5rem var(--site-gutter)") || !styles.includes("padding-block: .5rem")) throw new Error("Requested content-sized footer rhythm is incomplete.");

console.log("Sprint 44 concise Greeklish URL and compact footer contract passed.");
