import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

type PublicMetadataInput = {
  title: string;
  description: string;
  path: `/${string}` | "/";
  image?: string;
  imageAlt?: string;
};

export function publicPageMetadata({ title, description, path, image = siteConfig.socialImage, imageAlt = siteConfig.name }: PublicMetadataInput): Metadata {
  const socialTitle = `${title} | ${siteConfig.name}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "el_GR",
      siteName: siteConfig.name,
      title: socialTitle,
      description,
      url: path,
      images: [{ url: image, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image],
    },
  };
}
