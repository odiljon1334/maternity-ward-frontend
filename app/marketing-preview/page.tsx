"use client";
import { IndustryUseCases } from "@/components/marketing/IndustryUseCases";
import { TelegramBotSimulator } from "@/components/marketing/TelegramBotSimulator";
import { IntegrationsSection } from "@/components/marketing/IntegrationsSection";

/**
 * VAQTINCHALIK PREVIEW SAHIFASI — StaffPulse-Reja.md, 1-to'plam, 2/3/4-band.
 *
 * Bu FAZA 4'ning yakuniy marketing landing sahifasi EMAS — u Odiljon
 * bergan tayyor GitHub loyihasidan (yoki shu ilova ichida) alohida
 * quriladi. Bu sahifa faqat uchta yangi bo'limni (sohaviy use-case'lar,
 * Telegram bot simulyatori, integratsiyalar) ko'rib chiqish/tasdiqlash
 * uchun — tasdiqlangach, `components/marketing/*` komponentlari
 * yakuniy landing sahifasiga to'g'ridan-to'g'ri ko'chiriladi.
 *
 * Middleware autentifikatsiya talab qiladi — ko'rish uchun avval
 * tizimga kiring.
 */
export default function MarketingPreviewPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 py-12 sm:px-8">
      <div className="mx-auto mb-10 max-w-4xl rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4 text-center text-xs text-amber-600">
        ⚠️ Bu — vaqtinchalik preview sahifa (StaffPulse g&apos;oyalari, 2/3/4-band). Yakuniy marketing
        landing sahifasi FAZA 4 doirasida alohida quriladi.
      </div>

      <div className="space-y-20">
        <IndustryUseCases />
        <TelegramBotSimulator />
        <IntegrationsSection />
      </div>
    </div>
  );
}
