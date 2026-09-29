import type { Metadata } from "next";
import Link from "next/link";
import { AnimatedLines } from "@/components/motion";
import { HomeNewsCard } from "@/components/home/home-news-card";
import { EditorialButton } from "@/components/ui/editorial-button";
import { preferredMediaUrl, publicNewsFilters, publicPostCount, publicPosts } from "@/features/content/queries";
import { publicPageMetadata } from "@/features/seo/public-metadata";

export const dynamic = "force-dynamic";
export const metadata: Metadata = publicPageMetadata({ title: "Τα Νέα μας", description: "Νέα, αγώνες, δράσεις και ιστορίες από την Alana FC Academy στην Αλεξανδρούπολη.", path: "/news", image: "/alana_fc_academy_images_wordpress/alana_fc_kids_gallery.jpg", imageAlt: "Νέα και αγωνιστικές δράσεις της Alana FC Academy" });

const PAGE_SIZE = 15;

function newsHref(input: { category?: string; year?: number; page?: number }) {
  const params = new URLSearchParams();
  if (input.category) params.set("category", input.category);
  if (input.year) params.set("year", String(input.year));
  if (input.page && input.page > 1) params.set("page", String(input.page));
  const query = params.toString();
  return query ? `/news?${query}` : "/news";
}

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ category?: string; year?: string; page?: string }> }) {
  const query = await searchParams;
  const year = query.year && /^\d{4}$/.test(query.year) ? Number(query.year) : undefined;
  const requestedPage = query.page && /^\d+$/.test(query.page) ? Math.max(1, Number(query.page)) : 1;
  const filters = { category: query.category, year };
  const [total, availableFilters] = await Promise.all([publicPostCount(filters), publicNewsFilters()]);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const page = Math.min(requestedPage, Math.max(1, totalPages));
  const posts = await publicPosts({ ...filters, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const numberedPages = totalPages > 1 ? [...new Set([1, page - 2, page - 1, page, page + 1, page + 2, totalPages].filter((item) => item >= 1 && item <= totalPages))].sort((a, b) => a - b) : [];

  return <main id="main-content" className="news-index">
    <header className="news-index__header"><p className="eyebrow">ALANA FC ACADEMY · ΝΕΑ</p><AnimatedLines as="h1">Ιστορίες από το γήπεδο.</AnimatedLines></header>
    <div className="news-filters">
      <form action="/news" method="get" aria-label="Φίλτρα νέων">
        <label>
          <AnimatedLines as="span">Κατηγορία</AnimatedLines>
          <select name="category" defaultValue={query.category || ""}>
            <option value="">Όλες οι κατηγορίες</option>
            {availableFilters.categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
          </select>
        </label>
        <label>
          <AnimatedLines as="span">Ταξινόμηση ανά έτος</AnimatedLines>
          <select name="year" defaultValue={year ? String(year) : ""}>
            <option value="">Όλα τα έτη</option>
            {availableFilters.years.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <EditorialButton type="submit" label="Εφαρμογή" arrow="right" />
        {query.category || year ? <EditorialButton href="/news" label="Καθαρισμός" arrow="left" variant="outline" /> : null}
      </form>
    </div>
    {posts.length ? <div className="news-grid news-grid--editorial">{posts.map(({ content, media }) => { const image = preferredMediaUrl(media); return <HomeNewsCard key={content.id} href={`/news/${content.slug}`} image={image || "/alana_fc_academy_images_wordpress/alana_fc_kids_gallery.jpg"} imageAlt={media?.altText || content.title} eyebrow={content.publishedAt ? new Intl.DateTimeFormat("el-GR", { dateStyle: "medium" }).format(content.publishedAt) : "Alana FC"} title={content.title} />; })}</div> : <div className="news-empty"><p>Δεν υπάρχουν δημοσιευμένα άρθρα για αυτό το φίλτρο.</p><Link href="/news">Καθαρισμός φίλτρων</Link></div>}
    {totalPages > 1 ? <nav className="news-pagination" aria-label="Σελιδοποίηση νέων"><EditorialButton href={newsHref({ ...filters, page: Math.max(1, page - 1) })} label="Προηγούμενη" arrow="left" variant="outline" aria-disabled={page === 1} /><div>{numberedPages.map((item, index) => <span key={item}>{index > 0 && item - numberedPages[index - 1] > 1 ? <i aria-hidden="true">…</i> : null}<Link className="news-pagination__page" href={newsHref({ ...filters, page: item })} aria-current={item === page ? "page" : undefined} aria-label={`Σελίδα ${item}`}>{item}</Link></span>)}</div><EditorialButton href={newsHref({ ...filters, page: Math.min(totalPages, page + 1) })} label="Επόμενη" arrow="right" variant="outline" aria-disabled={page === totalPages} /></nav> : null}
  </main>;
}
