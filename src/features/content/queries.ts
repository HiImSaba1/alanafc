import "server-only";
import { and, asc, desc, eq, inArray, isNotNull, isNull, like, lte, ne, notInArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminUsers, contentEntries, contentEntryTaxonomies, contentRevisions, contentTaxonomies, legacyRedirects, mediaAssets } from "@/lib/db/schema";

const visibleNow = () => and(
  eq(contentEntries.migrationStatus, "draft"),
  or(eq(contentEntries.publicationStatus, "published"), and(eq(contentEntries.publicationStatus, "scheduled"), lte(contentEntries.scheduledFor, new Date()))),
);

export type ContentRecord = typeof contentEntries.$inferSelect;
export type MediaRecord = typeof mediaAssets.$inferSelect;

export function preferredMediaUrl(media: MediaRecord | null): string | null {
  if (!media) return null;
  const derivatives = Array.isArray(media.derivativeManifest) ? media.derivativeManifest as Array<{ width?: number; publicPath?: string }> : [];
  const best = [...derivatives].filter((item) => item.publicPath).sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];
  return best?.publicPath || media.sourceRelativePath || null;
}

async function withFeaturedMedia(rows: ContentRecord[]) {
  const galleryIds = rows.flatMap((item) => Array.isArray(item.galleryMediaExternalIds) ? item.galleryMediaExternalIds.filter((value): value is string => typeof value === "string") : []);
  const ids = [...new Set([...rows.map((item) => item.featuredMediaExternalId).filter((value): value is string => Boolean(value)), ...galleryIds])];
  if (!ids.length) return rows.map((content) => ({ content, media: null as MediaRecord | null, gallery: [] as MediaRecord[] }));
  const media = await db.select().from(mediaAssets).where(inArray(mediaAssets.externalId, ids));
  const byExternalId = new Map(media.map((item) => [item.externalId, item]));
  return rows.map((content) => {
    const contentGalleryIds = Array.isArray(content.galleryMediaExternalIds) ? content.galleryMediaExternalIds.filter((value): value is string => typeof value === "string") : [];
    return { content, media: content.featuredMediaExternalId ? byExternalId.get(content.featuredMediaExternalId) ?? null : null, gallery: contentGalleryIds.map((id) => byExternalId.get(id)).filter((item): item is MediaRecord => Boolean(item)) };
  });
}

export async function publicPageBySlug(slug: string) {
  const rows = await db.select().from(contentEntries).where(and(eq(contentEntries.kind, "page"), eq(contentEntries.slug, slug), visibleNow())).limit(1);
  return (await withFeaturedMedia(rows))[0] ?? null;
}

export async function publicPostBySlug(slug: string) {
  const rows = await db.select().from(contentEntries).where(and(eq(contentEntries.kind, "post"), eq(contentEntries.slug, slug), visibleNow())).limit(1);
  return (await withFeaturedMedia(rows))[0] ?? null;
}

export async function publicPostRedirect(slug: string) {
  return publicRedirectByPath(`/news/${slug}`);
}

export async function publicRedirectByPath(sourcePath: string) {
  const rows = await db.select({ targetPath: legacyRedirects.targetPath, statusCode: legacyRedirects.statusCode }).from(legacyRedirects).where(eq(legacyRedirects.sourcePath, sourcePath)).limit(1);
  const match = rows[0];
  return match?.targetPath.startsWith("/") && !match.targetPath.startsWith("//") ? match : null;
}

