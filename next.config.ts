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
  serverExternalPackages: ["@node-rs/argon2"],
  experimental: {
    cpus: 1,
    serverActions: { bodySizeLimit: "14mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: publicSecurityHeaders }];
  },
};

export default nextConfig;
