import { z } from "zod";
import { academySponsors } from "@/data/academy-sponsors";
import { academyTestimonials } from "@/data/academy-testimonials";
import { siteConfig } from "@/lib/site";

const internalPath = z.string().trim().startsWith("/").max(500);
const imagePath = z.string().trim().startsWith("/").max(500);
const homepageSectionId = z.enum(["intro", "services", "news", "testimonials", "sponsors", "contact"]);

export const ownerContentSettingsSchema = z.object({
  site: z.object({
    email: z.string().trim().email().max(160),
    phone: z.string().trim().min(5).max(40),
    phoneDisplay: z.string().trim().min(5).max(40),
    landline: z.string().trim().min(5).max(40),
    landlineDisplay: z.string().trim().min(5).max(40),
    address: z.string().trim().min(5).max(240),
    navigation: z.array(z.object({
      enabled: z.boolean(), label: z.string().trim().min(1).max(80), href: internalPath, image: imagePath,
    })).min(1).max(10),
    footerEyebrow: z.string().trim().min(2).max(100),
    footerTitle: z.string().trim().min(2).max(160),
    footerButtonLabel: z.string().trim().min(2).max(100),
    footerButtonHref: internalPath,
    footerWordmark: z.string().trim().min(2).max(80),
  }),
  homepage: z.object({
    sectionOrder: z.array(z.object({ id: homepageSectionId, enabled: z.boolean() })).length(6)
      .refine((items) => new Set(items.map((item) => item.id)).size === 6, "Κάθε ενότητα της αρχικής πρέπει να εμφανίζεται μία φορά."),
    heroSlides: z.array(z.object({
      enabled: z.boolean(), href: internalPath, button: z.string().trim().min(2).max(100), eyebrow: z.string().trim().min(2).max(100),
      title: z.string().trim().min(3).max(180), description: z.string().trim().min(10).max(500), image: imagePath, alt: z.string().trim().min(3).max(180),
    })).min(1).max(6),
    introEyebrow: z.string().trim().min(2).max(100),
    introTitle: z.string().trim().min(3).max(180),
    introText: z.string().trim().min(10).max(600),
    introButtonLabel: z.string().trim().min(2).max(100),
    introButtonHref: internalPath,
    latestPostsCount: z.number().int().min(3).max(12),
    newsEyebrow: z.string().trim().min(2).max(100),
    newsTitle: z.string().trim().min(2).max(160),
    newsButtonLabel: z.string().trim().min(2).max(100),
    newsEmptyText: z.string().trim().min(10).max(400),
    servicesEyebrow: z.string().trim().min(2).max(100),
    servicesTitle: z.string().trim().min(3).max(180),
    services: z.array(z.object({
      enabled: z.boolean(), title: z.string().trim().min(2).max(100), href: internalPath, buttonLabel: z.string().trim().min(2).max(100),
      description: z.string().trim().min(10).max(500), keywords: z.array(z.string().trim().min(1).max(60)).min(1).max(6), image: imagePath,
    })).min(1).max(6),
    testimonials: z.array(z.object({
      enabled: z.boolean(), name: z.string().trim().min(2).max(100), role: z.string().trim().min(2).max(100), quote: z.string().trim().min(10).max(800), image: imagePath,
    })).min(1).max(10),
    testimonialsEyebrow: z.string().trim().min(2).max(100),
    testimonialsTitle: z.string().trim().min(2).max(160),
    sponsors: z.array(z.object({
      enabled: z.boolean(), name: z.string().trim().min(2).max(120), href: z.string().trim().url().max(500), image: imagePath,
    })).min(1).max(8),
    sponsorsEyebrow: z.string().trim().min(2).max(100),
    sponsorsTitle: z.string().trim().min(2).max(160),
    contactTitle: z.string().trim().min(3).max(180),
    contactEyebrow: z.string().trim().min(2).max(100),
    contactText: z.string().trim().min(10).max(500),
    contactButtonLabel: z.string().trim().min(2).max(100),
  }),
});

export type OwnerContentSettings = z.infer<typeof ownerContentSettingsSchema>;
export type OwnerHeroSlide = OwnerContentSettings["homepage"]["heroSlides"][number];
export type OwnerTestimonial = OwnerContentSettings["homepage"]["testimonials"][number];
export type OwnerSponsor = OwnerContentSettings["homepage"]["sponsors"][number];
export type OwnerService = OwnerContentSettings["homepage"]["services"][number];
export type OwnerPublicSite = OwnerContentSettings["site"];

