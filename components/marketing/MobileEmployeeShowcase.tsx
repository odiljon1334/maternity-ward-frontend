"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ScanFace,
  ClipboardList,
  CalendarDays,
  Inbox,
  Wallet,
  Check,
  Smartphone,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileEmployeeShowcaseProps {
  onOpenTrial?: () => void;
}

type Screen = {
  id: string;
  tab: string;
  icon: LucideIcon;
  tone: string;
  title: string;
  text: string;
  points: string[];
  alt: string;
};

/**
 * Rasmlar — StaffPlusPRO ilovasining haqiqiy ekranlari, demo ma'lumot bilan.
 * Qayta olish: staffplus-mobile repo'sida `npm run screens`
 * (scripts/capture-screens.mjs → public/app-screens/*.png).
 */
const SCREENS: Screen[] = [
  {
    id: "checkin",
    tab: "Kelish",
    icon: ScanFace,
    tone: "bg-indigo-50 text-indigo-600",
    title: "Selfi va GPS bilan kelish-ketish",
    text: "Xodim ish joyiga yetib kelgach bitta tugmani bosadi: ilova joylashuvni ish joyi radiusi bilan solishtiradi va selfi oladi. Yuz profil rasmi bilan tekshiriladi.",
    points: [
      "Ish joyidan tashqarida yoki soxta GPS bilan belgilab bo'lmaydi",
      "Kechiksa, ilovaning o'zidan rahbariyatga sababini yuboradi",
      "Joylashuv faqat ish vaqtida kuzatiladi, ketishda to'xtaydi",
    ],
    alt: "Kelish ekrani: bugungi smena, ish joyi radiusi va «Kelishni tasdiqlash» tugmasi",
  },
  {
    id: "attendance",
    tab: "Davomat",
    icon: ClipboardList,
    tone: "bg-emerald-50 text-emerald-600",
    title: "Oylik davomat — xodimning o'zi ko'radi",
    text: "Har kun uchun kelgan-ketgan vaqti, kechikish va ishlangan soatlar taqvimda. Kadrlar bo'limi bilan tushunmovchilik qolmaydi.",
    points: [
      "Keldi, kechikdi, kelmadi, ta'til — rangli taqvim",
      "Davomat foizi va jami ishlangan soat",
      "Kunni bosib, aniq vaqtlarni ko'rish",
    ],
    alt: "Davomat ekrani: davomat foizi, statistika va oylik taqvim",
  },
  {
    id: "schedule",
    tab: "Grafik",
    icon: CalendarDays,
    tone: "bg-sky-50 text-sky-600",
    title: "Shaxsiy ish grafigi va smenalar",
    text: "Kunduzgi va tungi smenalar, dam olish kunlari va keyingi smena bir qarashda. Tungi smena yarim tundan o'tsa ham to'g'ri hisoblanadi.",
    points: [
      "Keyingi smena va oylik reja soatlari",
      "Hamkasb bilan smena almashish — rahbar tasdig'i bilan",
      "Ishga chiqishdan oldin Telegram eslatmasi",
    ],
    alt: "Grafik ekrani: keyingi smena, oy statistikasi va haftalik smenalar",
  },
  {
    id: "requests",
    tab: "So'rovlar",
    icon: Inbox,
    tone: "bg-amber-50 text-amber-600",
    title: "Ta'til, kechikish va almashish so'rovlari",
    text: "Ta'til, kasallik, \"Kechikaman\" xabari va smena almashish — hammasi bir joyda, qog'ozsiz. Har bir so'rovning holati ko'rinib turadi.",
    points: [
      "Holat: kutilmoqda, tasdiqlandi yoki rad etildi",
      "Tasdiqlangan kechikish oylikda uzrli hisoblanadi",
      "Tasdiqlangan almashishdan keyin grafik o'zi yangilanadi",
    ],
    alt: "So'rovlar ekrani: kechikish, ta'til va smena almashish so'rovlari",
  },
  {
    id: "pay",
    tab: "Maosh",
    icon: Wallet,
    tone: "bg-violet-50 text-violet-600",
    title: "Maosh varaqasi telefonda",
    text: "Hisoblangan summa, avans va ushlanmalar sababi bilan. Oy yopilmaguncha taxminiy summa ko'rinadi, tasdiqlangach — rasmiy varaqa.",
    points: [
      "Har bir qo'shimcha va ushlanmaning izohi",
      "Ilovadan avans so'rash",
      "PDF maosh varaqasi",
    ],
    alt: "Maosh ekrani: qo'lga tegadigan summa, hisoblangan maosh va avans",
  },
];

