import { AnimatedLines, StaggerReveal } from "@/components/motion";
import { EditorialButton } from "@/components/ui/editorial-button";
import type { OwnerContentSettings } from "@/features/site-settings/owner-content-contract";

export function HomeContactCta({ site, content }: { site: OwnerContentSettings["site"]; content: OwnerContentSettings["homepage"] }) {
  return <section className="home-contact-cta" aria-labelledby="home-contact-title">
    <header>
      <AnimatedLines as="h2" className="home-contact-cta__title" id="home-contact-title">{content.contactTitle}</AnimatedLines>
      <p className="eyebrow">{content.contactEyebrow}</p>
    </header>
    <StaggerReveal className="home-contact-cta__body">
      <div data-reveal-item className="home-contact-cta__intro">
        <p>{content.contactText}</p>
        <EditorialButton href="/contact-us" label={content.contactButtonLabel} arrow="right" variant="light" />
      </div>
      <address data-reveal-item className="home-contact-cta__details">
        <a href={`tel:${site.phone}`}><span>Κινητό</span><strong>{site.phoneDisplay}</strong></a>
        <a href={`tel:${site.landline}`}><span>Σταθερό</span><strong>{site.landlineDisplay}</strong></a>
        <a href={`mailto:${site.email}`}><span>Email</span><strong>{site.email}</strong></a>
        <p><span>Έδρα</span><strong>{site.address}</strong></p>
      </address>
    </StaggerReveal>
  </section>;
}
