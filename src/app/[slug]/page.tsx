import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ContentView } from "@/components/content/content-view";
import { preferredMediaUrl, publicPageBySlug, publicPostBySlug, publicRedirectByPath } from "@/features/content/queries";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await publicPageBySlug(slug);
  if (!result) {
    const post = await publicPostBySlug(slug);
    if (post) return { title: post.content.seoTitle || post.content.title, description: post.content.seoDescription || post.content.excerpt, alternates: { canonical: `/news/${post.content.slug}` }, robots: { index: false, follow: true } };
    return { title: "Η σελίδα δεν βρέθηκε", robots: { index: false, follow: false } };
  }
  const image = preferredMediaUrl(result.media);
  const title = result.content.seoTitle || result.content.title;
  const description = result.content.seoDescription || result.content.excerpt || siteConfig.description;
  return { title, description, alternates: { canonical: `/${result.content.slug}` }, openGraph: { type: "website", locale: "el_GR", siteName: siteConfig.name, title, description, url: `/${result.content.slug}`, images: [{ url: image || siteConfig.socialImage, alt: result.media?.altText || result.content.title }] }, twitter: { card: "summary_large_image", title, description, images: [image || siteConfig.socialImage] } };
}

export default async function PublicContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await publicPageBySlug(slug);
  if (!result) {
    const post = await publicPostBySlug(slug);
    if (post) permanentRedirect(`/news/${post.content.slug}`);
    const legacy = await publicRedirectByPath(`/${slug}`);
    if (legacy) permanentRedirect(legacy.targetPath);
    notFound();
  }
  return <ContentView {...result} />;
}
