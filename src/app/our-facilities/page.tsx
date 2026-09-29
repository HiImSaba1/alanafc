import type { Metadata } from "next";
import { AcademyDestinationPage } from "@/components/content/academy-destination-page";
import { facilitiesPage } from "@/data/academy-destinations";
import { publicPageMetadata } from "@/features/seo/public-metadata";
import { preferredMediaUrl, publicPageBySlug } from "@/features/content/queries";

export const metadata: Metadata = publicPageMetadata({ title: "Οι εγκαταστάσεις μας", description: facilitiesPage.intro, path: "/our-facilities", image: facilitiesPage.heroImage, imageAlt: facilitiesPage.heroAlt });

export const dynamic = "force-dynamic";
export default async function FacilitiesPage() { const entry = await publicPageBySlug("our-facilities"); const data = entry ? { ...facilitiesPage, title: entry.content.title, intro: entry.content.excerpt || facilitiesPage.intro, heroImage: preferredMediaUrl(entry.media) || facilitiesPage.heroImage } : facilitiesPage; return <AcademyDestinationPage data={data} managedBodyHtml={entry?.content.bodyHtml} />; }
