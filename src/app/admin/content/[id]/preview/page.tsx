import { notFound } from "next/navigation";
import { ContentView } from "@/components/content/content-view";
import { requireAdmin } from "@/features/admin-auth/session";
import { adminContentById, mediaByExternalId, mediaByExternalIds } from "@/features/content/queries";

export const dynamic = "force-dynamic";
export default async function AdminContentPreview({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const content = await adminContentById(Number(id));
  if (!content) notFound();
  const media = await mediaByExternalId(content.featuredMediaExternalId);
  const gallery = await mediaByExternalIds(content.galleryMediaExternalIds);
  return <ContentView content={content} media={media} gallery={gallery} preview />;
}
