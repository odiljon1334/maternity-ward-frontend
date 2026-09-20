"use client";

import React, { useState } from "react";
import {
  Stethoscope,
  Factory,
  Building,
  UtensilsCrossed,
  CheckCircle2,
  ScanFace,
  CalendarCheck,
  ArrowRight,
} from "lucide-react";

interface IndustrySolutionsSectionProps {
  onOpenTrial?: () => void;
}

const INDUSTRIES = [
  {
    id: "clinic",
    name: "Klinika & Tug'ruqxonalar",
    icon: <Stethoscope className="w-4 h-4" />,
    tag: "Tibbiyot va 24/7 navbatchilik",
    headline: "24/7 Shifokor va Hamshiralar Smenalari Nazorati",
    description:
      "Tibbiy muassasalarda navbatchilikni boshqarish murakkab: kunduzgi, tungi va 24 soatlik smenalar. StaffPulse avtomatlashtirilgan rotatsiya va shifoxona bo'limlari (Reanimatsiya, Terapiya, Tug'ruqxona) bo'yicha mustaqil nazoratni ta'minlaydi.",
    painPoint: "Qo'lda tabel yurgizishda navbatchilik almashishlari yo'qolib qolishi",
    solution: "1 tugma bilan bir oylik 24/7 grafik va T-13 tabelni avto-generatsiya qilish",
    features: [
      "Kunlik, tungi va 24/7 smenalarni avtomatik rejalashtirish",
      "Kasalxona bo'limlari (Reanimatsiya, Tug'ruqxona) bo'yicha guruhlash",
      "Tibbiy navbatchilik almashinuvi (Shift Swap) tizimi",
      "Bosh shifokor va bo'lim mudirlari uchun ertalabki xabarnomalar",
    ],
    stats: { primary: "100%", label: "Smena xatoliklarining yo'qolishi" },
    accent: "text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
  },
  {
    id: "factory",
    name: "Zavod & Ishlab chiqarish",
    icon: <Factory className="w-4 h-4" />,
    tag: "Ommaviy oqim va Turniketlar",
    headline: "Minglab Ishchilarning Turniket Oqimi va 3 Smenali Grafik",
    description:
      "Sanoat korxonalari va fabrikalarda ertalabki 15 daqiqada 500-1000 nafar ishchi kirib keladi. Bizning Face ID terminallarimiz 0.3 soniyada yuzni tanib, turniket tirbandliklarini butunlay bartaraf etadi.",
    painPoint: "Ertalabki tirbandlik, birovning o'rniga kartochka urib ketish (buddy punching)",
    solution: "Face ID biometriya + turniket rele integratsiyasi orqali 100% haqiqiy davomat",
    features: [
      "0.3 soniyada 99.9% aniqlikda yuz tanish (Turniket blokirovkasi)",
      "3 smenali (I smena, II smena, Tungi smena) qat'iy nazorat",
      "Katta korxonalarga (1000+ ishchi) uskunalar va montaj bepul",
      "T-13 tabelini to'g'ridan-to'g'ri 1C:ZUP (ЗУП) ga eksport qilish",
    ],
    stats: { primary: "0.3s", label: "Har bir ishchini tanish tezligi" },
    accent: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
  },
  {
    id: "office",
    name: "Ofis & IT Kompaniyalar",
    icon: <Building className="w-4 h-4" />,
    tag: "Moslashuvchan & Gibrid ish",
    headline: "Moslashuvchan Grafikli Ofislar va Masofaviy Jamoalar",
    description:
      "Zamonaviy IT jamoalar va xizmat ko'rsatish ofislarida qat'iy 9:00 dan 18:00 gacha emas, balki haftalik 40 soatlik moslashuvchan (flexible) grafiklar va gibrid ish tartibi zarur. StaffPulse har bir soatni aniq hisoblaydi.",
    painPoint: "Dasturchi va ofis xodimlarining aniq ishlagan soatlarini hisoblay olmaslik",
    solution: "Smartfon GPS check-in + ofis Wi-Fi / IP geofencing orqali qulay belgilanish",
    features: [
      "Ofis Wi-Fi va GPS geolokatsiya orqali smartfondan check-in",
      "Flexible (moslashuvchan) ish soatlarini jamlash",
      "Ta'til, kasallik varaqasi va ruxsat so'rovlarini 1 bosishda tasdiqlash",
      "Telegram bot orqali shaxsiy grafigini ko'rib borish",
    ],
    stats: { primary: "98%", label: "Xodimlarning tizimdan mamnunligi" },
    accent: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800",
  },
  {
    id: "retail",
    name: "Restoran & Retail Filiallar",
    icon: <UtensilsCrossed className="w-4 h-4" />,
    tag: "Ko'p filialli tarmoqlar",
    headline: "Bir Nechta Filiallar, Kafe va Do'konlar Ekotizimi",
    description:
      "Tarmoqli korxonalarda (supermarketlar, fast-fud, kiyim do'konlari) xodimlar doim filiallar o'rtasida almashib turadi. StaffPulse barcha nuqtalarni yagona bulutli ekranga birlashtiradi.",
    painPoint: "Bosh ofisdan turib har bir filaldagi oshpaz, sotuvchi va kuryerni nazorat qila olmaslik",
    solution: "Yagona platformada barcha filiallar jonli videokuzatuv va davomat oqimi",
    features: [
      "Cheksiz filiallar va savdo nuqtalarini bitta akkauntga ulash",
      "Soatbay va smenabay ish haqini (Hourly payroll) avtomatik hisoblash",
      "Har bir do'konga alohida planshet/mobil check-in kioski",
      "Direktor uchun filiallar bo'yicha solishtirma reyting hisoboti",
    ],
    stats: { primary: "10+", label: "Filiallarni yagona ekrandan boshqarish" },
    accent: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
  },
];

