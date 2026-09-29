import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";
import mysql from "mysql2/promise";
import { deduplicateByExternalId, parseMigrationSource } from "../src/features/wordpress-import/migration";

type ContentRow = mysql.RowDataPacket & {
  external_id: string;
  kind: "page" | "post";
  title: string;
  source_checksum: string;
  migration_status: string;
  publication_status: string;
  featured_media_external_id: string | null;
};
type QuarantineRow = mysql.RowDataPacket & { external_id: string; post_type: string; source_checksum: string };
type MediaRow = mysql.RowDataPacket & { external_id: string; status: string; source_relative_path: string | null; derivative_manifest: unknown };
type TaxonomyRow = mysql.RowDataPacket & { external_id: string; kind: string; taxonomy: string; slug: string };

async function filesBelow(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  }));
  return nested.flat().sort((a, b) => a.localeCompare(b));
}

function publicFileExists(publicPath: string | null) {
  if (!publicPath?.startsWith("/")) return false;
  return existsSync(resolve("public", publicPath.replace(/^\/+/, "")));
}

function manifestPaths(value: unknown): string[] {
  const parsed = typeof value === "string" ? (() => { try { return JSON.parse(value) as unknown; } catch { return []; } })() : value;
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const path = (entry as { publicPath?: unknown }).publicPath;
    return typeof path === "string" ? [path] : [];
  });
}

function key(externalId: string, kind: string) {
  return `${kind}:${externalId}`;
}

