import type { Metadata } from "next";
import { AcademyDestinationPage } from "@/components/content/academy-destination-page";
import { coachingStaffPage } from "@/data/academy-destinations";
import { publicPageMetadata } from "@/features/seo/public-metadata";
import { preferredMediaUrl, publicPageBySlug } from "@/features/content/queries";

export const metadata: Metadata = publicPageMetadata({ title: "Οι άνθρωποί μας", description: coachingStaffPage.intro, path: "/coaching-staff", image: coachingStaffPage.heroImage, imageAlt: coachingStaffPage.heroAlt });

export const dynamic = "force-dynamic";
export default async function CoachingStaffPage() { const entry = await publicPageBySlug("coaching-staff"); const data = entry ? { ...coachingStaffPage, title: entry.content.title, intro: entry.content.excerpt || coachingStaffPage.intro, heroImage: preferredMediaUrl(entry.media) || coachingStaffPage.heroImage } : coachingStaffPage; return <AcademyDestinationPage data={data} managedBodyHtml={entry?.content.bodyHtml} />; }
