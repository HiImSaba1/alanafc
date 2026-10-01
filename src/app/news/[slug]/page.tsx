import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ContentView } from "@/components/content/content-view";
import { preferredMediaUrl, publicPostBySlug, publicPostContext, publicPostRedirect } from "@/features/content/queries";
import { firstContentImageSrc } from "@/features/seo/content-seo";
import { safeStructuredData } from "@/features/seo/site-structured-data";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await publicPostBySlug(slug);
  if (!result) return { title: "Το άρθρο δεν βρέθηκε", robots: { index: false, follow: false } };
  const image = preferredMediaUrl(result.media) || firstContentImageSrc(result.content.bodyHtml) || siteConfig.socialImage;
  const title = result.content.seoTitle || result.content.title;
  const description = result.content.seoDescription || result.content.excerpt || siteConfig.description;
  return { title, description, alternates: { canonical: `/news/${result.content.slug}` }, openGraph: { type: "article", locale: "el_GR", siteName: siteConfig.name, title, description, url: `/news/${result.content.slug}`, publishedTime: result.content.publishedAt?.toISOString(), images: [{ url: image, alt: result.media?.altText || result.content.title }] }, twitter: { card: "summary_large_image", title, description, images: [image] } };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await publicPostBySlug(slug);
  if (!result) {
    const legacy = await publicPostRedirect(slug);
    if (legacy) permanentRedirect(legacy.targetPath);
    notFound();
  }
  const postContext = await publicPostContext(result.content);
  const image = preferredMediaUrl(result.media) || firstContentImageSrc(result.content.bodyHtml) || siteConfig.socialImage;
  const articleUrl = `${siteConfig.url}/news/${result.content.slug}`;
  const structuredData = { "@context": "https://schema.org", "@graph": [{ "@type": "NewsArticle", "@id": `${articleUrl}#article`, headline: result.content.title, description: result.content.seoDescription || result.content.excerpt || undefined, datePublished: result.content.publishedAt?.toISOString(), dateModified: result.content.updatedAt.toISOString(), image: new URL(image, siteConfig.url).toString(), articleSection: postContext.categories, inLanguage: "el-GR", author: { "@type": result.content.authorName ? "Person" : "Organization", name: result.content.authorName || siteConfig.name }, publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url }, mainEntityOfPage: articleUrl }, { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Αρχική", item: siteConfig.url }, { "@type": "ListItem", position: 2, name: "Νέα", item: `${siteConfig.url}/news` }, { "@type": "ListItem", position: 3, name: result.content.title, item: articleUrl }] }] };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeStructuredData(structuredData) }} /><ContentView {...result} postContext={postContext} /></>;
}
