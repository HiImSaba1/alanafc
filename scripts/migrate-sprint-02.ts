import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { copyFile, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, extname, relative, resolve } from "node:path";
import mysql from "mysql2/promise";
import sharp from "sharp";
import { buildContentSeo, buildSeoImageFilename } from "../src/features/seo/content-seo";
import { deduplicateByExternalId, parseMigrationSource, type MigratableContent, type MigratableMedia } from "../src/features/wordpress-import/migration";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const DERIVATIVE_WIDTHS = [640, 1280, 1920] as const;
const CONFIRM_FLAG = "--confirm-draft-import";

type LocalImage = {
  absolutePath: string;
  relativePath: string;
  publicPath: string;
  filename: string;
  canonicalFilename: string;
  sha256: string;
  bytes: number;
  width: number | null;
  height: number | null;
  mimeType: string | null;
};

function argumentValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function filesBelow(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  }));
  return nested.flat().sort((a, b) => a.localeCompare(b));
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

function canonicalFilename(value: string): string {
  return value.toLocaleLowerCase("en-US").replace(/ \(\d+\)(?=\.[^.]+$)/, "");
}

function safeUrlPath(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (!/(^|\.)alanafc\.gr$/i.test(parsed.hostname)) return null;
    return parsed.pathname.replace(/\/{2,}/g, "/") || "/";
  } catch { return null; }
}

function targetPath(content: MigratableContent): string {
  return content.kind === "post" ? `/news/${content.slug}` : `/${content.slug}`;
}

function resolveSlugCollisions(contents: MigratableContent[]): MigratableContent[] {
  const used = new Set<string>();
  return [...contents].sort((a, b) => Number(a.externalId) - Number(b.externalId)).map((content) => {
    const key = `${content.kind}:${content.slug}`;
    if (!used.has(key)) { used.add(key); return content; }
    const slug = `${content.slug}-${content.externalId}`;
    used.add(`${content.kind}:${slug}`);
    return { ...content, slug };
  });
}

async function inspectLocalImages(imageDirectory: string): Promise<LocalImage[]> {
  const files = (await filesBelow(imageDirectory)).filter((file) => IMAGE_EXTENSIONS.has(extname(file).toLowerCase()));
  return Promise.all(files.map(async (absolutePath) => {
    const metadata = await sharp(absolutePath, { animated: false }).metadata().catch(() => null);
    const filename = basename(absolutePath);
    const relativePath = relative(imageDirectory, absolutePath).replaceAll("\\", "/");
    return {
      absolutePath,
      relativePath,
      publicPath: `/alana_fc_academy_images_wordpress/${relativePath}`,
      filename,
      canonicalFilename: canonicalFilename(filename),
      sha256: await sha256File(absolutePath),
      bytes: (await stat(absolutePath)).size,
      width: metadata?.width ?? null,
      height: metadata?.height ?? null,
      mimeType: metadata?.format ? `image/${String(metadata.format)}` : null,
    };
  }));
}

function matchMedia(media: MigratableMedia[], images: LocalImage[]) {
  const exact = new Map<string, LocalImage[]>();
  const canonical = new Map<string, LocalImage[]>();
  for (const image of images) {
    const key = image.filename.toLocaleLowerCase("en-US");
    exact.set(key, [...(exact.get(key) ?? []), image]);
    canonical.set(image.canonicalFilename, [...(canonical.get(image.canonicalFilename) ?? []), image]);
  }
  return media.map((item) => {
    const key = item.filename.toLocaleLowerCase("en-US");
    const candidates = exact.get(key) ?? canonical.get(canonicalFilename(key)) ?? [];
    const selected = [...candidates].sort((a, b) => a.relativePath.localeCompare(b.relativePath))[0] ?? null;
    return { item, selected, candidateCount: candidates.length };
  });
}

function derivativeManifest(image: LocalImage | null, media: MigratableMedia, contentById: Map<string, MigratableContent>) {
  if (!image) return [];
  const parent = media.parentExternalId ? contentById.get(media.parentExternalId) : null;
  const seoName = parent?.seoTitle || parent?.title || media.title || media.filename.replace(/\.[^.]+$/, "");
  return DERIVATIVE_WIDTHS.filter((width) => !image.width || width < image.width).map((width) => {
    const filename = buildSeoImageFilename({ seoName, imageNumber: media.externalId, width });
    const relativePath = `${image.sha256}/${filename}`;
    return { width, format: "webp", filename, relativePath, publicPath: `/media/${relativePath}` };
  });
}