export function IndustrySolutionsSection({
  onOpenTrial,
}: IndustrySolutionsSectionProps) {
  const [activeTab, setActiveTab] = useState<string>("clinic");

  const current = INDUSTRIES.find((i) => i.id === activeTab) || INDUSTRIES[0];

  return (
    <section id="industries" className="py-20 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Building className="w-3.5 h-3.5" />
            <span>Sohaviy Yechimlar</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Har qanday soha va korxona hajmiga moslashtirilgan
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Shifoxonadan tortib yirik ishlab chiqarish zavodlarigacha — o&apos;z sohangizdagi davomat muammolarining tayyor yechimini ko&apos;ring.
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex items-center justify-start sm:justify-center gap-2.5 overflow-x-auto pb-4 mb-10 no-scrollbar">
          {INDUSTRIES.map((ind) => {
            const isActive = ind.id === activeTab;
            return (
              <button
                key={ind.id}
                onClick={() => setActiveTab(ind.id)}
                className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 scale-[1.02]"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                }`}
              >
                {ind.icon}
                <span>{ind.name}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl transition-all">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {current.tag}
                </span>
                <h3 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {current.headline}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                  {current.description}
                </p>
              </div>

              {/* Problem vs Solution comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="p-4 rounded-2xl bg-red-50/70 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40">
                  <div className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">
                    Avvalgi muammo:
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    {current.painPoint}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40">
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                    StaffPulse yechimi:
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {current.solution}
                  </div>
                </div>
              </div>

              {/* Bullet Features */}
              <div className="space-y-2.5 pt-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Ushbu soha uchun asosiy imkoniyatlar:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {current.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA button */}
              <div className="pt-2">
                <button
                  onClick={onOpenTrial}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 inline-flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>{current.name} uchun sinovdan o&apos;tish</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Card / Visual representation (5 cols) */}
            <div className="lg:col-span-5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                    {current.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {current.name}
                    </div>
                    <div className="text-[11px] text-slate-500">Tayyor shablon &amp; grafiklar</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Faol
                </span>
              </div>

              {/* Big Stat Box */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1 shadow-xs">
                <div className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400">
                  {current.stats.primary}
                </div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {current.stats.label}
                </div>
              </div>

              {/* Mini mock indicators */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <ScanFace className="w-4 h-4 text-blue-500" />
                    Biometriya / Mobil GPS
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Uланган</span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <CalendarCheck className="w-4 h-4 text-indigo-500" />
                    Oylik T-13 Tabel Formati
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">Avtomatik</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
