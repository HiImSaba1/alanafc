import { siteConfig } from "@/lib/site";

export function academyStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": ["SportsOrganization", "SportsActivityLocation"],
    "@id": `${siteConfig.url}/#academy`,
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: new URL("/alana_fc_academy_images_wordpress/new-logo-png-alana_main.png", siteConfig.url).toString(),
    image: new URL("/alana_fc_academy_images_wordpress/academy_alana_header_1.jpg", siteConfig.url).toString(),
    email: siteConfig.email,
    telephone: siteConfig.phone,
    sport: "Football",
    areaServed: { "@type": "City", name: "Αλεξανδρούπολη" },
    contactPoint: [
      { "@type": "ContactPoint", telephone: siteConfig.phone, email: siteConfig.email, contactType: "customer service", availableLanguage: ["el"] },
      { "@type": "ContactPoint", telephone: siteConfig.landline, contactType: "customer service", availableLanguage: ["el"] },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Εργατικά, Παλαγιά",
      postalCode: "681 32",
      addressLocality: "Αλεξανδρούπολη",
      addressCountry: "GR",
    },
  } as const;
}

export function safeStructuredData(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