export async function publicPostContext(content: ContentRecord) {
  const anchor = content.publishedAt ?? content.createdAt;
  const time = sql`COALESCE(${contentEntries.publishedAt}, ${contentEntries.createdAt})`;
  const newerThanCurrent = or(sql`${time} > ${anchor}`, and(sql`${time} = ${anchor}`, sql`${contentEntries.id} > ${content.id}`));
  const olderThanCurrent = or(sql`${time} < ${anchor}`, and(sql`${time} = ${anchor}`, sql`${contentEntries.id} < ${content.id}`));
  const [newerRows, olderRows, categoryRows] = await Promise.all([
    db.select({ slug: contentEntries.slug, title: contentEntries.title }).from(contentEntries).where(and(eq(contentEntries.kind, "post"), visibleNow(), ne(contentEntries.id, content.id), newerThanCurrent)).orderBy(asc(time), asc(contentEntries.id)).limit(1),
    db.select({ slug: contentEntries.slug, title: contentEntries.title }).from(contentEntries).where(and(eq(contentEntries.kind, "post"), visibleNow(), ne(contentEntries.id, content.id), olderThanCurrent)).orderBy(desc(time), desc(contentEntries.id)).limit(1),
    db.select({ id: contentTaxonomies.id, name: contentTaxonomies.name }).from(contentTaxonomies).innerJoin(contentEntryTaxonomies, eq(contentEntryTaxonomies.taxonomyId, contentTaxonomies.id)).where(and(eq(contentEntryTaxonomies.contentEntryId, content.id), eq(contentTaxonomies.taxonomy, "category"))),
  ]);
  const categoryIds = categoryRows.map((item) => item.id);
  const relatedRows = categoryIds.length ? await db.select({ content: contentEntries }).from(contentEntries)
    .innerJoin(contentEntryTaxonomies, eq(contentEntryTaxonomies.contentEntryId, contentEntries.id))
    .where(and(eq(contentEntries.kind, "post"), visibleNow(), ne(contentEntries.id, content.id), inArray(contentEntryTaxonomies.taxonomyId, categoryIds)))
    .orderBy(desc(contentEntries.publishedAt), desc(contentEntries.id)).limit(12).then((rows) => [...new Map(rows.map((item) => [item.content.id, item.content])).values()].slice(0, 3)) : [];
  return { newer: newerRows[0] ?? null, older: olderRows[0] ?? null, categories: categoryRows.map((item) => item.name), related: await withFeaturedMedia(relatedRows) };
}

export async function publicPosts(filters: { category?: string; year?: number; limit?: number; offset?: number } = {}) {
  const conditions = [eq(contentEntries.kind, "post"), visibleNow()];
  if (filters.year) conditions.push(sql`YEAR(${contentEntries.publishedAt}) = ${filters.year}`);
  let rows: ContentRecord[];
  if (filters.category) {
    rows = await db.select({ content: contentEntries }).from(contentEntries)
      .innerJoin(contentEntryTaxonomies, eq(contentEntryTaxonomies.contentEntryId, contentEntries.id))
      .innerJoin(contentTaxonomies, eq(contentTaxonomies.id, contentEntryTaxonomies.taxonomyId))
      .where(and(...conditions, eq(contentTaxonomies.taxonomy, "category"), eq(contentTaxonomies.slug, filters.category)))
      .orderBy(desc(contentEntries.publishedAt), desc(contentEntries.id)).limit(filters.limit ?? 24).offset(filters.offset ?? 0).then((result) => result.map((item) => item.content));
  } else {
    rows = await db.select().from(contentEntries).where(and(...conditions)).orderBy(desc(contentEntries.publishedAt), desc(contentEntries.id)).limit(filters.limit ?? 24).offset(filters.offset ?? 0);
  }
  return withFeaturedMedia(rows);
}

