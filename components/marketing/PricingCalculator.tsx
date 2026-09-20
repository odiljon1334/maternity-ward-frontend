"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/utils";
import {
  Check,
  ArrowRight,
  Calculator,
  Gift,
  Wrench,
  Palette,
  Sparkles,
  Smartphone,
  Send,
  ScanFace,
  MapPin,
  FileSpreadsheet,
} from "lucide-react";

interface PricingCalculatorProps {
  onSelectPlan: (plan: "start" | "biznes" | "korporativ", staffCount: number, isAnnual: boolean) => void;
  onOpenProposal?: (data: { employees: number; salary: number; lostMinutes: number; monthlyLoss: number; savings: number }) => void;
}

export function PricingCalculator({ onSelectPlan, onOpenProposal }: PricingCalculatorProps) {
  const [isAnnual, setIsAnnual] = useState(true);
  const [sliderStaff, setSliderStaff] = useState(45);

  // Logic based on market research in Uzbekistan (Clockster, Billz, Workly, Jowi)
  const getCalculation = (staff: number, annual: boolean) => {
    if (staff <= 15) {
      const monthly = 190000;
      const annualTotal = 1900000; // 2 months free
      return {
        total: annual ? annualTotal : monthly,
        perStaff: annual ? Math.round(annualTotal / staff) : Math.round(monthly / staff),
        savings: monthly * 12 - annualTotal,
      };
    } else if (staff <= 100) {
      const monthlyPerStaff = 14000;
      const annualPerStaff = 120000; // ~10,000 / month
      const monthly = staff * monthlyPerStaff;
      const annualTotal = staff * annualPerStaff;
      return {
        total: annual ? annualTotal : monthly,
        perStaff: annual ? annualPerStaff : monthlyPerStaff,
        savings: monthly * 12 - annualTotal,
      };
    } else {
      const monthlyPerStaff = 10000;
      const annualPerStaff = 90000; // 7,500 / month
      const monthly = staff * monthlyPerStaff;
      const annualTotal = staff * annualPerStaff;
      return {
        total: annual ? annualTotal : monthly,
        perStaff: annual ? annualPerStaff : monthlyPerStaff,
        savings: monthly * 12 - annualTotal,
      };
    }
  };

  const currentCalc = getCalculation(sliderStaff, isAnnual);
  const currentTotal = currentCalc.total;
  const savingsAmount = currentCalc.savings;

  // Recommended tier based on count
  const recommendedTier =
    sliderStaff <= 15 ? "start" : sliderStaff <= 100 ? "biznes" : "korporativ";

  const isFreeTerminalEligible = sliderStaff >= 1000;

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
            <Calculator className="w-3.5 h-3.5" />
            <span>Shaffof &bull; Xodimlar Soniga Mos Narxlar</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Korxonangiz o&apos;lchamiga mos tarifni tanlang
          </h2>

          <p className="text-base text-slate-600 dark:text-slate-300">
            Har bir korxona o&apos;z logotipi va brendi bilan ishlaydi. 14 kunlik sinov davri barcha tariflarda mavjud.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <span
              className={`text-xs font-semibold cursor-pointer ${
                !isAnnual ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-500"
              }`}
              onClick={() => setIsAnnual(false)}
            >
              Oylik to&apos;lov
            </span>

            <button
              type="button"
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-7 w-14 items-center rounded-full bg-slate-200 dark:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  isAnnual ? "translate-x-8 bg-blue-600" : "translate-x-1"
                }`}
              />
            </button>

            <span
              className={`text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                isAnnual ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-500"
              }`}
              onClick={() => setIsAnnual(true)}
            >
              <span>Yillik to&apos;lov</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                2 oy bepul (~20% tejamkorlik)
              </span>
            </span>
          </div>
        </div>

        {/* Interactive Slider Widget */}
        <div className="max-w-3xl mx-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm mb-16 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Xodimlar soni (shifokor, ishchi, mutaxassis):
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                  {sliderStaff}
                </span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  nafar xodim
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Hisoblangan qiymat ({isAnnual ? "Yillik" : "Oylik"}):
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white" suppressHydrationWarning>
                {formatNumber(currentTotal)}{" "}
                <span className="text-sm font-normal text-slate-500">
                  so&apos;m/{isAnnual ? "yil" : "oy"}
                </span>
              </div>
              {isAnnual && (
                <p className="text-[11px] text-emerald-600 font-semibold" suppressHydrationWarning>
                  Oylikka nisbatan {formatNumber(savingsAmount)} so&apos;m tejaladi
                </p>
              )}
            </div>
          </div>

          {/* Slider input up to 1200 */}
          <div className="space-y-2">
            <input
              type="range"
              min={5}
              max={1200}
              step={5}
              value={sliderStaff}
              onChange={(e) => setSliderStaff(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>5 (Start)</span>
              <span>100 (Biznes)</span>
              <span>500 (Katta)</span>
              <span className="font-bold text-emerald-600">1000+ (Terminallar Bepul)</span>
            </div>
          </div>

          {/* Dynamic Policy Notice Banner inside slider widget */}
          {isFreeTerminalEligible ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 block">
                  🎉 1000+ xodim: Barcha Face ID terminallari va montaj ishlari korporativ paketga kiritilgan!
                </span>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                  Uskunalarni yetkazib berish, joyida o&apos;rnatish va montaj qilish korxona uchun qo&apos;shimcha to&apos;lovlarsiz taqdim etiladi.
                </p>
              </div>
            </div>
          ) : sliderStaff >= 15 && sliderStaff <= 100 ? (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Wrench className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong>15–100 xodim:</strong> Terminal apparati va kabeli xaridi korxonadan, dasturiy ulanish va sozlash xizmati to&apos;liq kiritilgan.
                </span>
              </div>
              <span className="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider shrink-0">
                &ldquo;{recommendedTier}&rdquo; tarifi
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-xs">
              <span className="text-slate-700 dark:text-slate-300">
                Sizning xodimlar soningizga mos tarif:
              </span>
              <span className="font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                &ldquo;{recommendedTier}&rdquo; tarifi
              </span>
            </div>
          )}

          {/* Quick Commercial Proposal Trigger */}
          {onOpenProposal && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() =>
                  onOpenProposal({
                    employees: sliderStaff,
                    salary: 4500000,
                    lostMinutes: 18,
                    monthlyLoss: Math.round(sliderStaff * 18 * 22 * (4500000 / (22 * 480)) + sliderStaff * 4500000 * 0.025),
                    savings: Math.max(0, Math.round(sliderStaff * 18 * 22 * (4500000 / (22 * 480)) + sliderStaff * 4500000 * 0.025) - (sliderStaff <= 15 ? 190000 : sliderStaff * 10000)),
                  })
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Ushbu hisob-kitob bo&apos;yicha Direktor uchun Tijoriy Taklif (PDF) chiqarish</span>
              </button>
            </div>
          )}
        </div>

        {/* 3 Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* 1. START TIER */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pt-10 pb-8 px-6 sm:px-7 flex flex-col justify-between hover:shadow-xl transition-all">
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Kichik korxona &amp; Filiallar
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Start
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed min-h-[36px]">
                  Kichik ofis, dorixona, stomatologiya va xususiy do&apos;konlar (1–15 xodim)
                </p>
              </div>

              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {isAnnual ? "1 900 000" : "190 000"}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    so&apos;m / paket / {isAnnual ? "yil" : "oy"}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {isAnnual ? "Oyiga ~158 000 so'm (2 oy tejaladi)" : "15 nafargacha xodim uchun qulay fikslangan narx"}
                </span>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-start gap-2.5 font-semibold text-slate-900 dark:text-white">
                  <Palette className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <span>O&apos;z logotipingiz va korxona nomi (White-Label)</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <Smartphone className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <span><strong>FaceID qurilma majburiy emas:</strong> Smartfonda GPS + selfi orqali tezkor check-in</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <Send className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <span><strong>Director Telegram xabarnomasi:</strong> Real yuz surati, aniq vaqt va geolokatsiya</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Mavjud biometrik terminalni ulash imkoniyati</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Har bir kun uchun shaxsiy ish jadvali va smenalar</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Excel (.xlsx) avtomatlashtirilgan oylik tabeli</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectPlan("start", Math.min(sliderStaff, 15), isAnnual)}
              className="mt-8 w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Start bilan boshlash (14 kun sinov)
            </button>
          </div>

          {/* 2. BIZNES TIER (FEATURED) */}
          <div className="relative rounded-3xl border-2 border-blue-600 bg-white dark:bg-slate-900 pt-11 pb-8 px-6 sm:px-7 flex flex-col justify-between shadow-xl shadow-blue-500/10">
            {/* Featured badge - perfectly centered and non-squashed */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 text-white text-[11px] font-black uppercase tracking-wider shadow-lg whitespace-nowrap inline-flex items-center gap-1.5 z-10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Eng Ommabop &bull; Biznes</span>
            </div>

            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                  Klinikalar, Zavodlar &amp; Ofislar
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Biznes
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed min-h-[36px]">
                  Tug&apos;ruqxonalar, poliklinikalar, ishlab chiqarish sexlari va korxonalar (16–100 xodim)
                </p>
              </div>

              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {isAnnual ? "120 000" : "14 000"}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    so&apos;m / xodim / {isAnnual ? "yil" : "oy"}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                  {isAnnual ? "Yillik to'lovda oyiga atigi 10 000 so'm / xodim" : "Sozlash va dasturiy ulanish xizmati paketga kiritilgan"}
                </span>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-start gap-2.5 font-semibold text-slate-900 dark:text-white">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Start tarifining barcha imkoniyatlari</span>
                </div>
                <div className="flex items-start gap-2.5 text-blue-600 dark:text-blue-400 font-semibold">
                  <ScanFace className="w-4 h-4 shrink-0 mt-0.5" />
                  <span><strong>Biometrik Face ID Terminallari:</strong> Hikvision, Dahua, ZKTeco yoki Uniview jonli oqimi</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <Send className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <span><strong>Director Telegram Boti:</strong> Jonli yuz snapshoti, aniq vaqt va kechikish bildirishnomasi</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span><strong>Mobile Xodim Ilovasi:</strong> Shaxsiy davomat, ish grafigi va ta&apos;til so&apos;rovlari</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <Wrench className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span><strong>Shaffof uskunalar siyosati:</strong> Faqat apparat xarid qilinadi, o&apos;rnatish va sozlash xizmati qoplanadi</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>24/7 smenalar, tungi navbatchiliklar &amp; kunlik moslashuvchan reja</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Avtomatik ish haqi, tungi smena ustamalari &amp; T-13 tabel</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectPlan("biznes", Math.max(16, sliderStaff), isAnnual)}
              className="mt-8 w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Biznes bilan boshlash (14 kun sinov)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3. KORPORATIV TIER */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pt-10 pb-8 px-6 sm:px-7 flex flex-col justify-between hover:shadow-xl transition-all">
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Yirik Korxonalar &bull; Zavod &amp; Birlashmalar
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Korporativ / Enterprise
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed min-h-[36px]">
                  Yirik zavodlar, viloyat shifoxonalari va ko&apos;p filialli tarmoqlar (100+ va 1000+ xodim)
                </p>
              </div>

              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {isAnnual ? "90 000" : "10 000"}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    so&apos;m / xodim / {isAnnual ? "yil" : "oy"}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                  1000+ xodim: Terminallar va to&apos;liq montaj paket tarkibiga kiritilgan!
                </span>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-start gap-2.5 font-semibold text-slate-900 dark:text-white">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Biznes tarifining barcha imkoniyatlari</span>
                </div>
                <div className="flex items-start gap-2.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  <Gift className="w-4 h-4 shrink-0 mt-0.5" />
                  <span><strong>1000+ xodim:</strong> Barcha Face ID terminallari va montaj korporativ shartnomada taqdim etiladi</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <ScanFace className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <span><strong>Markazlashgan Director Nazorati:</strong> Barcha filiallar va turniketlardan yagona oqim</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Cheksiz biometrik terminallar, turniketlar va kameralar integratsiyasi</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>1C, MedSoft, Didox va korporativ ERP tizimlari bilan to&apos;g&apos;ridan-to&apos;g&apos;ri API</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Gemini AI Kadrlar Tahlili &amp; Anomaliyalar</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Shaxsiy kurator va 24/7 VIP muhandis yordami</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>SLA 99.9% kafolati &amp; Rasmiy shartnoma orqali to&apos;lov</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectPlan("korporativ", Math.max(100, sliderStaff), isAnnual)}
              className="mt-8 w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Korporativ reja bilan boshlash
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