async function writeMediaFiles(matches: ReturnType<typeof matchMedia>, storageDirectory: string, contentById: Map<string, MigratableContent>): Promise<void> {
  const writtenOriginals = new Set<string>();
  const writtenDerivatives = new Set<string>();
  for (const { item, selected: image } of matches) {
    if (!image) continue;
    const outputDirectory = resolve(storageDirectory, image.sha256);
    await mkdir(outputDirectory, { recursive: true });
    if (!writtenOriginals.has(image.sha256)) {
      await copyFile(image.absolutePath, resolve(outputDirectory, `original${extname(image.filename).toLowerCase()}`));
      writtenOriginals.add(image.sha256);
    }
    for (const derivative of derivativeManifest(image, item, contentById)) {
      if (writtenDerivatives.has(derivative.relativePath)) continue;
      await sharp(image.absolutePath).rotate().resize({ width: derivative.width, withoutEnlargement: true }).webp({ quality: 84 })
        .toFile(resolve(storageDirectory, derivative.relativePath));
      writtenDerivatives.add(derivative.relativePath);
    }
  }
}

async function persistDraftImport(input: {
  sourceFingerprint: string;
  contents: MigratableContent[];
  mediaMatches: ReturnType<typeof matchMedia>;
  contentById: Map<string, MigratableContent>;
  report: Record<string, unknown>;
}): Promise<void> {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing.");
  const parsedUrl = new URL(process.env.DATABASE_URL);
  if (parsedUrl.pathname.replace(/^\//, "") !== "next_alanafcacademy") throw new Error("Import is restricted to next_alanafcacademy.");
  const connection = await mysql.createConnection({ uri: process.env.DATABASE_URL });
  await connection.beginTransaction();
  try {
    const [run] = await connection.execute<mysql.ResultSetHeader>(
      "INSERT INTO content_import_runs (source_fingerprint, mode, status) VALUES (?, 'draft_import', 'running')",
      [input.sourceFingerprint],
    );
    for (const match of input.mediaMatches) {
      const image = match.selected;
      const status = match.item.risks.length ? "quarantined" : image ? "ready" : "missing";
      await connection.execute(
        `INSERT INTO media_assets (external_id, filename, source_url, source_relative_path, sha256, mime_type, byte_size, width, height, alt_text, caption, credit, derivative_manifest, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE filename=VALUES(filename), source_url=VALUES(source_url), source_relative_path=VALUES(source_relative_path), sha256=VALUES(sha256), mime_type=VALUES(mime_type), byte_size=VALUES(byte_size), width=VALUES(width), height=VALUES(height), alt_text=VALUES(alt_text), caption=VALUES(caption), credit=VALUES(credit), derivative_manifest=VALUES(derivative_manifest), status=VALUES(status)`,
        [match.item.externalId, match.item.filename, match.item.sourceUrl, image?.publicPath ?? null, image?.sha256 ?? null,
          image?.mimeType ?? null, image?.bytes ?? null, image?.width ?? null, image?.height ?? null, match.item.altText,
          match.item.caption, match.item.credit, JSON.stringify(derivativeManifest(image, match.item, input.contentById)), status],
      );
    }
    for (const content of input.contents) {
      const migrationStatus = content.risks.length ? "quarantined" : "draft";
      if (migrationStatus === "quarantined") {
        await connection.execute(
          `INSERT INTO content_quarantine (external_id, post_type, title, source_url, reason_json, source_checksum)
           VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title), source_url=VALUES(source_url), reason_json=VALUES(reason_json), source_checksum=VALUES(source_checksum)`,
          [content.externalId, content.kind, content.title, content.sourceUrl, JSON.stringify(content.risks), content.checksum],
        );
        continue;
      }
      await connection.execute(
        `INSERT INTO content_entries (external_id, kind, slug, title, excerpt, body_html, author_name, source_status, migration_status, source_url, source_checksum, featured_media_external_id, seo_title, seo_description, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE slug=VALUES(slug), title=VALUES(title), excerpt=VALUES(excerpt), body_html=VALUES(body_html), author_name=VALUES(author_name), source_status=VALUES(source_status), migration_status=VALUES(migration_status), source_url=VALUES(source_url), source_checksum=VALUES(source_checksum), featured_media_external_id=VALUES(featured_media_external_id), seo_title=VALUES(seo_title), seo_description=VALUES(seo_description), published_at=VALUES(published_at)`,
        [content.externalId, content.kind, content.slug, content.title, content.excerpt, content.bodyHtml, content.authorName || null,
          content.sourceStatus, migrationStatus, content.sourceUrl || null, content.checksum, content.featuredMediaExternalId,
          content.seoTitle, content.seoDescription, content.publishedAt ? new Date(content.publishedAt) : null],
      );
      const [rows] = await connection.execute<mysql.RowDataPacket[]>("SELECT id FROM content_entries WHERE external_id=? AND kind=?", [content.externalId, content.kind]);
      const contentEntryId = Number(rows[0]?.id);
      await connection.execute("DELETE FROM content_entry_taxonomies WHERE content_entry_id=?", [contentEntryId]);
      for (const taxonomy of content.taxonomies) {
        await connection.execute(
          "INSERT INTO content_taxonomies (taxonomy, slug, name) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)",
          [taxonomy.taxonomy, taxonomy.slug, taxonomy.name],
        );
        const [taxonomyRows] = await connection.execute<mysql.RowDataPacket[]>("SELECT id FROM content_taxonomies WHERE taxonomy=? AND slug=?", [taxonomy.taxonomy, taxonomy.slug]);
        await connection.execute("INSERT IGNORE INTO content_entry_taxonomies (content_entry_id, taxonomy_id) VALUES (?, ?)", [contentEntryId, Number(taxonomyRows[0]?.id)]);
      }
      const sourcePath = safeUrlPath(content.sourceUrl);
      const destination = targetPath(content);
      if (sourcePath && sourcePath.replace(/\/$/, "") !== destination.replace(/\/$/, "")) {
        await connection.execute(
          "INSERT INTO legacy_redirects (source_path, target_path, status_code, source_external_id) VALUES (?, ?, 308, ?) ON DUPLICATE KEY UPDATE target_path=VALUES(target_path), source_external_id=VALUES(source_external_id)",
          [sourcePath, destination, content.externalId],
        );
      }
    }
    await connection.execute("UPDATE content_import_runs SET status='completed', report_json=?, completed_at=CURRENT_TIMESTAMP WHERE id=?", [JSON.stringify(input.report), run.insertId]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

async function main(): Promise<void> {
  const doImport = process.argv.includes(CONFIRM_FLAG);
  if (doImport && process.argv.includes("--dry-run")) throw new Error("Choose dry-run or confirmed draft import, not both.");
  if (doImport && process.env.NODE_ENV === "production") throw new Error("Sprint 02 draft import is disabled in production.");
  if (doImport && !process.env.DATABASE_URL) {
    if (await stat(".env.local").catch(() => null)) process.loadEnvFile(".env.local");
  }
  const xmlDirectory = resolve(argumentValue("--xml-dir") ?? "../alana_academy_xml");
  const imageDirectory = resolve(argumentValue("--image-dir") ?? "public/alana_fc_academy_images_wordpress");
  const storageDirectory = resolve(argumentValue("--storage-dir") ?? "public/media");
  const outputPath = resolve(argumentValue("--output") ?? "artifacts/verification/sprint-02-migration.json");
  const xmlFiles = (await filesBelow(xmlDirectory)).filter((file) => extname(file).toLowerCase() === ".xml");
  const sourceFiles = await Promise.all(xmlFiles.map(async (file) => ({ file, sha256: await sha256File(file) })));
  const sourceFingerprint = createHash("sha256").update(JSON.stringify(sourceFiles.map((file) => [basename(file.file), file.sha256]))).digest("hex");
  const parsed = await Promise.all(sourceFiles.map(async ({ file }) => parseMigrationSource(await readFile(file, "utf8"))));
  const dedupedContent = deduplicateByExternalId(parsed.flatMap((source) => source.contents));
  const dedupedMedia = deduplicateByExternalId(parsed.flatMap((source) => source.media));
  const contents = resolveSlugCollisions(dedupedContent.items).map((content) => {
    const seo = buildContentSeo({
      title: content.title,
      excerpt: content.excerpt,
      bodyHtml: content.bodyHtml,
      explicitTitle: content.seoTitle,
      explicitDescription: content.seoDescription,
    });
    return { ...content, seoTitle: seo.title, seoDescription: seo.description };
  });
  const contentById = new Map(contents.map((content) => [content.externalId, content]));
  const images = await inspectLocalImages(imageDirectory);
  const mediaMatches = matchMedia(dedupedMedia.items, images);
  const redirects = contents.filter((content) => content.risks.length === 0)
    .map((content) => ({ sourcePath: safeUrlPath(content.sourceUrl), targetPath: targetPath(content), externalId: content.externalId }))
    .filter((redirect) => redirect.sourcePath && redirect.sourcePath.replace(/\/$/, "") !== redirect.targetPath.replace(/\/$/, ""));
  const report = {
    schemaVersion: 1,
    mode: doImport ? "draft_import" : "dry_run",
    sourceFingerprint,
    sourceFiles: sourceFiles.map((item) => ({ file: basename(item.file), sha256: item.sha256 })),
    guarantees: { productionWrites: false, importedPublicationStatus: "draft_or_quarantined", legacyDatabaseRead: false, emailSent: false },
    totals: {
      contents: contents.length,
      importableDrafts: contents.filter((item) => item.risks.length === 0).length,
      pages: contents.filter((item) => item.kind === "page").length,
      posts: contents.filter((item) => item.kind === "post").length,
      quarantinedContent: contents.filter((item) => item.risks.length).length,
      media: mediaMatches.length,
      matchedMedia: mediaMatches.filter((item) => item.selected).length,
      missingMedia: mediaMatches.filter((item) => !item.selected).length,
      ambiguousMedia: mediaMatches.filter((item) => item.candidateCount > 1).length,
      localImages: images.length,
      legacyFormsReferenceOnly: parsed.flatMap((source) => source.forms).length,
      redirects: redirects.length,
    },
    duplicates: {
      contentIds: dedupedContent.duplicateIds,
      conflictingContentIds: dedupedContent.conflictingIds,
      mediaIds: dedupedMedia.duplicateIds,
      conflictingMediaIds: dedupedMedia.conflictingIds,
    },
    quarantine: contents.filter((item) => item.risks.length).map((item) => ({ externalId: item.externalId, kind: item.kind, title: item.title, sourceUrl: item.sourceUrl, risks: item.risks })),
    missingMedia: mediaMatches.filter((item) => !item.selected).map((item) => ({ externalId: item.item.externalId, filename: item.item.filename, sourceUrl: item.item.sourceUrl })),
    ambiguousMedia: mediaMatches.filter((item) => item.candidateCount > 1).map((item) => ({ externalId: item.item.externalId, filename: item.item.filename, candidates: item.candidateCount, selected: item.selected?.relativePath })),
    redirects,
    contentManifest: contents.map((item) => ({ externalId: item.externalId, kind: item.kind, slug: item.slug, title: item.title, sourceStatus: item.sourceStatus, migrationStatus: item.risks.length ? "quarantined" : "draft", checksum: item.checksum, featuredMediaExternalId: item.featuredMediaExternalId, taxonomyCount: item.taxonomies.length })),
    mediaManifest: mediaMatches.map((match) => ({ externalId: match.item.externalId, parentExternalId: match.item.parentExternalId, filename: match.item.filename, sourceUrl: match.item.sourceUrl, publicPath: match.selected?.publicPath ?? null, sha256: match.selected?.sha256 ?? null, status: match.item.risks.length ? "quarantined" : match.selected ? "ready" : "missing", derivatives: derivativeManifest(match.selected, match.item, contentById) })),
    formsReference: parsed.flatMap((source) => source.forms),
  };

  if (doImport) {
    await writeMediaFiles(mediaMatches, storageDirectory, contentById);
    await persistDraftImport({ sourceFingerprint, contents, mediaMatches, contentById, report });
  }
  const summaryPath = outputPath.replace(/\.json$/i, ".md");
  const summary = `# Sprint 02 migration ${doImport ? "draft import" : "dry run"}\n\n` +
    `- Source fingerprint: \`${sourceFingerprint}\`\n- Database writes: **${doImport ? "draft/quarantine only" : "none"}**\n` +
    `- Content reviewed: **${report.totals.contents}** (${report.totals.pages} pages, ${report.totals.posts} posts)\n` +
    `- Clean draft candidates: **${report.totals.importableDrafts}**\n` +
    `- Quarantined content: **${report.totals.quarantinedContent}**\n- Media: **${report.totals.media}**, matched **${report.totals.matchedMedia}**, missing **${report.totals.missingMedia}**, ambiguous **${report.totals.ambiguousMedia}**\n` +
    `- Legacy contact forms recorded as reference only: **${report.totals.legacyFormsReferenceOnly}**\n- Redirects: **${report.totals.redirects}**\n\n` +
    `No imported entry is published by this process. Review the JSON quarantine and missing-media lists before any later publication.\n`;
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(summaryPath, summary, "utf8");
  process.stdout.write(`${summary}\nJSON: ${outputPath}\nSummary: ${summaryPath}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`Sprint 02 migration failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