export async function publicPostCount(filters: { category?: string; year?: number } = {}) {
  const conditions = [eq(contentEntries.kind, "post"), visibleNow()];
  if (filters.year) conditions.push(sql`YEAR(${contentEntries.publishedAt}) = ${filters.year}`);
  if (filters.category) {
    const rows = await db.select({ total: sql<number>`COUNT(DISTINCT ${contentEntries.id})` }).from(contentEntries)
      .innerJoin(contentEntryTaxonomies, eq(contentEntryTaxonomies.contentEntryId, contentEntries.id))
      .innerJoin(contentTaxonomies, eq(contentTaxonomies.id, contentEntryTaxonomies.taxonomyId))
      .where(and(...conditions, eq(contentTaxonomies.taxonomy, "category"), eq(contentTaxonomies.slug, filters.category)));
    return Number(rows[0]?.total ?? 0);
  }
  const rows = await db.select({ total: sql<number>`COUNT(*)` }).from(contentEntries).where(and(...conditions));
  return Number(rows[0]?.total ?? 0);
}

export async function publicNewsFilters() {
  const categories = await db.select({ name: contentTaxonomies.name, slug: contentTaxonomies.slug }).from(contentTaxonomies)
    .where(eq(contentTaxonomies.taxonomy, "category")).orderBy(asc(contentTaxonomies.name));
  const years = await db.select({ year: sql<number>`YEAR(${contentEntries.publishedAt})` }).from(contentEntries)
    .where(and(eq(contentEntries.kind, "post"), visibleNow())).groupBy(sql`YEAR(${contentEntries.publishedAt})`).orderBy(desc(sql`YEAR(${contentEntries.publishedAt})`));
  return { categories, years: years.map((item) => Number(item.year)).filter(Boolean) };
}

export async function publicSitemapEntries() {
  return db.select({ kind: contentEntries.kind, slug: contentEntries.slug, updatedAt: contentEntries.updatedAt }).from(contentEntries)
    .where(visibleNow()).orderBy(desc(contentEntries.updatedAt));
}

export type AdminContentFilters = { query?: string; kind?: "page" | "post"; status?: "draft" | "published" | "scheduled" | "archived"; limit?: number; offset?: number };

function adminContentConditions(filters: AdminContentFilters) {
  const conditions = [];
  if (filters.query) conditions.push(or(like(contentEntries.title, `%${filters.query}%`), like(contentEntries.slug, `%${filters.query}%`))!);
  if (filters.kind) conditions.push(eq(contentEntries.kind, filters.kind));
  if (filters.status) conditions.push(eq(contentEntries.publicationStatus, filters.status));
  return conditions;
}

export async function adminContentList(filters: AdminContentFilters = {}) {
  const conditions = adminContentConditions(filters);
  return db.select().from(contentEntries).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(contentEntries.updatedAt), desc(contentEntries.id)).limit(filters.limit ?? 30).offset(filters.offset ?? 0);
}

export async function adminContentCount(filters: AdminContentFilters = {}) {
  const conditions = adminContentConditions(filters);
  const rows = await db.select({ total: sql<number>`COUNT(*)` }).from(contentEntries).where(conditions.length ? and(...conditions) : undefined);
  return Number(rows[0]?.total ?? 0);
}

export async function adminContentById(id: number) {
  const rows = await db.select().from(contentEntries).where(eq(contentEntries.id, id)).limit(1);
  if (!rows[0]) return null;
  const categories = await db.select({ name: contentTaxonomies.name }).from(contentTaxonomies)
    .innerJoin(contentEntryTaxonomies, eq(contentEntryTaxonomies.taxonomyId, contentTaxonomies.id))
    .where(and(eq(contentEntryTaxonomies.contentEntryId, id), eq(contentTaxonomies.taxonomy, "category")));
  return { ...rows[0], categories: categories.map((item) => item.name) };
}

export async function adminContentRevisions(id: number) {
  return db.select({ revisionNumber: contentRevisions.revisionNumber, changeSummary: contentRevisions.changeSummary, createdAt: contentRevisions.createdAt, editorName: adminUsers.displayName })
    .from(contentRevisions).leftJoin(adminUsers, eq(contentRevisions.editorUserId, adminUsers.id))
    .where(eq(contentRevisions.contentEntryId, id)).orderBy(desc(contentRevisions.revisionNumber)).limit(10);
}

