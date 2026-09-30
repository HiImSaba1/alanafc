import type { Metadata } from "next";
import Image from "next/image";
import { AnimatedLines, ClipReveal, ParallaxMedia, StaggerReveal } from "@/components/motion";
import { RegistrationForm } from "@/components/registrations/registration-form";
import { RegistrationProgramGuide } from "@/components/registrations/registration-program-guide";
import { publicPageMetadata } from "@/features/seo/public-metadata";
import { getRegistrationSettings, registrationGroupOptions } from "@/features/site-settings/registration-settings";

export const metadata: Metadata = publicPageMetadata({ title: "Εγγραφές 2026–2027", description: "Εκδήλωση ενδιαφέροντος για τα ποδοσφαιρικά τμήματα K6 έως K16 της Alana FC Academy στην Αλεξανδρούπολη.", path: "/eggrafes-2026-2027", image: "/alana_fc_academy_images_wordpress/alanafc-eggrafes-2026-hero.jpg", imageAlt: "Εγγραφές παιδιών στην Alana FC Academy για τη σεζόν 2026–2027" });
export const dynamic = "force-dynamic";

export default async function RegistrationsPage() {
  const settings = await getRegistrationSettings();
  const groups = registrationGroupOptions(settings);
  return <main id="main-content" className="registration-page">
    <section className="registration-hero" aria-labelledby="registration-title">
      <ClipReveal className="registration-hero__media"><ParallaxMedia strength={10}><Image src="/alana_fc_academy_images_wordpress/eggrafes_11zon.jpeg" alt="Εγγραφές στην Alana FC Academy" fill priority sizes="100vw" className="object-cover" /></ParallaxMedia></ClipReveal>
      <div className="registration-hero__copy"><StaggerReveal className="registration-hero__meta"><p data-reveal-item>{settings.season}</p><p data-reveal-item>{settings.statusText}</p></StaggerReveal><AnimatedLines as="h1">{settings.titleLines.map((line, index) => <span id={index === 0 ? "registration-title" : undefined} key={`${line}-${index}`}>{line}</span>)}</AnimatedLines><AnimatedLines className="registration-hero__intro">{settings.intro}</AnimatedLines></div>
    </section>
    {settings.sectionOrder.filter((section) => section.enabled).map((section) => section.id === "form"
      ? <section key={section.id} id="registration-form" className="registration-form-section" aria-label="Φόρμα εκδήλωσης ενδιαφέροντος">{settings.isOpen ? <RegistrationForm groups={groups} successMessage={settings.successMessage} /> : <div className="registration-success"><p className="eyebrow">Εγγραφές</p><h2>Οι online αιτήσεις είναι κλειστές.</h2><p>{settings.closedMessage}</p></div>}</section>
      : <RegistrationProgramGuide key={section.id} settings={settings} />)}
  </main>;
}
