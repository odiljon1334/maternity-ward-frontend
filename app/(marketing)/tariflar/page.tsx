"use client";

import { useState } from "react";
import {
  Check,
  X,
  Phone,
  Calculator,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { PricingCalculator } from "@/components/marketing/PricingCalculator";
import { OnboardingModal } from "@/components/marketing/OnboardingModal";
import { InteractiveDemoTour } from "@/components/marketing/InteractiveDemoTour";
import { VideoTutorialsModal } from "@/components/marketing/VideoTutorialsModal";

export default function PricingPage() {
  const [isTrialOpen, setIsTrialOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [activeTutorialId, setActiveTutorialId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"start" | "biznes" | "korporativ">("biznes");
  const [selectedStaffCount, setSelectedStaffCount] = useState(30);
  const [isAnnual, setIsAnnual] = useState(true);

  const handleOpenTrialWithPlan = (
    plan: "start" | "biznes" | "korporativ",
    staffCount: number,
    annual: boolean
  ) => {
    setSelectedPlan(plan);
    setSelectedStaffCount(staffCount);
    setIsAnnual(annual);
    setIsTrialOpen(true);
  };

  const COMPARISON_ROWS = [
    {
      feature: "Xodimlar soni doirasi",
      start: "1 – 14 xodim",
      biznes: "15 – 199 xodim",
      korporativ: "200 – 500 xodim (500+ individual)",
    },
    {
      feature: "O'z logotipingiz & korxona nomi (White-Label)",
      start: true,
      biznes: true,
      korporativ: "To'liq brending + Shaxsiy subdomen",
    },
    {
      feature: "FaceID qurilma majburiyligi",
      start: "Majburiy emas (smartfon GPS + selfie yetarli)",
      biznes: "Majburiy emas (terminal yoki mobil gibrid)",
      korporativ: "Majburiy emas (har qanday apparat ulanadi)",
    },
    {
      feature: "Face ID apparat qo'yish & o'rnatish to'lovi",
      start: "O'zingizda bor bo'lsa bepul ulab beriladi",
      biznes: "Faqat apparat va kabel to'lanadi. O'rnatish & sozlash xizmati TEKIN (0 so'm)!",
      korporativ: "1000+ xodim: Terminallar, kabellar va montaj BIZDAN MUTLAQO BEPUL!",
    },
    {
      feature: "Director uchun Hikvision terminal jonli snapshoti",
      start: "Faqat smartfon rasmi",
      biznes: "Terminaldan o'tganda Real yuz surati, vaqti, 'Vaqtida' / 'Kech keldi' Telegramga",
      korporativ: "Barcha filiallar terminallaridan jonli snapshotlar va kechikish ogohlantirishlari",
    },
    {
      feature: "Mobile orqali tasdiqlash (Smartfon)",
      start: "Selfie rasm + GPS geolokatsiya Telegramga",
      biznes: "Selfie rasm + GPS ish joyi geolokatsiyasi Telegram botga",
      korporativ: "Selfie + Geofencing radius nazorati + Telegram bot",
    },
    {
      feature: "Moslashuvchan smena va grafiklar",
      start: "Har bir kun uchun har xil vaqtdagi smena",
      biznes: "Har kungi turlicha smena + 24/7 navbatchilik",
      korporativ: "Cheksiz moslashuvchan grafiklar & smenalar",
    },
    {
      feature: "Video qo'llanmalar (Xodim, Face ID, Oylik maosh, Excel)",
      start: "5 ta to'liq video darslik",
      biznes: "5 ta to'liq video darslik",
      korporativ: "Video darsliklar + Shaxsiy kadrlar treningi",
    },
    {
      feature: "Avtomatlashtirilgan T-13 Tabel, Excel & PDF eksport",
      start: "Excel (.xlsx) yuklab olish va tahrirlash",
      biznes: "Excel + PDF muhr/imzoga tayyor",
      korporativ: "Excel + PDF + 1C:Korxona API sinxronizatsiya",
    },
    {
      feature: "Tungi smena ustamalari (1.5x) & bayram koeffitsienti",
      start: false,
      biznes: true,
      korporativ: true,
    },
    {
      feature: "Ertalabki 08:30 Telegram Bot xabarnomasi",
      start: "Standart kanal",
      biznes: "Kanal + Rahbariyat guruhi",
      korporativ: "Kanal + Shaxsiy korxona botlari",
    },
    {
      feature: "Xodim shaxsiy mobil va Telegram kabineti",
      start: true,
      biznes: true,
      korporativ: true,
    },
    {
      feature: "Gemini AI Kadrlar Tahlili & Anomaliyalar",
      start: false,
      biznes: false,
      korporativ: true,
    },
    {
      feature: "Admin va Kadrlar bo'limi o'rinlari",
      start: "1 ta admin",
      biznes: "3 ta admin",
      korporativ: "Cheksiz adminlar",
    },
    {
      feature: "To'lov usullari",
      start: "Click, Payme",
      biznes: "Click, Payme, Hisob-raqam",
      korporativ: "Hisob-raqam, Didox, Click, Payme",
    },
    {
      feature: "Texnik qo'llab-quvvatlash",
      start: "Standart (9:00 - 18:00)",
      biznes: "Tezkor (24/7 Telegram)",
      korporativ: "Shaxsiy kurator (VIP 24/7)",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <MarketingNav
        onOpenDemo={() => setIsDemoOpen(true)}
        onOpenTrial={() => setIsTrialOpen(true)}
        onOpenTutorials={() => setActiveTutorialId("terminal-setup")}
      />

      <main className="flex-1 pt-32 pb-20">
        {/* Page Hero */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Calculator className="w-3.5 h-3.5" />
            <span>Shaffof va Moslashuvchan Tariflar</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Har bir xodim uchun aniq va adolatli narx
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            1&ndash;14 xodim uchun oyiga 599 000 so&apos;m (chegirma), 15 xodimdan boshlab &mdash; atigi 15 000&ndash;12 000 so&apos;m/xodim/oy. Xodimlaringiz soniga qarab hisoblang va 14 kun bepul sinab ko&apos;ring.
          </p>
        </div>

        {/* Pricing Calculator with Interactive Slider */}
        <PricingCalculator onSelectPlan={handleOpenTrialWithPlan} />

        {/* Detailed Comparison Table */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-24">
          <div className="text-center space-y-3 mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Tariflar bo&apos;yicha to&apos;liq taqqoslash
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Qaysi tarif sizning tibbiyot muassasangizga eng mos kelishini solishtiring
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
                  <th className="p-4 font-bold text-slate-900 dark:text-white w-1/3">
                    Funksiya / Imkoniyat
                  </th>
                  <th className="p-4 font-bold text-slate-900 dark:text-white text-center">
                    Start (1-15 xodim)
                  </th>
                  <th className="p-4 font-bold text-blue-600 dark:text-blue-400 text-center bg-blue-50/40 dark:bg-blue-950/20">
                    Biznes (16-50 xodim)
                  </th>
                  <th className="p-4 font-bold text-slate-900 dark:text-white text-center">
                    Korporativ (50+)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200">
                      {row.feature}
                    </td>

                    {/* Start col */}
                    <td className="p-4 text-center text-slate-600 dark:text-slate-400">
                      {typeof row.start === "boolean" ? (
                        row.start ? (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-slate-300 mx-auto" />
                        )
                      ) : (
                        row.start
                      )}
                    </td>

                    {/* Biznes col */}
                    <td className="p-4 text-center font-medium text-slate-900 dark:text-white bg-blue-50/30 dark:bg-blue-950/10">
                      {typeof row.biznes === "boolean" ? (
                        row.biznes ? (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-slate-300 mx-auto" />
                        )
                      ) : (
                        row.biznes
                      )}
                    </td>

                    {/* Korporativ col */}
                    <td className="p-4 text-center text-slate-600 dark:text-slate-400">
                      {typeof row.korporativ === "boolean" ? (
                        row.korporativ ? (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-slate-300 mx-auto" />
                        )
                      ) : (
                        row.korporativ
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enterprise Callout */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-800 shadow-xl">
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                Respublika va Viloyat Markazlari Uchun
              </span>
              <h3 className="text-xl sm:text-2xl font-black">
                Maxsus server va yopiq tarmoq kerakmi?
              </h3>
              <p className="text-xs text-slate-300 max-w-md">
                500+ xodimi bo&apos;lgan yirik shifoxonalar uchun On-Premise server o&apos;rnatish va vazirlik integratsiyalari mavjud.
              </p>
            </div>
            <a
              href="https://t.me/clinicuk_support"
              target="_blank"
              rel="noreferrer"
              className="shrink-0 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-colors flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              <span>Mutaxassis bilan bog&apos;lanish</span>
            </a>
          </div>
        </div>
      </main>

      <MarketingFooter />

      {/* Modals */}
      <InteractiveDemoTour
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        onStartTrial={() => {
          setIsDemoOpen(false);
          setIsTrialOpen(true);
        }}
      />

      <OnboardingModal
        isOpen={isTrialOpen}
        onClose={() => setIsTrialOpen(false)}
        defaultPlan={selectedPlan}
        defaultStaffCount={selectedStaffCount}
        isAnnual={isAnnual}
      />

      <VideoTutorialsModal
        isOpen={!!activeTutorialId}
        onClose={() => setActiveTutorialId(null)}
        defaultLessonId={activeTutorialId || undefined}
      />
    </div>
  );
}
