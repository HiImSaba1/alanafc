import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, extname, relative, resolve } from "node:path";
import { createInterface } from "node:readline";
import { inspectWordPressExport, safeQuarantineItems, type InspectedWordPressItem } from "../src/features/wordpress-import/inspect";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

function argumentValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

async function filesBelow(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  }));
  return nested.flat().sort((a, b) => a.localeCompare(b));
}

function urlBasename(value: string): string {
  try {
    return decodeURIComponent(basename(new URL(value).pathname)).toLowerCase();
  } catch {
    return basename(value).toLowerCase();
  }
}

function canonicalBasename(value: string): string {
  return value.toLowerCase().replace(/ \(\d+\)(?=\.[^.]+$)/, "");
}

function isLikelyThemePlaceholder(value: string): boolean {
  return /(?:^|[-_])ph(?:[-_.]|$)/i.test(value) || /^\d+x(?:\d+|-)[^/]*\.(?:jpe?g|png)$/i.test(value);
}

function countBy(items: string[]): Record<string, number> {
  return items.reduce<Record<string, number>>((counts, item) => {
    counts[item || "unknown"] = (counts[item || "unknown"] ?? 0) + 1;
    return counts;
  }, {});
}

function duplicateGroups(items: InspectedWordPressItem[]) {
  const groups = new Map<string, Array<{ source: string; postType: string }>>();
  for (const item of items) {
    groups.set(item.externalId, [...(groups.get(item.externalId) ?? []), { source: item.sourceUrl, postType: item.postType }]);
  }
  return [...groups.entries()].filter(([, values]) => values.length > 1)
    .map(([externalId, occurrences]) => ({ externalId, occurrences }));
}

async function inspectSqlDump(filePath: string) {
  const tables: string[] = [];
  let database: string | null = null;
  let dumpVersion: string | null = null;
  let serverVersion: string | null = null;
  const lines = createInterface({ input: createReadStream(filePath, { encoding: "utf8" }), crlfDelay: Infinity });
  for await (const line of lines) {
    dumpVersion ??= line.match(/^-- version (.+)$/)?.[1] ?? null;
    database ??= line.match(/^-- (?:Database|Βάση δεδομένων): `([^`]+)`/)?.[1] ?? null;
    serverVersion ??= line.match(/^-- (?:Server version|Έκδοση διακομιστή): (.+)$/)?.[1] ?? null;
    const table = line.match(/^CREATE TABLE `([^`]+)`/)?.[1];
    if (table) tables.push(table);
  }
  return {
    file: basename(filePath),
    bytes: (await stat(filePath)).size,
    sha256: await sha256File(filePath),
    database,
    dumpVersion,
    serverVersion,
    tableCount: tables.length,
    tables: tables.sort(),
    importPerformed: false,
  };
}

