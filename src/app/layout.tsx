import type { Metadata, Viewport } from "next";
import { Roboto_Flex, Roboto_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/layout/site-chrome";
import { academyStructuredData, safeStructuredData } from "@/features/seo/site-structured-data";
import { siteConfig } from "@/lib/site";
import { getOwnerContentSettings } from "@/features/site-settings/owner-content";
import "./globals.css";

const alanaSans = Roboto_Flex({
  variable: "--font-alana-sans",
  subsets: ["greek", "latin"],
});

const alanaMono = Roboto_Mono({
  variable: "--font-alana-mono",
  subsets: ["greek", "latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "1254x1254" }],
    apple: [{ url: "/icon.png", type: "image/png", sizes: "1254x1254" }],
  },
  openGraph: { type: "website", locale: "el_GR", siteName: siteConfig.name, title: siteConfig.name, description: siteConfig.description, url: "/", images: [{ url: siteConfig.socialImage, width: 2048, height: 1495, alt: "Παιδιά της Alana FC Academy στο γήπεδο" }] },
  twitter: { card: "summary_large_image", title: siteConfig.name, description: siteConfig.description, images: [siteConfig.socialImage] },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#050505", colorScheme: "light" };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const ownerContent = await getOwnerContentSettings();
  return (
    <html
      lang="el"
      className={`${alanaSans.variable} ${alanaMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script id="academy-structured-data" type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeStructuredData(academyStructuredData()) }} />
        <SiteChrome site={ownerContent.site}>{children}</SiteChrome>
      </body>
    </html>
  );
}
