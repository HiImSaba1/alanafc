import { notFound, permanentRedirect } from "next/navigation";
import { publicPostBySlug } from "@/features/content/queries";

export const dynamic = "force-dynamic";
export default async function LegacyNewsRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await publicPostBySlug(slug);
  if (!post) notFound();
  permanentRedirect(`/news/${post.content.slug}`);
}