async function main(): Promise<void> {
  const xmlDirectory = resolve(argumentValue("--xml-dir") ?? "../alana_academy_xml");
  const imageDirectory = resolve(argumentValue("--image-dir") ?? "../alana_fc_academy_images_wordpress");
  const sqlPath = resolve(argumentValue("--sql") ?? "../wp_alanafc.sql");
  const outputPath = resolve(argumentValue("--output") ?? "artifacts/verification/sprint-00-inventory.json");
  const summaryPath = outputPath.replace(/\.json$/i, ".md");
  const xmlFiles = (await filesBelow(xmlDirectory)).filter((file) => extname(file).toLowerCase() === ".xml");
  const sourceReports = [];
  const allItems: InspectedWordPressItem[] = [];

  for (const file of xmlFiles) {
    const inspection = inspectWordPressExport(await readFile(file, "utf8"));
    allItems.push(...inspection.items);
    sourceReports.push({
      file: basename(file),
      bytes: (await stat(file)).size,
      sha256: await sha256File(file),
      source: inspection.source,
      totals: inspection.totals,
      quarantine: safeQuarantineItems(inspection),
    });
  }

  const imageFiles = (await filesBelow(imageDirectory)).filter((file) => IMAGE_EXTENSIONS.has(extname(file).toLowerCase()));
  const images = await Promise.all(imageFiles.map(async (file) => ({
    file: relative(imageDirectory, file).replaceAll("\\", "/"),
    basename: basename(file).toLowerCase(),
    extension: extname(file).toLowerCase(),
    bytes: (await stat(file)).size,
    sha256: await sha256File(file),
  })));
  const hashes = new Map<string, string[]>();
  for (const image of images) hashes.set(image.sha256, [...(hashes.get(image.sha256) ?? []), image.file]);

  const localBasenames = new Set(images.map((image) => image.basename));
  const localCanonicalBasenames = new Set(images.map((image) => canonicalBasename(image.basename)));
  const attachmentNames = new Set(allItems.filter((item) => item.postType === "attachment" && item.attachmentUrl)
    .map((item) => urlBasename(item.attachmentUrl ?? "")));
  const matchedAttachmentNames = [...attachmentNames].filter((name) => localBasenames.has(name));
  const missingLocalFiles = [...attachmentNames].filter((name) => !localBasenames.has(name)).sort();
  const unmatchedLocalFiles = images.filter((image) => !attachmentNames.has(image.basename)).map((image) => image.file).sort();
  const canonicalAttachmentMatches = [...attachmentNames]
    .filter((name) => !localBasenames.has(name) && localCanonicalBasenames.has(canonicalBasename(name)))
    .sort();
  const missingAfterCanonicalMatch = missingLocalFiles
    .filter((name) => !localCanonicalBasenames.has(canonicalBasename(name)))
    .sort();
  const likelyMissingThemePlaceholders = missingAfterCanonicalMatch.filter(isLikelyThemePlaceholder);
  const unresolvedMissingMedia = missingAfterCanonicalMatch.filter((name) => !isLikelyThemePlaceholder(name));
  const unmatchedAfterCanonicalMatch = images
    .filter((image) => ![...attachmentNames].some((name) => canonicalBasename(name) === canonicalBasename(image.basename)))
    .map((image) => image.file)
    .sort();
  const sql = await inspectSqlDump(sqlPath);

  const report = {
    schemaVersion: 1,
    inspectedAt: new Date().toISOString(),
    writesPerformed: false,
    targetDatabase: "next_alanafcacademy",
    inputs: { xmlDirectory: basename(xmlDirectory), imageDirectory: basename(imageDirectory) },
    totals: {
      xmlFiles: xmlFiles.length,
      wordpressItems: allItems.length,
      byPostType: countBy(allItems.map((item) => item.postType)),
      byStatus: countBy(allItems.map((item) => item.status)),
      localImages: images.length,
      localImageBytes: images.reduce((total, image) => total + image.bytes, 0),
      uniqueAttachmentBasenames: attachmentNames.size,
      matchedAttachmentBasenames: matchedAttachmentNames.length,
      canonicalAttachmentMatches: canonicalAttachmentMatches.length,
      missingLocalFiles: missingLocalFiles.length,
      unresolvedMissingMedia: unresolvedMissingMedia.length,
      unmatchedLocalFiles: unmatchedLocalFiles.length,
      unmatchedAfterCanonicalMatch: unmatchedAfterCanonicalMatch.length,
    },
    sources: sourceReports,
    legacyDatabase: sql,
    reconciliation: {
      duplicateExternalIds: duplicateGroups(allItems),
      duplicateLocalFilesByHash: [...hashes.entries()].filter(([, files]) => files.length > 1)
        .map(([sha256, files]) => ({ sha256, files })),
      canonicalAttachmentMatches,
      missingLocalFiles,
      likelyMissingThemePlaceholders,
      unresolvedMissingMedia,
      unmatchedLocalFiles,
      unmatchedAfterCanonicalMatch,
    },
    images,
  };

  const summary = `# Sprint 00 content inventory\n\nGenerated: ${report.inspectedAt}\n\n` +
    `- Writes/imports performed: **no**\n- Target application database: **${report.targetDatabase}**\n` +
    `- XML exports: **${report.totals.xmlFiles}**\n- WordPress items: **${report.totals.wordpressItems}**\n` +
    `- Items by type: \`${JSON.stringify(report.totals.byPostType)}\`\n- Items by status: \`${JSON.stringify(report.totals.byStatus)}\`\n` +
    `- Local images: **${report.totals.localImages}** (${report.totals.localImageBytes} bytes)\n` +
    `- Exact attachment filename matches: **${report.totals.matchedAttachmentBasenames}**\n` +
    `- Additional canonical filename matches: **${report.totals.canonicalAttachmentMatches}**\n` +
    `- Attachment filenames missing locally: **${report.totals.missingLocalFiles}**\n` +
    `- Unresolved missing media after canonical/placeholder classification: **${report.totals.unresolvedMissingMedia}**\n` +
    `- Local filenames without an attachment match: **${report.totals.unmatchedLocalFiles}**\n` +
    `- Local filenames unmatched after canonical comparison: **${report.totals.unmatchedAfterCanonicalMatch}**\n` +
    `- Duplicate external IDs across exports: **${report.reconciliation.duplicateExternalIds.length}**\n` +
    `- Duplicate local image groups by SHA-256: **${report.reconciliation.duplicateLocalFilesByHash.length}**\n` +
    `- Legacy SQL tables: **${report.legacyDatabase.tableCount}** (inspected only)\n\n` +
    `Review the JSON report for checksums and reconciliation details. No content was imported or published.\n`;

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(summaryPath, summary, "utf8");
  process.stdout.write(`${summary}\nJSON: ${outputPath}\nSummary: ${summaryPath}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`Sprint 00 inspection failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
