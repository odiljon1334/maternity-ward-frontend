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

  // API javoblari (xodimlar, oylik, davomat) va backend fayllari (selfilar)
  // HECH QACHON service worker keshiga tushmaydi: umumiy qurilmada keyingi
  // foydalanuvchi oldingisining ma'lumotini oflayn ko'rib qolmasin.
  // Faqat statik ilova fayllari keshlanadi. Birinchi mos qoida ishlaydi.
  runtimeCaching: [
    {
      // Boshqa domen (api.clinicuk24.com va h.k.) — shriftlardan tashqari
      urlPattern: ({ url }) =>
        url.origin !== self.origin &&
        !/^fonts\.(gstatic|googleapis)\.com$/i.test(url.hostname),
      handler: "NetworkOnly",
      options: {},
    },
    {
      urlPattern: ({ url }) =>
        url.origin === self.origin &&
        (url.pathname.startsWith("/api/") || url.pathname.startsWith("/uploads/")),
      handler: "NetworkOnly",
      options: {},
    },
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: { maxEntries: 8, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\/_next\/static\/.+\.(?:js|css|woff2?)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static",
        expiration: { maxEntries: 128, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|ico|webp|woff2?)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 64, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      // Sahifalar: tarmoq birinchi, oflaynda /offline (fallbacks.document)
      urlPattern: ({ request, url }) =>
        url.origin === self.origin && request.mode === "navigate",
      handler: "NetworkOnly",
      options: {},
    },
  ],
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