export async function mediaByExternalId(externalId: string | null) {
  if (!externalId) return null;
  const rows = await db.select().from(mediaAssets).where(eq(mediaAssets.externalId, externalId)).limit(1);
  return rows[0] ?? null;
}

export async function mediaByExternalIds(externalIds: unknown) {
  const ids = Array.isArray(externalIds) ? externalIds.filter((value): value is string => typeof value === "string") : [];
  if (!ids.length) return [];
  return db.select().from(mediaAssets).where(inArray(mediaAssets.externalId, ids));
}

export async function adminMediaLibrary(limit = 80) {
  const rows = await db.select().from(mediaAssets).where(eq(mediaAssets.status, "ready")).orderBy(desc(mediaAssets.updatedAt), desc(mediaAssets.id)).limit(Math.min(Math.max(limit, 1), 120));
  return rows.map((item) => ({ externalId: item.externalId, src: preferredMediaUrl(item), alt: item.altText || item.filename, filename: item.filename, width: item.width, height: item.height })).filter((item): item is { externalId: string; src: string; alt: string; filename: string; width: number | null; height: number | null } => Boolean(item.src));
}

export async function adminMediaById(id: number) {
  if (!Number.isInteger(id) || id < 1) return null;
  const rows = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
  const item = rows[0];
  if (!item) return null;
  const content = await db
    .select({
      id: contentEntries.id,
      title: contentEntries.title,
      featuredMediaExternalId: contentEntries.featuredMediaExternalId,
      galleryMediaExternalIds: contentEntries.galleryMediaExternalIds,
    })
    .from(contentEntries);
  const usedBy = content
    .filter(
      (entry) =>
        entry.featuredMediaExternalId === item.externalId ||
        (Array.isArray(entry.galleryMediaExternalIds) &&
          entry.galleryMediaExternalIds.includes(item.externalId)),
    )
    .map(({ id: contentId, title }) => ({ id: contentId, title }));
  return { ...item, usedBy };
}