export function MobileEmployeeShowcase({ onOpenTrial }: MobileEmployeeShowcaseProps) {
  const [activeId, setActiveId] = useState(SCREENS[0].id);
  const active = SCREENS.find((s) => s.id === activeId) ?? SCREENS[0];
  const ActiveIcon = active.icon;

  return (
    <section id="mobile-app" className="py-20 sm:py-28 bg-white text-slate-900 relative overflow-hidden border-t border-slate-100">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-indigo-600/10 via-blue-600/10 to-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Smartphone className="w-3.5 h-3.5" />
            <span>StaffPlusPRO — Android ilova</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Xodim uchun ilova: kelish, grafik, so&apos;rovlar va maosh
          </h2>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Face ID terminal shart emas. Xodim o&apos;z telefonida selfi va GPS bilan davomatni belgilaydi, grafigini, so&apos;rovlarini va maosh varaqasini ko&apos;radi.
          </p>
        </div>

        {/* Telefonda: tablar → ekran → tavsif; kompyuterda tablar va tavsif chapda */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-6 lg:items-center">
          <div className="order-1 lg:order-none lg:col-span-6 lg:col-start-1 lg:row-start-1 lg:self-end">
            <div role="tablist" aria-label="Ilova ekranlari" className="p-1.5 rounded-2xl bg-slate-100 border border-slate-200 grid grid-cols-5 gap-1.5">
              {SCREENS.map((s) => {
                const Icon = s.icon;
                const selected = s.id === active.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls="mobile-app-screen"
                    onClick={() => setActiveId(s.id)}
                    className={cn(
                      "py-2.5 px-1 rounded-xl text-[11px] sm:text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer",
                      selected
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{s.tab}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="order-3 lg:order-none lg:col-span-6 lg:col-start-1 lg:row-start-2 lg:self-start space-y-4">
            <div className="rounded-3xl p-6 sm:p-8 bg-slate-50 border border-slate-200 space-y-4 shadow-xl">
              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", active.tone)}>
                <ActiveIcon className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{active.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{active.text}</p>
              <ul className="space-y-2 text-sm text-slate-600 pt-3 border-t border-slate-200">
                {active.points.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {onOpenTrial && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenTrial}
                  className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                >
                  <span>Xodimlarni ilovaga bepul ulash</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="order-2 lg:order-none lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:row-span-2 flex flex-col items-center">
            {/* Telefon ramkasi — ekran nisbati skrinshot bilan bir xil (390×844) */}
            <div className="relative w-full max-w-[320px] rounded-[48px] bg-slate-900 p-3 shadow-2xl ring-1 ring-slate-700/60">
              <div
                id="mobile-app-screen"
                role="tabpanel"
                className="relative w-full aspect-[390/844] rounded-[38px] overflow-hidden bg-[#f3f4fa]"
              >
                {SCREENS.map((s, i) => (
                  <Image
                    key={s.id}
                    src={`/app-screens/${s.id}.png`}
                    alt={s.alt}
                    fill
                    sizes="320px"
                    priority={i === 0}
                    className={cn(
                      "object-cover object-top transition-opacity duration-300",
                      s.id === active.id ? "opacity-100" : "opacity-0"
                    )}
                    aria-hidden={s.id !== active.id}
                  />
                ))}
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400">Ilovaning haqiqiy ekranlari · namunaviy ma&apos;lumot</p>
          </div>
        </div>
      </div>
    </section>
  );
}
