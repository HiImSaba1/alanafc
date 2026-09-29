import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f2eee6",
    theme_color: "#050505",
    lang: "el",
    categories: ["sports", "education"],
    icons: [{ src: "/icon.png", sizes: "1254x1254", type: "image/png", purpose: "any" }],
  };
}
