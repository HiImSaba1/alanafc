import type { NextConfig } from "next";

// Keep this list in sync with src/lib/security-headers.ts. Next loads this
// configuration before application aliases and TypeScript modules are available
// on older shared-hosting runtimes, so the config must remain self-contained.
const publicSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // Uploaded media is already converted into responsive WebP derivatives.
  // Serve those files directly so shared-hosting/runtime uploads do not depend
  // on the Next image proxy being able to reopen newly-created public files.
  images: { unoptimized: true },
  serverExternalPackages: ["@node-rs/argon2", "drizzle-orm", "mysql2"],
  experimental: {
    cpus: 1,
    serverActions: { bodySizeLimit: "14mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: publicSecurityHeaders }];
  },
};

export default nextConfig;
