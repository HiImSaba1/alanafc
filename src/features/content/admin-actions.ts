"use server";

import { createHash, randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit, requireAdmin } from "@/features/admin-auth/session";
import { buildContentSeo } from "@/features/seo/content-seo";
import { normalizeContentSlug, normalizeGreekTitleConjunctions, publicationFromIntent, sanitizeEditorHtml } from "./core";
import { db } from "@/lib/db";
import { articleTemplateKeys } from "@/lib/content-template-keys";
import { contentEntries, contentEntryTaxonomies, contentRevisions, contentTaxonomies } from "@/lib/db/schema";

export type ContentEditorState = { error?: string };

export async function deleteContentAction(formData: FormData) {
  const admin = await requireAdmin();
  if (admin.role !== "owner") throw new Error("Μόνο ο ιδιοκτήτης μπορεί να διαγράψει περιεχόμενο.");
  const parsedId = z.coerce.number().int().positive().safeParse(formData.get("id"));
  if (!parsedId.success) throw new Error("Το περιεχόμενο δεν είναι έγκυρο.");
  const existing = await db.select({ id: contentEntries.id, kind: contentEntries.kind, slug: contentEntries.slug }).from(contentEntries).where(eq(contentEntries.id, parsedId.data)).limit(1);
  if (!existing[0]) throw new Error("Το περιεχόμενο δεν βρέθηκε.");
  await db.delete(contentEntries).where(eq(contentEntries.id, parsedId.data));
  await audit("content.deleted", admin.id, existing[0].kind, String(existing[0].id));
  revalidatePath("/"); revalidatePath("/news"); revalidatePath(`/news/${existing[0].slug}`); revalidatePath("/admin/content"); revalidatePath("/sitemap.xml");
}

export async function restoreContentRevisionAction(formData: FormData) {
  const admin = await requireAdmin();
  if (admin.role !== "owner") throw new Error("Μόνο ο ιδιοκτήτης μπορεί να επαναφέρει revisions.");
  const parsed = z.object({ id: z.coerce.number().int().positive(), revisionNumber: z.coerce.number().int().positive() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Το revision δεν είναι έγκυρο.");
  const restored = await db.transaction(async (transaction) => {
    const currentRows = await transaction.select().from(contentEntries).where(eq(contentEntries.id, parsed.data.id)).limit(1);
    const revisionRows = await transaction.select({ snapshot: contentRevisions.snapshot }).from(contentRevisions).where(and(eq(contentRevisions.contentEntryId, parsed.data.id), eq(contentRevisions.revisionNumber, parsed.data.revisionNumber))).limit(1);
    if (!currentRows[0] || !revisionRows[0]) throw new Error("NOT_FOUND");
    const target = revisionSnapshotSchema.safeParse(revisionRows[0].snapshot);
    if (!target.success) throw new Error("INVALID_REVISION");
    const current = currentRows[0];
    const currentCategories = await transaction.select({ name: contentTaxonomies.name }).from(contentTaxonomies).innerJoin(contentEntryTaxonomies, eq(contentEntryTaxonomies.taxonomyId, contentTaxonomies.id)).where(and(eq(contentEntryTaxonomies.contentEntryId, current.id), eq(contentTaxonomies.taxonomy, "category")));
    const latest = await transaction.select({ value: sql<number>`COALESCE(MAX(${contentRevisions.revisionNumber}), 0)` }).from(contentRevisions).where(eq(contentRevisions.contentEntryId, current.id));
    const checkpoint = Number(latest[0]?.value ?? 0) + 1;
    await transaction.insert(contentRevisions).values({ contentEntryId: current.id, editorUserId: admin.id, revisionNumber: checkpoint, changeSummary: `Checkpoint πριν από επαναφορά #${parsed.data.revisionNumber}`, snapshot: { kind: current.kind, articleTemplate: current.articleTemplate, slug: current.slug, title: current.title, excerpt: current.excerpt, bodyHtml: current.bodyHtml, authorName: current.authorName, publicationStatus: current.publicationStatus, featuredMediaExternalId: current.featuredMediaExternalId, galleryMediaExternalIds: Array.isArray(current.galleryMediaExternalIds) ? current.galleryMediaExternalIds.filter((value): value is string => typeof value === "string") : [], seoTitle: current.seoTitle, seoDescription: current.seoDescription, publishedAt: current.publishedAt?.toISOString() ?? null, scheduledFor: current.scheduledFor?.toISOString() ?? null, categories: currentCategories.map((item) => item.name) } });
    const snapshot = target.data;
    await transaction.update(contentEntries).set({ kind: snapshot.kind, articleTemplate: snapshot.articleTemplate, slug: snapshot.slug, title: snapshot.title, excerpt: snapshot.excerpt, bodyHtml: sanitizeEditorHtml(snapshot.bodyHtml), authorName: snapshot.authorName, publicationStatus: snapshot.publicationStatus, featuredMediaExternalId: snapshot.featuredMediaExternalId, galleryMediaExternalIds: snapshot.galleryMediaExternalIds, seoTitle: snapshot.seoTitle, seoDescription: snapshot.seoDescription, publishedAt: snapshot.publishedAt ? new Date(snapshot.publishedAt) : null, scheduledFor: snapshot.scheduledFor ? new Date(snapshot.scheduledFor) : null, sourceChecksum: checksum(snapshot) }).where(eq(contentEntries.id, current.id));
    await transaction.delete(contentEntryTaxonomies).where(eq(contentEntryTaxonomies.contentEntryId, current.id));
    for (const name of snapshot.categories) {
      const categorySlug = normalizeContentSlug(name); if (!categorySlug) continue;
      await transaction.insert(contentTaxonomies).values({ taxonomy: "category", slug: categorySlug, name }).onDuplicateKeyUpdate({ set: { name } });
      const category = await transaction.select({ id: contentTaxonomies.id }).from(contentTaxonomies).where(and(eq(contentTaxonomies.taxonomy, "category"), eq(contentTaxonomies.slug, categorySlug))).limit(1);
      if (category[0]) await transaction.insert(contentEntryTaxonomies).values({ contentEntryId: current.id, taxonomyId: category[0].id }).onDuplicateKeyUpdate({ set: { taxonomyId: category[0].id } });
    }
    return { id: current.id, oldSlug: current.slug, slug: snapshot.slug };
  });
  await audit("content.revision_restored", admin.id, "content", String(restored.id));
  revalidatePath("/"); revalidatePath("/news"); revalidatePath(`/news/${restored.oldSlug}`); revalidatePath(`/news/${restored.slug}`); revalidatePath("/admin/content"); revalidatePath("/sitemap.xml");
  redirect(`/admin/content/${restored.id}?restored=${parsed.data.revisionNumber}`);
}

const editorSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  kind: z.enum(["page", "post"]),
  articleTemplate: z.enum(articleTemplateKeys),
  title: z.string().trim().min(2).max(300),
  slug: z.string().trim().min(1).max(191),
  excerpt: z.string().trim().max(1000).optional(),
  bodyHtml: z.string().max(2_000_000),
  seoTitle: z.string().trim().max(300).optional(),
  seoDescription: z.string().trim().max(500).optional(),
  categories: z.string().max(1000).optional(),
  featuredMediaExternalId: z.string().trim().max(64).optional(),
  galleryMediaExternalIds: z.string().max(4000).optional(),
  scheduledFor: z.string().optional(),
  intent: z.enum(["save", "publish", "schedule", "unpublish", "archive"]),
});