export async function adminMediaCatalog(filters: { query?: string; status?: "ready" | "missing" | "quarantined"; usage?: "used" | "unused"; seo?: "complete" | "missing"; limit?: number; offset?: number } = {}) {
  const conditions = [];
  if (filters.query) conditions.push(or(like(mediaAssets.filename, `%${filters.query}%`), like(mediaAssets.altText, `%${filters.query}%`), like(mediaAssets.caption, `%${filters.query}%`))!);
  if (filters.status) conditions.push(eq(mediaAssets.status, filters.status));
  if (filters.seo === "missing") conditions.push(or(isNull(mediaAssets.altText), eq(mediaAssets.altText, ""))!);
  if (filters.seo === "complete") conditions.push(and(isNotNull(mediaAssets.altText), ne(mediaAssets.altText, ""))!);
  if (filters.usage) {
    const references = await db.select({ featured: contentEntries.featuredMediaExternalId, gallery: contentEntries.galleryMediaExternalIds }).from(contentEntries);
    const usedExternalIds = [...new Set(references.flatMap((entry) => [
      entry.featured,
      ...(Array.isArray(entry.gallery) ? entry.gallery : []),
    ]).filter((value): value is string => typeof value === "string" && value.length > 0))];
    if (filters.usage === "used") conditions.push(usedExternalIds.length ? inArray(mediaAssets.externalId, usedExternalIds) : sql`1 = 0`);
    if (filters.usage === "unused" && usedExternalIds.length) conditions.push(notInArray(mediaAssets.externalId, usedExternalIds));
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const [items, totals] = await Promise.all([
    db.select().from(mediaAssets).where(where).orderBy(desc(mediaAssets.updatedAt), desc(mediaAssets.id)).limit(filters.limit ?? 30).offset(filters.offset ?? 0),
    db.select({ total: sql<number>`COUNT(*)` }).from(mediaAssets).where(where),
  ]);
  const externalIds = new Set(items.map((item) => item.externalId));
  const usage = new Map<string, Array<{ id: number; title: string }>>();
  if (externalIds.size) {
    const content = await db.select({ id: contentEntries.id, title: contentEntries.title, featuredMediaExternalId: contentEntries.featuredMediaExternalId, galleryMediaExternalIds: contentEntries.galleryMediaExternalIds }).from(contentEntries);
    for (const entry of content) {
      const referenced = new Set(
        [
          entry.featuredMediaExternalId,
          ...(Array.isArray(entry.galleryMediaExternalIds)
            ? entry.galleryMediaExternalIds.filter(
                (value): value is string => typeof value === "string",
              )
            : []),
        ].filter(
          (value): value is string =>
            typeof value === "string" && externalIds.has(value),
        ),
      );
      for (const externalId of referenced) usage.set(externalId, [...(usage.get(externalId) || []), { id: entry.id, title: entry.title }]);
    }
  }
  return { items: items.map((item) => ({ ...item, usedBy: usage.get(item.externalId) || [] })), total: Number(totals[0]?.total ?? 0) };
}

export async function adminMediaHealthSummary() {
  const [assets, references] = await Promise.all([
    db.select({ externalId: mediaAssets.externalId, status: mediaAssets.status, altText: mediaAssets.altText, sha256: mediaAssets.sha256 }).from(mediaAssets),
    db.select({ featured: contentEntries.featuredMediaExternalId, gallery: contentEntries.galleryMediaExternalIds }).from(contentEntries),
  ]);
  const knownExternalIds = new Set(assets.map((asset) => asset.externalId));
  const usedExternalIds = new Set(references.flatMap((entry) => [
    entry.featured,
    ...(Array.isArray(entry.gallery) ? entry.gallery : []),
  ]).filter((value): value is string => typeof value === "string" && knownExternalIds.has(value)));
  const checksumCounts = new Map<string, number>();
  for (const asset of assets) if (asset.sha256) checksumCounts.set(asset.sha256, (checksumCounts.get(asset.sha256) || 0) + 1);
  return {
    total: assets.length,
    used: usedExternalIds.size,
    unused: assets.length - usedExternalIds.size,
    missingAlt: assets.filter((asset) => !asset.altText?.trim()).length,
    unavailable: assets.filter((asset) => asset.status === "missing").length,
    duplicateGroups: [...checksumCounts.values()].filter((count) => count > 1).length,
  };
}

export async function adminDuplicateMediaGroups() {
  const [assets, content] = await Promise.all([
    db.select().from(mediaAssets).where(isNotNull(mediaAssets.sha256)).orderBy(desc(mediaAssets.updatedAt), desc(mediaAssets.id)),
    db.select({ id: contentEntries.id, title: contentEntries.title, featured: contentEntries.featuredMediaExternalId, gallery: contentEntries.galleryMediaExternalIds }).from(contentEntries),
  ]);
  const usage = new Map<string, Array<{ id: number; title: string }>>();
  for (const entry of content) {
    const referenced = new Set([entry.featured, ...(Array.isArray(entry.gallery) ? entry.gallery : [])].filter((value): value is string => typeof value === "string"));
    for (const externalId of referenced) usage.set(externalId, [...(usage.get(externalId) || []), { id: entry.id, title: entry.title }]);
  }
  const groups = new Map<string, typeof assets>();
  for (const asset of assets) {
    if (!asset.sha256) continue;
    groups.set(asset.sha256, [...(groups.get(asset.sha256) || []), asset]);
  }
  return [...groups.entries()]
    .filter(([, items]) => items.length > 1)
    .map(([sha256, items]) => ({ sha256, items: items.map((item) => ({ ...item, usedBy: usage.get(item.externalId) || [] })) }))
    .sort((left, right) => right.items.length - left.items.length || left.sha256.localeCompare(right.sha256));
}
