import type { Metadata } from "next";
import { AnimatedLines } from "@/components/motion";
import { EditorialButton } from "@/components/ui/editorial-button";
import { AcademyServices } from "@/components/home/academy-services";
import { AcademySponsors } from "@/components/home/academy-sponsors";
import { AcademyTestimonialStack } from "@/components/home/academy-testimonial-stack";
import { HomeHeroSlider } from "@/components/home/home-hero-slider";
import { HomeContactCta } from "@/components/home/home-contact-cta";
import { HomeNewsCard } from "@/components/home/home-news-card";
import { preferredMediaUrl, publicPosts } from "@/features/content/queries";
import { getOwnerContentSettings } from "@/features/site-settings/owner-content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { alternates: { canonical: "/" } };
export default async function HomePage() {
  const settings = await getOwnerContentSettings();
  const homepage = settings.homepage;
  const heroSlides = homepage.heroSlides.filter((item) => item.enabled);
  const testimonials = homepage.testimonials.filter((item) => item.enabled);
  const sponsors = homepage.sponsors.filter((item) => item.enabled);
  const services = homepage.services.filter((item) => item.enabled);
  const latestPosts = await publicPosts({ limit: homepage.latestPostsCount });
  return <main id="main-content" className="home-preview">
    <HomeHeroSlider slides={heroSlides} />
    <section id="academy-intro" className="home-intro"><p className="eyebrow">{homepage.introEyebrow}</p><AnimatedLines as="h2">{homepage.introTitle}</AnimatedLines><div className="home-intro__grid"><AnimatedLines>{homepage.introText}</AnimatedLines><EditorialButton href={homepage.introButtonHref} label={homepage.introButtonLabel} arrow="right" /></div></section>
    {services.length ? <AcademyServices services={services} /> : null}
    <section className="home-news"><header><div><p className="eyebrow">Από το γήπεδο · 04</p><AnimatedLines as="h2">Τελευταία νέα.</AnimatedLines></div><EditorialButton href="/news" label="Όλα τα νέα" arrow="right" /></header>{latestPosts.length ? <div className="news-grid news-grid--editorial">{latestPosts.map(({ content, media }) => { const src = preferredMediaUrl(media); return <HomeNewsCard key={content.id} href={`/news/${content.slug}`} image={src || "/alana_fc_academy_images_wordpress/alana_fc_kids_gallery.jpg"} imageAlt={media?.altText || content.title} eyebrow={content.publishedAt ? new Intl.DateTimeFormat("el-GR", { dateStyle: "medium" }).format(content.publishedAt) : "Alana FC"} title={content.title} />; })}</div> : <div className="home-news__empty"><p>Τα νέα εμφανίζονται εδώ μόλις δημοσιευθούν από τη διαχείριση.</p><EditorialButton href="/news" label="Σελίδα νέων" arrow="right" variant="outline" /></div>}</section>
    {testimonials.length ? <AcademyTestimonialStack testimonials={testimonials} /> : null}
    {sponsors.length ? <AcademySponsors sponsors={sponsors} /> : null}
    <HomeContactCta site={settings.site} content={homepage} />
  </main>;
}
