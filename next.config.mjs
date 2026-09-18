import withPWA from "next-pwa";
import { withSentryConfig } from "@sentry/nextjs/config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
    ],
  },
  // Next.js 14'da instrumentation.ts (register()) hali "experimental" —
  // Sentry shu orqali server/edge konfiguratsiyasini yuklaydi (Faza 3).
  experimental: {
    instrumentationHook: true,
  },
};

const configWithPWA = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",

  buildExcludes: [
    /middleware-manifest\.json$/,
    /app-build-manifest\.json$/,
  ],

  fallbacks: {
    document: "/offline",
  },

  customWorkerDir: "worker",
})(nextConfig);

// Sentry — SENTRY_AUTH_TOKEN berilmagan bo'lsa (masalan bu build muhitida)
// sourcemap yuklash butunlay o'chiriladi, build hech qachon shu sababdan
// muvaffaqiyatsiz bo'lmaydi.
export default withSentryConfig(configWithPWA, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
