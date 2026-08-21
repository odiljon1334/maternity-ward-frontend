/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const APP_URL = "https://clinicuk24.com";
const APP_NAME = "MaternityCare";
const APP_TITLE = "MaternityCare — Aqlli Boshqaruv Tizimi";
const APP_DESCRIPTION =
  "Tug'ruq xona xodimlari davomati, maosh va kasalxona operatsiyalarini bir platformada boshqaring. " +
  "Умная система управления персоналом роддома — учёт посещаемости, зарплаты и операций в одной платформе.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  title: {
    default: APP_TITLE,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "tug'ruq xona", "davomat tizimi", "xodimlar boshqaruvi", "maosh hisoblash",
    "kasalxona tizimi", "Hikvision integratsiya",
    "роддом", "система учёта посещаемости", "управление персоналом больницы",
    "MaternityCare", "clinicuk24",
  ],
  authors: [{ name: APP_NAME, url: APP_URL }],
  creator: APP_NAME,
  publisher: APP_NAME,
  robots: { index: true, follow: true },

  // ── Open Graph ────────────────────────────────────────────────
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: APP_NAME,
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    locale: "uz_UZ",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: APP_TITLE,
        type: "image/png",
      },
    ],
  },

  // ── Twitter / X Card ─────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: ["/opengraph-image"],
  },

  // ── PWA / Icons ───────────────────────────────────────────────
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
