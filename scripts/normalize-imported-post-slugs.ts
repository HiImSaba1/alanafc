import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import mysql from "mysql2/promise";
import { conciseGreeklishSlug, normalizeGreekTitleConjunctions } from "../src/features/content/core";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const confirmed = process.argv.includes("--confirm-normalize-imported-slugs");

type PostRow = { id: number; external_id: string; title: string; slug: string };

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is missing.");
  if (process.env.NODE_ENV === "production") throw new Error("Bulk slug normalization is disabled in production.");
  const url = new URL(databaseUrl);
  const database = url.pathname.replace(/^\//, "");
  if (database !== "next_alanafcacademy") throw new Error("Slug normalization is restricted to next_alanafcacademy.");
  const connection = await mysql.createConnection({ uri: databaseUrl });
  try {
    const [postRows] = await connection.execute<mysql.RowDataPacket[]>("SELECT id, external_id, title, slug FROM content_entries WHERE kind='post' ORDER BY id ASC");
    const [columnRows] = await connection.execute<mysql.RowDataPacket[]>("SELECT CHARACTER_MAXIMUM_LENGTH AS max_length FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='legacy_redirects' AND COLUMN_NAME='source_path' LIMIT 1", [database]);
    const redirectSourceCapacity = Number(columnRows[0]?.max_length ?? 0);
    const posts = postRows as PostRow[];
    const imported = posts.filter((post) => !post.external_id.startsWith("native-"));
    const used = new Set(posts.filter((post) => post.external_id.startsWith("native-")).map((post) => post.slug));
    const changes = imported.map((post) => {
      const normalizedTitle = normalizeGreekTitleConjunctions(post.title);
      const base = conciseGreeklishSlug(normalizedTitle);
      let slug = base;
      if (used.has(slug)) slug = `${base.slice(0, Math.max(1, 80 - String(post.id).length - 1)).replace(/-+$/, "")}-${post.id}`;
      used.add(slug);
      return { ...post, normalizedTitle, newSlug: slug, sourcePath: `/news/${post.slug}`, targetPath: `/news/${slug}` };
    }).filter((post) => post.slug !== post.newSlug || post.title !== post.normalizedTitle);
    const tooLong = changes.filter((item) => item.sourcePath.length > redirectSourceCapacity);
    const report = { ok: true, mode: confirmed ? "confirmed_local_update" : "dry_run", database, importedPosts: imported.length, changedPosts: changes.length, redirectSourceCapacity, redirectPathsTooLong: tooLong.length, writesPerformed: confirmed, sample: changes.slice(0, 12).map(({ id, title, slug, newSlug }) => ({ id, title, from: slug, to: newSlug })), tooLong: tooLong.map(({ id, slug, sourcePath }) => ({ id, from: slug, pathLength: sourcePath.length })) };
    if (!confirmed) { process.stdout.write(`${JSON.stringify(report, null, 2)}\n`); return; }
    if (tooLong.length) throw new Error(`At least one legacy /news path exceeds the redirect-table limit (${redirectSourceCapacity}). Run npm run db:migrate, then repeat the dry-run. No writes were performed.`);
    await connection.beginTransaction();
    try {
      for (const item of changes.filter((entry) => entry.slug !== entry.newSlug)) await connection.execute("UPDATE content_entries SET slug=? WHERE id=?", [`slug-normalizing-${item.id}`, item.id]);
      for (const item of changes) {
        await connection.execute("UPDATE content_entries SET slug=?, title=? WHERE id=?", [item.newSlug, item.normalizedTitle, item.id]);
        if (item.slug !== item.newSlug) {
          await connection.execute("UPDATE legacy_redirects SET target_path=? WHERE target_path=?", [item.targetPath, item.sourcePath]);
          await connection.execute("INSERT INTO legacy_redirects (source_path, target_path, status_code, source_external_id) VALUES (?, ?, 308, ?) ON DUPLICATE KEY UPDATE target_path=VALUES(target_path), status_code=308, source_external_id=VALUES(source_external_id)", [item.sourcePath, item.targetPath, item.external_id]);
        }
      }
      await connection.execute("INSERT INTO audit_events (actor_user_id, action, entity_type, entity_id, request_id) VALUES (NULL, 'content.slugs_normalized', 'content', ?, ?)", [`count:${changes.length}`, randomUUID()]);
      await connection.commit();
    } catch (error) { await connection.rollback(); throw error; }
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } finally { await connection.end(); }
}

main().catch((error: unknown) => { process.stderr.write(`Imported-post slug normalization failed: ${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1; });
