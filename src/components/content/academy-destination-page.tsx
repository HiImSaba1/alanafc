import Image from "next/image";
import { AnimatedLines, ClipReveal, ParallaxMedia, StaggerReveal } from "@/components/motion";
import { EditorialButton } from "@/components/ui/editorial-button";

export type AcademyDestinationData = {
  eyebrow: string;
  title: string;
  intro: string;
  heroImage: string;
  heroAlt: string;
  sectionLabel: string;
  sectionTitle: string;
  storyLayout?: "grid" | "sticky";
  stories: Array<{ title: string; body: string }>;
  pillars?: Array<{ title: string; body: string }>;
  facilityHighlights?: Array<{ metric: string; title: string; body: string }>;
  experienceHighlights?: Array<{ label: string; title: string; body: string }>;
  galleryLabel?: string;
  galleryTitle?: string;
  galleryLayout?: "editorial" | "people" | "community";
  gallery: Array<{ src: string; alt: string; caption?: string }>;
  ctaTitle: string;
  ctaText: string;
  ctaHref: string;
  ctaLabel: string;
};

export function AcademyDestinationPage({ data, managedBodyHtml }: { data: AcademyDestinationData; managedBodyHtml?: string | null }) {
  return (
    <main id="main-content" className="academy-destination">
      <section className="academy-destination__hero" aria-labelledby="destination-title">
        <ClipReveal className="academy-destination__hero-media">
          <ParallaxMedia strength={10}>
            <Image src={data.heroImage} alt={data.heroAlt} fill priority sizes="100vw" className="object-cover" />
          </ParallaxMedia>
          <span aria-hidden="true" />
        </ClipReveal>
        <div className="academy-destination__hero-copy">
          <p className="eyebrow">{data.eyebrow}</p>
          <AnimatedLines as="h1" className="academy-destination__title"><span id="destination-title">{data.title}</span></AnimatedLines>
          <AnimatedLines>{data.intro}</AnimatedLines>
        </div>
      </section>

      {managedBodyHtml ? <section className="academy-destination__managed-copy"><header><AnimatedLines as="h2">{data.sectionTitle}</AnimatedLines><p className="eyebrow">{data.sectionLabel}</p></header><div className="content-body" dangerouslySetInnerHTML={{ __html: managedBodyHtml }} /></section> : <section className={`academy-destination__story${data.storyLayout === "sticky" ? " academy-destination__story--sticky" : ""}`}>
        <header>
          <AnimatedLines as="h2">{data.sectionTitle}</AnimatedLines>
          <p className="eyebrow">{data.sectionLabel}</p>
        </header>
        <StaggerReveal className="academy-destination__story-grid">
          {data.stories.map((story, index) => (
            <article data-reveal-item key={story.title}>
              <span>0{index + 1}</span>
              <h3>{story.title}</h3>
              <p>{story.body}</p>
            </article>
          ))}
        </StaggerReveal>
      </section>}

      {data.pillars?.length ? <section className="academy-destination__pillars" aria-label="Οι αρχές της Alana FC Academy">
        <header><AnimatedLines as="h2">Αρχές που γίνονται καθημερινή πράξη.</AnimatedLines><p className="eyebrow">Η βάση μας</p></header>
        <StaggerReveal className="academy-destination__pillars-grid">
          {data.pillars.map((pillar, index) => <article data-reveal-item key={pillar.title}><span>0{index + 1}</span><h3>{pillar.title}</h3><p>{pillar.body}</p></article>)}
        </StaggerReveal>
      </section> : null}

      {data.facilityHighlights?.length ? <section className="academy-facilities" aria-labelledby="academy-facilities-title">
        <header><AnimatedLines as="h2" id="academy-facilities-title">Χώροι για κάθε στάδιο εξέλιξης.</AnimatedLines><p className="eyebrow">Τα γήπεδά μας</p></header>
        <StaggerReveal className="academy-facilities__grid">
          {data.facilityHighlights.map((facility, index) => <article data-reveal-item key={facility.metric}>
            <div><span>0{index + 1}</span><strong>{facility.metric}</strong></div>
            <h3>{facility.title}</h3>
            <p>{facility.body}</p>
          </article>)}
        </StaggerReveal>
      </section> : null}

      {data.experienceHighlights?.length ? <section className="academy-experiences" aria-labelledby="academy-experiences-title">
        <header><AnimatedLines as="h2" id="academy-experiences-title">Ένας χώρος που φέρνει την κοινότητα κοντά.</AnimatedLines><p className="eyebrow">Sportclub εμπειρίες</p></header>
        <StaggerReveal className="academy-experiences__grid">
          {data.experienceHighlights.map((experience, index) => <article data-reveal-item key={experience.title}>
            <span>0{index + 1} · {experience.label}</span><h3>{experience.title}</h3><p>{experience.body}</p>
          </article>)}
        </StaggerReveal>
      </section> : null}

      <section className={`academy-destination__gallery${data.galleryLayout ? ` academy-destination__gallery--${data.galleryLayout}` : ""}`} aria-label={`Εικόνες — ${data.title}`}>
        {data.galleryTitle ? <header><AnimatedLines as="h2">{data.galleryTitle}</AnimatedLines><p className="eyebrow">{data.galleryLabel}</p></header> : null}
        {data.gallery.map((image, index) => (
          <figure key={image.src}>
            <ParallaxMedia className="academy-destination__gallery-item" strength={8 + index}>
              <Image src={image.src} alt={image.alt} width={1600} height={1100} sizes="(max-width: 767px) 100vw, 50vw" />
            </ParallaxMedia>
            {image.caption ? <figcaption><span>0{index + 1}</span><strong>{image.caption}</strong></figcaption> : null}
          </figure>
        ))}
      </section>

      <section className="academy-destination__cta">
        <div>
          <AnimatedLines as="h2">{data.ctaTitle}</AnimatedLines>
          <p className="eyebrow">Επόμενο βήμα</p>
        </div>
        <p>{data.ctaText}</p>
        <EditorialButton href={data.ctaHref} label={data.ctaLabel} arrow="right" variant="light" />
      </section>
    </main>
  );
}
