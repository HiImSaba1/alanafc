import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentEditor } from "@/components/admin/content-editor";
import { ContentRevisionHistory } from "@/components/admin/content-revision-history";
import { requireAdmin } from "@/features/admin-auth/session";
import { adminContentById, adminContentRevisions, adminMediaLibrary } from "@/features/content/queries";

export const dynamic = "force-dynamic";
function localDateTime(value: Date | null) { if (!value) return ""; const offset = value.getTimezoneOffset() * 60_000; return new Date(value.getTime() - offset).toISOString().slice(0, 16); }
export default async function EditContentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; restored?: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { saved, restored } = await searchParams;
  const [content, mediaLibrary, revisions] = await Promise.all([adminContentById(Number(id)), adminMediaLibrary(), adminContentRevisions(Number(id))]);
  if (!content) notFound();
  const galleryIds = Array.isArray(content.galleryMediaExternalIds) ? content.galleryMediaExternalIds.filter((value): value is string => typeof value === "string") : [];
  return <main className="admin-content"><header><div><p className="eyebrow">ΕΠΕΞΕΡΓΑΣΙΑ · {content.publicationStatus}</p><h1>{content.title}</h1></div><div className="admin-content__header-actions"><Link href="/admin/content">Πίσω</Link><Link href={`/admin/content/${content.id}/preview`}>Προεπισκόπηση</Link></div></header><ContentEditor mediaLibrary={mediaLibrary} clearDraftKey={saved === "1" ? "new-content" : undefined} initial={{ id: content.id, kind: content.kind, articleTemplate: content.articleTemplate, title: content.title, slug: content.slug, excerpt: content.excerpt || "", bodyHtml: content.bodyHtml, seoTitle: content.seoTitle || "", seoDescription: content.seoDescription || "", categories: content.categories.join(", "), featuredMediaExternalId: content.featuredMediaExternalId || "", galleryMediaExternalIds: galleryIds.join(", "), publicationStatus: content.publicationStatus, scheduledFor: localDateTime(content.scheduledFor) }} />{admin.role === "owner" ? <ContentRevisionHistory contentId={content.id} revisions={revisions} restored={restored} /> : null}</main>;
}
