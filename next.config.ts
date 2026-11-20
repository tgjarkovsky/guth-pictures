import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const csp = (frameAncestors: string) => [
  "default-src 'self'",
  "img-src 'self' res.cloudinary.com data: blob:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://bugfinder-khaki.vercel.app",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "connect-src 'self' api.cloudinary.com formspree.io https://bugfinder-khaki.vercel.app",
  `frame-ancestors ${frameAncestors}`,
].join("; ");

const nextConfig: NextConfig = {
  serverExternalPackages: ["cloudinary"],
  // Voucher PDFs embed these fonts at runtime (fs read), so ship them with the functions that render PDFs.
  outputFileTracingIncludes: {
    "/api/vouchers/**": ["./modules/vouchers/fonts/**"],
    "/api/cron/vouchers": ["./modules/vouchers/fonts/**"],
    "/api/admin/vouchers/**": ["./modules/vouchers/fonts/**"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    loader: "custom",
    loaderFile: "./lib/cloudinary-loader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/:locale(cs|en)/portfolio", destination: "/:locale", permanent: true },
      { source: "/:locale(cs|en)/o-mne", destination: "/:locale", permanent: true },
      { source: "/:locale(cs|en)/sluzby/brandove-foceni", destination: "/:locale", permanent: true },
      // Short link printed on gift vouchers
      { source: "/poukaz", destination: "/cs/darkovy-poukaz/uplatnit", permanent: false },
      { source: "/:locale(cs|en)/poukaz", destination: "/:locale/darkovy-poukaz/uplatnit", permanent: false },
      { source: "/:locale(cs|en)/darkovy-poukazy", destination: "/:locale/darkovy-poukaz", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: csp("'none'") },
        ],
      },
      {
        // Admin live preview is embedded in /admin via iframe — same origin only (auth in middleware).
        source: "/:locale(cs|en)/nahled/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: csp("'self'") },
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
      {
        source: "/admin(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
