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
    {homepage.sectionOrder.filter((section) => section.enabled).map((section) => {
      if (section.id === "intro") return <section key={section.id} id="academy-intro" className="home-intro"><p className="eyebrow">{homepage.introEyebrow}</p><AnimatedLines as="h2">{homepage.introTitle}</AnimatedLines><div className="home-intro__grid"><AnimatedLines>{homepage.introText}</AnimatedLines><EditorialButton href={homepage.introButtonHref} label={homepage.introButtonLabel} arrow="right" /></div></section>;
      if (section.id === "services") return services.length ? <AcademyServices key={section.id} services={services} title={homepage.servicesTitle} eyebrow={homepage.servicesEyebrow} /> : null;
      if (section.id === "news") return <section key={section.id} className="home-news"><header><div><p className="eyebrow">{homepage.newsEyebrow}</p><AnimatedLines as="h2">{homepage.newsTitle}</AnimatedLines></div><EditorialButton href="/news" label={homepage.newsButtonLabel} arrow="right" /></header>{latestPosts.length ? <div className="news-grid news-grid--editorial">{latestPosts.map(({ content, media }) => { const src = preferredMediaUrl(media); return <HomeNewsCard key={content.id} href={`/news/${content.slug}`} image={src || "/alana_fc_academy_images_wordpress/alana_fc_kids_gallery.jpg"} imageAlt={media?.altText || content.title} eyebrow={content.publishedAt ? new Intl.DateTimeFormat("el-GR", { dateStyle: "medium" }).format(content.publishedAt) : "Alana FC"} title={content.title} />; })}</div> : <div className="home-news__empty"><p>{homepage.newsEmptyText}</p><EditorialButton href="/news" label={homepage.newsButtonLabel} arrow="right" variant="outline" /></div>}</section>;
      if (section.id === "testimonials") return testimonials.length ? <AcademyTestimonialStack key={section.id} testimonials={testimonials} title={homepage.testimonialsTitle} eyebrow={homepage.testimonialsEyebrow} /> : null;
      if (section.id === "sponsors") return sponsors.length ? <AcademySponsors key={section.id} sponsors={sponsors} title={homepage.sponsorsTitle} eyebrow={homepage.sponsorsEyebrow} /> : null;
      if (section.id === "contact") return <HomeContactCta key={section.id} site={settings.site} content={homepage} />;
      return null;
    })}
  </main>;
}
