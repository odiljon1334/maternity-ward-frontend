/**
 * Next.js 14'da `instrumentation.ts` hali "experimental" — next.config.mjs
 * ichida `experimental.instrumentationHook: true` yoqilgan (Sentry buni
 * o'zi ham avtomatik yoqadi). Bu fayl server ko'tarilganda BIR MARTA
 * chaqiriladi va runtime turiga qarab tegishli Sentry konfiguratsiyasini
 * yuklaydi (Faza 3).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
