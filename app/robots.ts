import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://clinicuk24.com";

  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/tariflar",
        "/video-qollanma",
        "/ilova",
        "/maxfiylik",
        "/foydalanish-shartlari",
        "/login",
      ],
      // Ichki, autentifikatsiya talab qiladigan bo'limlar indekslanmaydi
      disallow: ["/dashboard/", "/panel/", "/register", "/forgot-password", "/reset-password", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
