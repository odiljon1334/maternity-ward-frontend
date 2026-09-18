import * as Sentry from "@sentry/nextjs";

/**
 * Sentry — brauzer (client) tomonidagi xatoliklarni kuzatish (Faza 3).
 * NEXT_PUBLIC_SENTRY_DSN berilmagan bo'lsa (masalan lokal dev'da) Sentry
 * umuman ishga tushmaydi — hech qanday tarmoq so'rovi yubormaydi.
 *
 * DIQQAT: Session Replay (ekranni yozib olish) ATAYIN yoqilmagan — bu
 * tibbiy muassasa HR/davomat tizimi, xodimlarning shaxsiy/tibbiy
 * ma'lumotlari ekranda ko'rinishi mumkin.
 */
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || "production",
    tracesSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || 0,
    ),
  });
}
