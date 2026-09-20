"use client";

import React from "react";
import {
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Network,
} from "lucide-react";

interface IntegrationsSectionProps {
  onOpenTrial?: () => void;
}

const INTEGRATION_ITEMS = [
  {
    name: "1C: Enterprise & 1C: ZUP (ЗУП)",
    category: "Buxgalteriya va Ish haqi",
    badge: "O'zbekiston standarti",
    description:
      "T-13 davomat tabeli standart Я/Н/В/ОТ/Б kodlari bilan bitta tugma orqali Excel (.xlsx) formatida yuklab olinadi — 1C:ZUP'ga qo'lda qayta kiritish shart emas.",
    status: "Tayyor — Excel eksport",
    iconBg: "bg-red-500",
    initials: "1C",
  },
  {
    name: "Mehnat.uz (YAMMT)",
    category: "Davlat kadrlar portali",
    badge: "Milliy qonunchilik",
    description:
      "Yagona Milliy Mehnat Tizimi talablariga mos kadrlar hisobi, shtat jadvali, qonuniy ta'tillar va buyruqlar arxivi tizim bilan hamnafas yuritiladi.",
    status: "Moslashtirilgan",
    iconBg: "bg-blue-600",
    initials: "YAMMT",
  },
  {
    name: "Didox & E-imzo",
    category: "Elektron hujjat aylanishi",
    badge: "Yuridik kuch",
    description:
      "Shartnomalar va hisob-fakturalarni Didox/E-imzo orqali elektron imzolash imkoniyati uchun backend infratuzilmasi tayyorlanmoqda.",
    status: "Ishlab chiqilmoqda",
    iconBg: "bg-indigo-600",
    initials: "EDO",
  },
  {
    name: "Payme, Click, Uzum Business",
    category: "To'lov tizimlari",
    badge: "Avtomatik hisob-faktura",
    description:
      "Yuridik shaxslar uchun bank o'tkazmasi (schet-faktura), yakka tartibdagi tadbirkorlar uchun esa korporativ karta yoki Click/Payme orqali onlayn to'lov — rejalashtirilgan yo'nalish.",
    status: "Rejalashtirilgan",
    iconBg: "bg-teal-500",
    initials: "UZ",
  },
];

export function IntegrationsSection({ onOpenTrial }: IntegrationsSectionProps) {
  return (
    <section id="integrations" className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Network className="w-3.5 h-3.5" />
            <span>Ochiq Ekologik Arxitektura</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            1C va O&apos;zbekiston Biznes Ekotizimi Bilan Integratsiya
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            StaffPlusPRO mavjud buxgalteriya va kadrlar dasturlaringiz o&apos;rnini bosishga majburlamaydi, aksincha ularni davomat ma&apos;lumotlari bilan to&apos;liq boyitadi.
          </p>
        </div>

        {/* 4 Integrations Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {INTEGRATION_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-6 flex flex-col justify-between hover:shadow-lg transition-all hover:border-blue-400 dark:hover:border-blue-700 group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-11 h-11 rounded-2xl ${item.iconBg} text-white font-black text-xs flex items-center justify-center shadow-md`}
                  >
                    {item.initials}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    {item.badge}
                  </span>
                </div>

                <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                  {item.category}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {item.status}
                </span>
                <RefreshCw className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition-transform duration-500" />
              </div>
            </div>
          ))}
        </div>

        {/* 1C T-13 Live Export Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 text-white p-7 sm:p-10 border border-blue-800/50 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Buxgalterlar uchun maxsus yengillik</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              T-13 Davomat Tabeli: 1C formatiga 1 bosishda o&apos;tkazish
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Kasalxona, zavod yoki ofis xodimlarining haqiqiy ishlagan soatlari, kechikishlar, tungi vaqt koeffitsiyentlari va bayram kunlari avtomat hisoblanib, buxgalteriyangizga tayyor fayl sifatida beriladi.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0">
            <button
              onClick={onOpenTrial}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>14 kunlik sinovni boshlash</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
