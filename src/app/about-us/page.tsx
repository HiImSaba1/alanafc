import type { Metadata } from "next";
import { AcademyDestinationPage } from "@/components/content/academy-destination-page";
import { aboutAcademyPage } from "@/data/academy-destinations";
import { publicPageMetadata } from "@/features/seo/public-metadata";
import { preferredMediaUrl, publicPageBySlug } from "@/features/content/queries";

export const metadata: Metadata = publicPageMetadata({ title: "Η Ακαδημία", description: aboutAcademyPage.intro, path: "/about-us", image: aboutAcademyPage.heroImage, imageAlt: aboutAcademyPage.heroAlt });

export const dynamic = "force-dynamic";
export default async function AboutAcademyPage() { const entry = await publicPageBySlug("about-us"); const data = entry ? { ...aboutAcademyPage, title: entry.content.title, intro: entry.content.excerpt || aboutAcademyPage.intro, heroImage: preferredMediaUrl(entry.media) || aboutAcademyPage.heroImage } : aboutAcademyPage; return <AcademyDestinationPage data={data} managedBodyHtml={entry?.content.bodyHtml} />; }