async function main() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing.");
  const databaseUrl = new URL(process.env.DATABASE_URL);
  if (databaseUrl.pathname.replace(/^\//, "") !== "next_alanafcacademy") throw new Error("Reconciliation is restricted to next_alanafcacademy.");

  const xmlDirectory = resolve("../alana_academy_xml");
  const xmlFiles = (await filesBelow(xmlDirectory)).filter((file) => extname(file).toLowerCase() === ".xml");
  const sources = await Promise.all(xmlFiles.map(async (file) => ({ file, content: await readFile(file, "utf8") })));
  const sourceFingerprint = createHash("sha256").update(JSON.stringify(sources.map(({ file, content }) => [basename(file), createHash("sha256").update(content).digest("hex")]))).digest("hex");
  const parsed = sources.map(({ content }) => parseMigrationSource(content));
  const content = deduplicateByExternalId(parsed.flatMap((source) => source.contents)).items;
  const media = deduplicateByExternalId(parsed.flatMap((source) => source.media)).items;
  const forms = parsed.flatMap((source) => source.forms);
  const safeContent = content.filter((item) => item.risks.length === 0);
  const riskyContent = content.filter((item) => item.risks.length > 0);

  const connection = await mysql.createConnection({ uri: process.env.DATABASE_URL });
  try {
    const [contentRows] = await connection.query<ContentRow[]>("SELECT external_id, kind, title, source_checksum, migration_status, publication_status, featured_media_external_id FROM content_entries");
    const [quarantineRows] = await connection.query<QuarantineRow[]>("SELECT external_id, post_type, source_checksum FROM content_quarantine");
    const [mediaRows] = await connection.query<MediaRow[]>("SELECT external_id, status, source_relative_path, derivative_manifest FROM media_assets");
    const [taxonomyRows] = await connection.query<TaxonomyRow[]>(`SELECT ce.external_id, ce.kind, ct.taxonomy, ct.slug FROM content_entries ce INNER JOIN content_entry_taxonomies cet ON cet.content_entry_id=ce.id INNER JOIN content_taxonomies ct ON ct.id=cet.taxonomy_id`);
    const [runRows] = await connection.query<mysql.RowDataPacket[]>("SELECT status FROM content_import_runs WHERE source_fingerprint=? ORDER BY id DESC LIMIT 1", [sourceFingerprint]);

    const contentByKey = new Map(contentRows.map((row) => [key(String(row.external_id), row.kind), row]));
    const quarantineByKey = new Map(quarantineRows.map((row) => [key(String(row.external_id), row.post_type), row]));
    const mediaById = new Map(mediaRows.map((row) => [String(row.external_id), row]));
    const taxonomyKeys = new Set(taxonomyRows.map((row) => `${key(String(row.external_id), row.kind)}:${row.taxonomy}:${row.slug}`));
    const expectedKeys = new Set(content.map((item) => key(item.externalId, item.kind)));
    const expectedMediaIds = new Set(media.map((item) => item.externalId));

    const missingSafeContent = safeContent.filter((item) => !contentByKey.has(key(item.externalId, item.kind)));
    const missingQuarantine = riskyContent.filter((item) => !quarantineByKey.has(key(item.externalId, item.kind)));
    const modifiedSinceImport = safeContent.filter((item) => {
      const row = contentByKey.get(key(item.externalId, item.kind));
      return row && row.source_checksum !== item.checksum;
    });
    const missingTaxonomies = safeContent.flatMap((item) => item.taxonomies
      .filter((taxonomy) => !taxonomyKeys.has(`${key(item.externalId, item.kind)}:${taxonomy.taxonomy}:${taxonomy.slug}`))
      .map((taxonomy) => ({ externalId: item.externalId, kind: item.kind, taxonomy: taxonomy.taxonomy, slug: taxonomy.slug })));
    const missingMediaRecords = media.filter((item) => !mediaById.has(item.externalId));
    const unavailableMediaFiles = mediaRows.filter((row) => {
      if (!expectedMediaIds.has(String(row.external_id)) || row.status !== "ready") return false;
      const candidates = [row.source_relative_path, ...manifestPaths(row.derivative_manifest)];
      return !candidates.some(publicFileExists);
    });

    const report = {
      ok: missingSafeContent.length === 0 && missingQuarantine.length === 0 && missingMediaRecords.length === 0 && missingTaxonomies.length === 0 && unavailableMediaFiles.length === 0 && runRows[0]?.status === "completed",
      checkedAt: new Date().toISOString(),
      writesPerformed: false,
      database: "next_alanafcacademy",
      sourceFingerprint,
      completedImportRun: runRows[0]?.status === "completed",
      xml: {
        files: xmlFiles.length,
        pages: content.filter((item) => item.kind === "page").length,
        posts: content.filter((item) => item.kind === "post").length,
        safeContent: safeContent.length,
        quarantinedContent: riskyContent.length,
        media: media.length,
        contactFormDefinitionsReferenceOnly: forms.length,
      },
      databaseCounts: {
        importedPages: contentRows.filter((row) => expectedKeys.has(key(String(row.external_id), row.kind)) && row.kind === "page").length,
        importedPosts: contentRows.filter((row) => expectedKeys.has(key(String(row.external_id), row.kind)) && row.kind === "post").length,
        quarantined: quarantineRows.filter((row) => expectedKeys.has(key(String(row.external_id), row.post_type))).length,
        media: mediaRows.filter((row) => expectedMediaIds.has(String(row.external_id))).length,
        publishedImportedContent: contentRows.filter((row) => expectedKeys.has(key(String(row.external_id), row.kind)) && row.publication_status === "published").length,
      },
      reconciliation: {
        missingSafeContent: missingSafeContent.map((item) => ({ externalId: item.externalId, kind: item.kind, title: item.title })),
        missingQuarantine: missingQuarantine.map((item) => ({ externalId: item.externalId, kind: item.kind, title: item.title, risks: item.risks })),
        missingMediaRecords: missingMediaRecords.map((item) => ({ externalId: item.externalId, filename: item.filename })),
        unavailableMediaFiles: unavailableMediaFiles.map((item) => ({ externalId: String(item.external_id), status: item.status })),
        missingTaxonomies,
        modifiedSinceImport: modifiedSinceImport.map((item) => ({ externalId: item.externalId, kind: item.kind, title: item.title })),
      },
      notes: {
        contactForms: "WordPress form definitions are reference-only; the new registration and contact workflows replace them.",
        quarantinedContent: "Quarantined XML records are intentionally retained outside public content and must not be published automatically.",
        modifiedSinceImport: "A checksum difference means the record was edited after import; it is not automatically treated as missing.",
      },
    };

    const output = resolve("artifacts/verification/wordpress-reconciliation.json");
    const summary = resolve("artifacts/verification/wordpress-reconciliation.md");
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    await writeFile(summary, `# WordPress XML reconciliation\n\n- Result: **${report.ok ? "PASS" : "REVIEW REQUIRED"}**\n- Writes performed: **no**\n- XML files: **${report.xml.files}**\n- XML pages/posts: **${report.xml.pages}/${report.xml.posts}**\n- Safe content: **${report.xml.safeContent}**\n- Quarantined content: **${report.xml.quarantinedContent}**\n- Media records: **${report.xml.media}**\n- Legacy form definitions (reference only): **${report.xml.contactFormDefinitionsReferenceOnly}**\n- Missing safe content: **${report.reconciliation.missingSafeContent.length}**\n- Missing quarantine records: **${report.reconciliation.missingQuarantine.length}**\n- Missing media records: **${report.reconciliation.missingMediaRecords.length}**\n- Ready media without a local file: **${report.reconciliation.unavailableMediaFiles.length}**\n- Missing taxonomy links: **${report.reconciliation.missingTaxonomies.length}**\n- Records edited since import: **${report.reconciliation.modifiedSinceImport.length}**\n\nReview the JSON report for bounded examples. No content bodies or private form submissions are included.\n`, "utf8");
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n\nJSON: ${output}\nSummary: ${summary}\n`);
    if (!report.ok) process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`WordPress reconciliation failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
