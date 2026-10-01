import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { AnimatedLines, ParallaxMedia } from "@/components/motion";
import { articleTemplateCatalog } from "@/features/content/template-catalog";
import type { ContentPresentation, ContentRecord, MediaRecord } from "@/features/content/queries";
import { defaultContentPresentation, preferredMediaUrl } from "@/features/content/queries";
import { RichContent } from "./rich-content";

function ContentGallery({ gallery, title }: { gallery: MediaRecord[]; title: string }) {
  if (!gallery.length) return null;
  return <section className="content-gallery" aria-label="Συλλογή εικόνων">{gallery.map((item, index) => { const src = preferredMediaUrl(item); return src ? <ParallaxMedia className="content-gallery__item" strength={8 + (index % 3)} key={item.id}><Image src={src} alt={item.altText || title} width={item.width || 1600} height={item.height || 1100} sizes="(max-width: 767px) 100vw, 50vw" /></ParallaxMedia> : null; })}</section>;
}

type PostContext = { newer: { slug: string; title: string } | null; older: { slug: string; title: string } | null; categories: string[]; related: Array<{ content: ContentRecord; media: MediaRecord | null; gallery: MediaRecord[] }> };

export function ContentView({ content, media, gallery = [], preview = false, postContext, presentation = defaultContentPresentation }: { content: ContentRecord; media: MediaRecord | null; gallery?: MediaRecord[]; preview?: boolean; postContext?: PostContext; presentation?: ContentPresentation }) {
  const imageUrl = preferredMediaUrl(media);
  const publicationLabel = content.kind === "post" && content.publishedAt ? new Intl.DateTimeFormat("el-GR", { dateStyle: "long" }).format(content.publishedAt) : null;
  const template = content.kind === "post" ? content.articleTemplate : "longform";
  const templateLabel = articleTemplateCatalog[template].label;
  const galleryFirst = content.kind === "post" && template === "gallery";
  return <main id="main-content" className={`content-view content-view--${content.kind} content-view--template-${template}`}>
    {preview ? <div className="content-preview-banner">Προεπισκόπηση · Το περιεχόμενο δεν είναι δημόσιο</div> : null}
    <header className={`content-hero${content.kind === "post" ? " content-hero--post" : ""}`}>
      <div className="content-hero__copy"><p className="eyebrow">{content.kind === "post" ? `Νέα της Ακαδημίας${publicationLabel ? ` · ${publicationLabel}` : ""}` : "Alana FC Academy"}</p><AnimatedLines as="h1">{content.title}</AnimatedLines>{content.excerpt ? <AnimatedLines className="content-hero__excerpt">{content.excerpt}</AnimatedLines> : null}</div>
      {imageUrl ? <ParallaxMedia className="content-hero__media" strength={10}><Image src={imageUrl} alt={media?.altText || content.title} fill priority sizes="100vw" className="object-cover" /></ParallaxMedia> : null}
      {content.kind === "post" && imageUrl ? <span className="content-hero__overlay" aria-hidden="true" /> : null}
    </header>
    {galleryFirst ? <ContentGallery gallery={gallery} title={content.title} /> : null}
    {content.kind === "post" && (presentation.showAuthor || presentation.showTemplate || (presentation.showCategories && postContext?.categories.length)) ? <div className="content-story-meta">{presentation.showAuthor ? <div><span>Συντάκτης</span><strong>{content.authorName || "Alana FC Academy"}</strong></div> : null}{presentation.showTemplate ? <div><span>Template</span><strong>{templateLabel}</strong></div> : null}{presentation.showCategories && postContext?.categories.length ? <div><span>Κατηγορίες</span><strong>{postContext.categories.join(" · ")}</strong></div> : null}</div> : null}
    <div className={`content-story-layout article-template article-template--${template}`} data-article-template={template}>
      {content.kind === "post" && template === "sidebar" ? <aside className="content-story-sidebar"><span>Μορφή άρθρου</span><strong>{templateLabel}</strong>{publicationLabel ? <time>{publicationLabel}</time> : null}<Link href="/news">Όλα τα νέα ↗</Link></aside> : null}
      <article className="content-body"><RichContent html={content.bodyHtml} /></article>
    </div>
    {!galleryFirst ? <ContentGallery gallery={gallery} title={content.title} /> : null}
    {content.kind === "post" ? <footer className="article-post-footer">
      {postContext?.newer || postContext?.older ? <nav className="article-post-navigation" aria-label="Προηγούμενο και επόμενο άρθρο">{postContext.older ? <Link rel="prev" href={`/news/${postContext.older.slug}`}><small>Προηγούμενο άρθρο</small><span><ArrowLeft aria-hidden="true" />{postContext.older.title}</span></Link> : <span />}{postContext.newer ? <Link rel="next" href={`/news/${postContext.newer.slug}`}><small>Επόμενο άρθρο</small><span>{postContext.newer.title}<ArrowRight aria-hidden="true" /></span></Link> : <span />}</nav> : null}
      {postContext?.related.length ? <section className="article-related" aria-labelledby="related-articles-title"><header><p className="eyebrow">Από το ίδιο αρχείο</p><h2 id="related-articles-title">Σχετικά άρθρα</h2></header><div>{postContext.related.map(({ content: story, media: storyMedia }) => { const src = preferredMediaUrl(storyMedia); return <article key={story.id}><Link href={`/news/${story.slug}`}>{src ? <span className="article-related__media"><Image src={src} alt={storyMedia?.altText || story.title} fill sizes="(max-width: 760px) 100vw, 33vw" /></span> : null}<span className="article-related__copy"><small>{story.publishedAt ? new Intl.DateTimeFormat("el-GR", { dateStyle: "medium" }).format(story.publishedAt) : "Νέα της Ακαδημίας"}</small><strong>{story.title}</strong><ArrowUpRight aria-hidden="true" /></span></Link></article>; })}</div></section> : null}
      <Link className="content-back" href="/news"><ArrowLeft /> Όλα τα νέα</Link>
    </footer> : null}
  </main>;
}