function checksum(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function categoryNames(value: string | undefined): string[] {
  return [...new Set((value || "").split(",").map((item) => item.trim()).filter(Boolean))].slice(0, 20);
}

const revisionSnapshotSchema = z.object({
  kind: z.enum(["page", "post"]), articleTemplate: z.enum(articleTemplateKeys), slug: z.string().max(191), title: z.string().max(300), excerpt: z.string().nullable(), bodyHtml: z.string().max(2_000_000), authorName: z.string().nullable(), publicationStatus: z.enum(["draft", "published", "scheduled", "archived"]), featuredMediaExternalId: z.string().nullable(), galleryMediaExternalIds: z.array(z.string()).max(40), seoTitle: z.string().nullable(), seoDescription: z.string().nullable(), publishedAt: z.string().nullable(), scheduledFor: z.string().nullable(), categories: z.array(z.string()).max(20),
});

export async function saveContentAction(_state: ContentEditorState, formData: FormData): Promise<ContentEditorState> {
  const admin = await requireAdmin();
  const parsed = editorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Ελέγξτε τα υποχρεωτικά πεδία και τα επιτρεπόμενα μήκη." };
  const input = parsed.data;
  const title = normalizeGreekTitleConjunctions(input.title);
  if (input.intent === "archive" && admin.role !== "owner") return { error: "Μόνο ο ιδιοκτήτης μπορεί να αρχειοθετήσει περιεχόμενο." };
  const slug = normalizeContentSlug(input.slug);
  if (!slug) return { error: "Το slug δεν είναι έγκυρο." };
  const bodyHtml = sanitizeEditorHtml(input.bodyHtml);
  const scheduledFor = input.scheduledFor ? new Date(input.scheduledFor) : null;
  if (scheduledFor && Number.isNaN(scheduledFor.valueOf())) return { error: "Η ημερομηνία προγραμματισμού δεν είναι έγκυρη." };
  let publication: ReturnType<typeof publicationFromIntent>;
  try { publication = publicationFromIntent(input.intent === "unpublish" ? "save" : input.intent, scheduledFor); }
  catch (error) { return { error: error instanceof Error ? error.message : "Ο προγραμματισμός απέτυχε." }; }
  const seo = buildContentSeo({ title, excerpt: input.excerpt, bodyHtml, explicitTitle: input.seoTitle, explicitDescription: input.seoDescription });
  const values = {
    kind: input.kind,
    articleTemplate: input.articleTemplate,
    slug,
    title,
    excerpt: input.excerpt || null,
    bodyHtml,
    authorName: admin.displayName,
    migrationStatus: "draft" as const,
    publicationStatus: publication.status,
    scheduledFor: publication.scheduledFor,
    seoTitle: seo.title,
    seoDescription: seo.description,
    featuredMediaExternalId: input.featuredMediaExternalId || null,
    galleryMediaExternalIds: [...new Set((input.galleryMediaExternalIds || "").split(",").map((item) => item.trim()).filter(Boolean))].slice(0, 40),
    sourceChecksum: checksum({ kind: input.kind, articleTemplate: input.articleTemplate, slug, title, excerpt: input.excerpt, bodyHtml, seo }),
  };

  try {
    const contentId = await db.transaction(async (transaction) => {
      let id = input.id;
      if (id) {
        const existing = await transaction.select().from(contentEntries).where(eq(contentEntries.id, id)).limit(1);
        if (!existing[0]) throw new Error("NOT_FOUND");
        const existingCategories = await transaction.select({ name: contentTaxonomies.name }).from(contentTaxonomies).innerJoin(contentEntryTaxonomies, eq(contentEntryTaxonomies.taxonomyId, contentTaxonomies.id)).where(and(eq(contentEntryTaxonomies.contentEntryId, id), eq(contentTaxonomies.taxonomy, "category")));
        const latestRevision = await transaction.select({ value: sql<number>`COALESCE(MAX(${contentRevisions.revisionNumber}), 0)` }).from(contentRevisions).where(eq(contentRevisions.contentEntryId, id));
        const previous = existing[0];
        await transaction.insert(contentRevisions).values({ contentEntryId: id, editorUserId: admin.id, revisionNumber: Number(latestRevision[0]?.value ?? 0) + 1, changeSummary: `Πριν από ενημέρωση ${previous.publicationStatus} → ${publication.status}`, snapshot: { kind: previous.kind, articleTemplate: previous.articleTemplate, slug: previous.slug, title: previous.title, excerpt: previous.excerpt, bodyHtml: previous.bodyHtml, authorName: previous.authorName, publicationStatus: previous.publicationStatus, featuredMediaExternalId: previous.featuredMediaExternalId, galleryMediaExternalIds: Array.isArray(previous.galleryMediaExternalIds) ? previous.galleryMediaExternalIds.filter((value): value is string => typeof value === "string") : [], seoTitle: previous.seoTitle, seoDescription: previous.seoDescription, publishedAt: previous.publishedAt?.toISOString() ?? null, scheduledFor: previous.scheduledFor?.toISOString() ?? null, categories: existingCategories.map((item) => item.name) } });
        await transaction.update(contentEntries).set({ ...values, publishedAt: publication.status === "published" ? existing[0].publishedAt ?? new Date() : publication.status === "scheduled" ? publication.scheduledFor : existing[0].publishedAt }).where(eq(contentEntries.id, id));
      } else {
        const inserted = await transaction.insert(contentEntries).values({ ...values, externalId: `native-${randomUUID()}`, sourceStatus: "native", sourceUrl: null, publishedAt: publication.status === "published" ? new Date() : publication.status === "scheduled" ? publication.scheduledFor : null }).$returningId();
        id = inserted[0]?.id;
        if (!id) throw new Error("INSERT_FAILED");
      }
      await transaction.delete(contentEntryTaxonomies).where(eq(contentEntryTaxonomies.contentEntryId, id));
      for (const name of categoryNames(input.categories)) {
        const categorySlug = normalizeContentSlug(name);
        if (!categorySlug) continue;
        await transaction.insert(contentTaxonomies).values({ taxonomy: "category", slug: categorySlug, name }).onDuplicateKeyUpdate({ set: { name } });
        const category = await transaction.select({ id: contentTaxonomies.id }).from(contentTaxonomies).where(and(eq(contentTaxonomies.taxonomy, "category"), eq(contentTaxonomies.slug, categorySlug))).limit(1);
        if (category[0]) await transaction.insert(contentEntryTaxonomies).values({ contentEntryId: id, taxonomyId: category[0].id }).onDuplicateKeyUpdate({ set: { taxonomyId: category[0].id } });
      }
      return id;
    });
    await audit(`content.${publication.status}`, admin.id, input.kind, String(contentId));
    revalidatePath("/"); revalidatePath("/news"); revalidatePath(`/${slug}`); revalidatePath(`/news/${slug}`); revalidatePath("/sitemap.xml");
    redirect(`/admin/content/${contentId}?saved=1`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    const message = error instanceof Error && error.message === "NOT_FOUND" ? "Το περιεχόμενο δεν βρέθηκε." : "Η αποθήκευση απέτυχε. Ελέγξτε αν το slug χρησιμοποιείται ήδη.";
    return { error: message };
  }
}
