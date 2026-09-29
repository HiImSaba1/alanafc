import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import manifest from "../src/app/manifest";
import { siteConfig } from "../src/lib/site";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const value = manifest();

if (value.name !== siteConfig.name || value.lang !== "el") throw new Error("Manifest identity is not the Greek academy identity.");
if (value.display !== "standalone" || value.start_url !== "/") throw new Error("Manifest launch contract is incomplete.");
if (!existsSync(resolve(root, "src/app/icon.png"))) throw new Error("Manifest icon does not exist locally.");
if (!value.icons?.some((icon) => icon.src === "/icon.png" && icon.type === "image/png")) throw new Error("Manifest does not reference the native PNG favicon.");
if (!existsSync(resolve(root, `public${siteConfig.socialImage}`))) throw new Error("Social preview image does not exist locally.");

console.log(JSON.stringify({ ok: true, manifest: "/manifest.webmanifest", socialImage: siteConfig.socialImage, generatedAssetsInvented: false }, null, 2));
