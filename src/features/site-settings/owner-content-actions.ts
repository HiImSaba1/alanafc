"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requireAdmin } from "@/features/admin-auth/session";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { ownerContentSettingsSchema } from "./owner-content-contract";
import { ownerContentSettingsKey } from "./owner-content";

const value = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
const checked = (data: FormData, key: string) => data.get(key) === "on";

export async function updateOwnerContentSettings(formData: FormData) {
  const admin = await requireAdmin();
  const navigationCount = Math.min(Math.max(Number(formData.get("navigationCount")) || 0, 1), 10);
  const heroCount = Math.min(Math.max(Number(formData.get("heroCount")) || 0, 1), 6);
  const testimonialCount = Math.min(Math.max(Number(formData.get("testimonialCount")) || 0, 1), 10);
  const sponsorCount = Math.min(Math.max(Number(formData.get("sponsorCount")) || 0, 1), 8);
  const serviceCount = Math.min(Math.max(Number(formData.get("serviceCount")) || 0, 1), 6);
  const input = {
    site: {
      email: value(formData, "site.email"), phone: value(formData, "site.phone"), phoneDisplay: value(formData, "site.phoneDisplay"),
      landline: value(formData, "site.landline"), landlineDisplay: value(formData, "site.landlineDisplay"), address: value(formData, "site.address"),
      navigation: Array.from({ length: navigationCount }, (_, index) => ({
        enabled: checked(formData, `navigation.${index}.enabled`), label: value(formData, `navigation.${index}.label`), href: value(formData, `navigation.${index}.href`), image: value(formData, `navigation.${index}.image`),
      })),
      footerEyebrow: value(formData, "site.footerEyebrow"), footerTitle: value(formData, "site.footerTitle"),
      footerButtonLabel: value(formData, "site.footerButtonLabel"), footerButtonHref: value(formData, "site.footerButtonHref"), footerWordmark: value(formData, "site.footerWordmark"),
    },
    homepage: {
      heroSlides: Array.from({ length: heroCount }, (_, index) => ({
        enabled: checked(formData, `hero.${index}.enabled`), href: value(formData, `hero.${index}.href`), button: value(formData, `hero.${index}.button`), eyebrow: value(formData, `hero.${index}.eyebrow`), title: value(formData, `hero.${index}.title`), description: value(formData, `hero.${index}.description`), image: value(formData, `hero.${index}.image`), alt: value(formData, `hero.${index}.alt`),
      })),
      introEyebrow: value(formData, "homepage.introEyebrow"), introTitle: value(formData, "homepage.introTitle"), introText: value(formData, "homepage.introText"),
      introButtonLabel: value(formData, "homepage.introButtonLabel"), introButtonHref: value(formData, "homepage.introButtonHref"), latestPostsCount: Number(formData.get("homepage.latestPostsCount")),
      services: Array.from({ length: serviceCount }, (_, index) => ({
        enabled: checked(formData, `service.${index}.enabled`), title: value(formData, `service.${index}.title`), href: value(formData, `service.${index}.href`), buttonLabel: value(formData, `service.${index}.buttonLabel`), description: value(formData, `service.${index}.description`), keywords: value(formData, `service.${index}.keywords`).split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean), image: value(formData, `service.${index}.image`),
      })),
      testimonials: Array.from({ length: testimonialCount }, (_, index) => ({
        enabled: checked(formData, `testimonial.${index}.enabled`), name: value(formData, `testimonial.${index}.name`), role: value(formData, `testimonial.${index}.role`), quote: value(formData, `testimonial.${index}.quote`), image: value(formData, `testimonial.${index}.image`),
      })),
      sponsors: Array.from({ length: sponsorCount }, (_, index) => ({
        enabled: checked(formData, `sponsor.${index}.enabled`), name: value(formData, `sponsor.${index}.name`), href: value(formData, `sponsor.${index}.href`), image: value(formData, `sponsor.${index}.image`),
      })),
      contactTitle: value(formData, "homepage.contactTitle"), contactEyebrow: value(formData, "homepage.contactEyebrow"), contactText: value(formData, "homepage.contactText"), contactButtonLabel: value(formData, "homepage.contactButtonLabel"),
    },
  };
  const parsed = ownerContentSettingsSchema.safeParse(input);
  if (!parsed.success) throw new Error("Ελέγξτε τα πεδία. Οι διαδρομές εικόνων/σελίδων πρέπει να αρχίζουν με / και οι σύνδεσμοι χορηγών με https://.");
  if (!parsed.data.homepage.heroSlides.some((item) => item.enabled)) throw new Error("Πρέπει να παραμείνει ενεργή τουλάχιστον μία διαφάνεια.");
  if (!parsed.data.site.navigation.some((item) => item.enabled)) throw new Error("Πρέπει να παραμείνει ενεργός τουλάχιστον ένας σύνδεσμος μενού.");

  await db.insert(siteSettings).values({ settingKey: ownerContentSettingsKey, valueJson: parsed.data, updatedByUserId: admin.id })
    .onDuplicateKeyUpdate({ set: { valueJson: parsed.data, updatedByUserId: admin.id } });
  await audit("site.owner_content.updated", admin.id, "site_setting", ownerContentSettingsKey);
  revalidatePath("/", "layout");
  revalidatePath("/admin/site");
  redirect("/admin/site?saved=1");
}
