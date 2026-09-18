import * as Sentry from "@sentry/nextjs";

/** Sentry — Edge runtime (masalan middleware) uchun (Faza 3). */
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || "production",
    tracesSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || 0,
    ),
  });
}