export const defaultOwnerContentSettings: OwnerContentSettings = {
  site: {
    email: siteConfig.email,
    phone: siteConfig.phone,
    phoneDisplay: siteConfig.phoneDisplay,
    landline: siteConfig.landline,
    landlineDisplay: siteConfig.landlineDisplay,
    address: siteConfig.address,
    navigation: siteConfig.navigation.map((item) => ({ ...item, enabled: true })),
    footerEyebrow: "Γίνε μέρος της ομάδας",
    footerTitle: "Το παιχνίδι ξεκινά εδώ.",
    footerButtonLabel: "Εγγραφές 2026–2027",
    footerButtonHref: "/eggrafes-2026-2027",
    footerWordmark: "ALANA FC",
  },
  homepage: {
    sectionOrder: [
      { id: "intro", enabled: true },
      { id: "services", enabled: true },
      { id: "news", enabled: true },
      { id: "testimonials", enabled: true },
      { id: "sponsors", enabled: true },
      { id: "contact", enabled: true },
    ],
    heroSlides: [
      { enabled: true, href: "/eggrafes-2026-2027", button: "Εγγραφές 2026–2027", eyebrow: "Η νέα σεζόν ξεκινά", title: "Μαθαίνουμε. Παίζουμε. Μεγαλώνουμε.", description: "Ένας χώρος όπου κάθε παιδί εξελίσσεται μέσα από το ποδόσφαιρο, την ομαδικότητα και τη χαρά του παιχνιδιού.", image: "/alana_fc_academy_images_wordpress/alanafc-eggrafes-2026-hero.jpg", alt: "Εγγραφές παιδιών στην Alana FC Academy" },
      { enabled: true, href: "/about-us", button: "Γνωρίστε την Alana", eyebrow: "Η φιλοσοφία μας", title: "Περισσότερο από μία ομάδα.", description: "Γνωρίστε την ιστορία, τις αξίες και τους ανθρώπους που κάνουν το γήπεδο έναν τόπο όπου κάθε παιδί ανήκει.", image: "/alana_fc_academy_images_wordpress/this-is-alana.jpg", alt: "Η κοινότητα της Alana FC Academy" },
      { enabled: true, href: "/contact-us", button: "Επικοινωνήστε μαζί μας", eyebrow: "Είμαστε δίπλα σας", title: "Ας μιλήσουμε για το επόμενο παιχνίδι.", description: "Για προπονήσεις, τμήματα και οποιαδήποτε ερώτηση, η ομάδα της Alana είναι εδώ για εσάς.", image: "/alana_fc_academy_images_wordpress/alana_sportsclub_contact_us_2.jpg", alt: "Οι εγκαταστάσεις της Alana FC Academy" },
    ],
    introEyebrow: "ALANA FC ACADEMY · 01",
    introTitle: "Περισσότερο από μία ακαδημία ποδοσφαίρου.",
    introText: "Χτίζουμε χαρακτήρες, φιλίες και αυτοπεποίθηση. Η προπόνηση γίνεται εμπειρία και το γήπεδο ένας τόπος όπου κάθε παιδί ανήκει.",
    introButtonLabel: "Μίλησε μαζί μας",
    introButtonHref: "/contact-us",
    latestPostsCount: 6,
    newsEyebrow: "Από το γήπεδο · 04",
    newsTitle: "Τελευταία νέα.",
    newsButtonLabel: "Όλα τα νέα",
    newsEmptyText: "Τα νέα εμφανίζονται εδώ μόλις δημοσιευθούν από τη διαχείριση.",
    servicesEyebrow: "Η Alana από κοντά",
    servicesTitle: "Οι άνθρωποι και οι χώροι πίσω από κάθε προπόνηση.",
    services: [
      { enabled: true, title: "Προπονητές", href: "/coaching-staff", buttonLabel: "Γνωρίστε την ομάδα", description: "Άνθρωποι με γνώση, συνέπεια και πραγματικό ενδιαφέρον για την εξέλιξη κάθε παιδιού.", keywords: ["Εκπαίδευση", "Καθοδήγηση", "Ασφάλεια"], image: "/alana_fc_academy_images_wordpress/coaches_11zon_11zon-scaled.jpg" },
      { enabled: true, title: "Εγκαταστάσεις", href: "/our-facilities", buttonLabel: "Δείτε τους χώρους", description: "Οργανωμένοι χώροι για καθημερινή προπόνηση, παιχνίδι και σταθερή βελτίωση.", keywords: ["Γήπεδο", "Προπόνηση", "Οργάνωση"], image: "/alana_fc_academy_images_wordpress/alana_ghpedo_1.jpg" },
      { enabled: true, title: "Sports Club", href: "/sportclub-alana", buttonLabel: "Ανακαλύψτε το club", description: "Μία κοινότητα που ενώνει παιδιά, οικογένειες και ανθρώπους με κοινή αγάπη για το ποδόσφαιρο.", keywords: ["Κοινότητα", "Ομάδα", "Εμπειρίες"], image: "/alana_fc_academy_images_wordpress/alana_sportsclub_contact_us_2.jpg" },
    ],
    testimonials: academyTestimonials.map(({ name, role, quote, image }) => ({ enabled: true, name, role, quote, image })),
    testimonialsEyebrow: "Testimonials",
    testimonialsTitle: "Είπαν για εμάς.",
    sponsors: academySponsors.map((item) => ({ ...item, enabled: true })),
    sponsorsEyebrow: "Partners",
    sponsorsTitle: "Οι χορηγοί μας.",
    contactTitle: "Η επόμενη κίνηση ξεκινά με μια συζήτηση.",
    contactEyebrow: "Επικοινωνία · 06",
    contactText: "Για τμήματα, προπονήσεις, εγγραφές ή συνεργασίες, η ομάδα της Alana FC είναι εδώ για να σας ακούσει.",
    contactButtonLabel: "Μιλήστε με την ομάδα μας",
  },
};
