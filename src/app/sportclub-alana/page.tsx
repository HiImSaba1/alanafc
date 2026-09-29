import type { Metadata } from "next";
import { AcademyDestinationPage } from "@/components/content/academy-destination-page";
import { sportsClubPage } from "@/data/academy-destinations";
import { publicPageMetadata } from "@/features/seo/public-metadata";
import { preferredMediaUrl, publicPageBySlug } from "@/features/content/queries";

export const metadata: Metadata = publicPageMetadata({ title: "Alana Sports Club", description: sportsClubPage.intro, path: "/sportclub-alana", image: sportsClubPage.heroImage, imageAlt: sportsClubPage.heroAlt });

export const dynamic = "force-dynamic";
export default async function SportsClubPage() { const entry = await publicPageBySlug("sportclub-alana"); const data = entry ? { ...sportsClubPage, title: entry.content.title, intro: entry.content.excerpt || sportsClubPage.intro, heroImage: preferredMediaUrl(entry.media) || sportsClubPage.heroImage } : sportsClubPage; return <AcademyDestinationPage data={data} managedBodyHtml={entry?.content.bodyHtml} />; }
