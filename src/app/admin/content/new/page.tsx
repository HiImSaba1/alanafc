import Link from "next/link";
import { ContentEditor } from "@/components/admin/content-editor";
import { requireAdmin } from "@/features/admin-auth/session";
import { adminMediaLibrary } from "@/features/content/queries";

export const dynamic = "force-dynamic";
export default async function NewContentPage() {
  await requireAdmin();
  const mediaLibrary = await adminMediaLibrary();
  return <main className="admin-editor-page"><ContentEditor mediaLibrary={mediaLibrary} initial={{ kind: "post", articleTemplate: "longform", title: "", slug: "", excerpt: "", bodyHtml: "", seoTitle: "", seoDescription: "", categories: "", featuredMediaExternalId: "", galleryMediaExternalIds: "", publicationStatus: "draft", scheduledFor: "", showAuthor: false, showTemplate: false, showCategories: false }} /><Link className="admin-editor-page__cancel" href="/admin/content">Ακύρωση</Link></main>;
}
