import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { publicSitemapEntries } from "@/features/content/queries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await publicSitemapEntries();
  const canonicalUrls = new Set(siteConfig.publicRoutes.map((route) => new URL(route.href, siteConfig.url).toString()));
  const legacyAliases = new Set(["/nea", "/τα-νέα-μας", "/our-story"]);
  const migratedEntries = content.flatMap((item) => {
    const pathname = item.kind === "post" ? `/news/${item.slug}` : `/${item.slug}`;
    const url = new URL(pathname, siteConfig.url).toString();
    if (canonicalUrls.has(url) || legacyAliases.has(pathname) || pathname.startsWith("/admin") || pathname.startsWith("/api")) return [];
    return [{ url, lastModified: item.updatedAt, changeFrequency: item.kind === "post" ? "weekly" as const : "monthly" as const, priority: 0.7 }];
  });
  return [
    ...siteConfig.publicRoutes.map((route) => ({ url: new URL(route.href, siteConfig.url).toString(), changeFrequency: route.changeFrequency, priority: route.priority })),
    ...migratedEntries,
  ];
}
