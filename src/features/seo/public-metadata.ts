import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

type PublicMetadataInput = {
  title: string;
  description: string;
  path: `/${string}` | "/";
  image?: string;
  imageAlt?: string;
};

export function publicPageMetadata({ title, description, path }: PublicMetadataInput): Metadata {
  const socialTitle = `${title} | ${siteConfig.name}`;
  const image = siteConfig.socialImage;
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
      images: [{ url: image, alt: siteConfig.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image],
    },
  };
}
