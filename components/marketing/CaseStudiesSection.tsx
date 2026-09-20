"use client";

import React, { useState } from "react";
import {
  TrendingDown,
  Clock,
  ArrowRight,
  CheckCircle2,
  Quote,
  Briefcase,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CaseStudiesSectionProps {
  onOpenTrial: () => void;
  onOpenKioskDemo?: () => void;
}

const CASE_STUDIES = [
  {
    id: "maternity",
    company: "Shahar Tug'ruq Majmuasi & Perinatal Markaz",
    category: "Tug'ruqxona & Ayollar Salomatligi",
    icon: "👶",
    accentColor: "from-rose-500 to-pink-600",
    badgeBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    stats: {
      employees: "380+ tibbiyot xodimi",
      branches: "Tug'ruq & Chaqaloqlar bo'limi",
      lossBefore: "42 mln so'm / oy",
      savingsNow: "36.8 mln so'm / oy",
      timeSaved: "Navbatchilik va smena almashish nazorati 100%",
    },
    problem:
      "Tug'ruqxonalarda 24/7 kechayu-kunduz smena va navbatchiliklar o'ta mas'uliyatli: akusher-ginekolog, neonatolog va reanimatsiya hamshiralari navbatchilikni o'z vaqtida topshirishi, tungi smenada kim amalda borligini shifoxona bosh vrachi va bosh hamshirasi zudlik bilan bilishi zarur edi.",
    solution:
      "Qabulxona va sanitariya o'tkazgich punktlariga Face ID planshet terminallari o'rnatildi. Shifokor va doyalarning tungi navbatchilikka kirish va chiqish vaqtlari avtomatlashdi. Kechikish yoki kelmaslik yuz berganda bosh vrachning Telegramiga 1 daqiqada signal boradi.",
    quote:
      "Tug'ruqxonada har bir daqiqa inson hayoti uchun qimmatli. StaffPulse orqali barcha bo'limlardagi navbatchiliklar va smena intizomi 100% shaffof bo'ldi. Oylik tabelni yopish esa 3 kundan 5 daqiqaga qisqardi.",
    author: "Gulchehra Olimova",
    authorRole: "Bosh Shifokor & Tibbiyot Fanlari Nomzodi",
    roi: "19x",
  },
  {
    id: "polyclinic",
    company: "Markaziy Ko'p Tarmoqli Poliklinika (KTMP)",
    category: "Davlat & Aholi Poliklinikasi",
    icon: "🏥",
    accentColor: "from-blue-600 to-cyan-600",
    badgeBg: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    stats: {
      employees: "210 nafar vrach va hamshira",
      branches: "4 ta filial & QVP punktlari",
      lossBefore: "28 mln so'm / oy",
      savingsNow: "24.5 mln so'm / oy",
      timeSaved: "Ertalabki 08:00 qabul intizomi 98% ga yetdi",
    },
    problem:
      "Aholi poliklinikaga ertalab 08:00 da navbat kutib kelardi, ammo ayrim tor doiradagi shifokorlar (UZI, kardiolog, lor) 08:45 da kelib aholi noroziligi va tiqilinch yuzaga kelardi. Qog'oz tabelda esa hamma 08:00 deb qayd etilardi.",
    solution:
      "Markaziy kirish eshigiga Face ID Kiosk terminali qo'yildi va tibbiy registratura bilan integratsiya qilindi. Barcha bo'lim mudirlari 08:15 da qaysi xonada shifokor qabulni boshlagani haqida planshetida ko'rib turadi.",
    quote:
      "Aholining shikoyatlari 90% ga kamaydi. Vrachlar o'z vaqtida qabulni boshlayapti. Eng muhimi, Exceldagi 200 kishilik ro'yxatni AI Agent orqali 1 daqiqada yuklab olganimiz bizni haftalab vaqt sarflashdan qutqardi.",
    author: "Dr. Jasur Alimov",
    authorRole: "Poliklinika Bosh Shifokori",
    roi: "16x",
  },
  {
    id: "surgery_clinic",
    company: "Ko'p Tarmoqli Jarrohlik & Diagnostika Klinikasi",
    category: "Xususiy Shifoxona & Statsionar",
    icon: "🩺",
    accentColor: "from-emerald-600 to-teal-700",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    stats: {
      employees: "290+ mutaxassis",
      branches: "Jarrohlik, Statsionar & Laboratoriya",
      lossBefore: "54 mln so'm / oy",
      savingsNow: "48 mln so'm / oy",
      timeSaved: "1C:ZUP va Mehnat.uz ga avtomat tabel integratsiyasi",
    },
    problem:
      "Operatsiya bloklari, jonlantirish (reanimatsiya) va laboratoriya xodimlarining soatbay stavkalari, tungi koeffitsientlar va bayram kunlari qo'shimcha to'lovlari hisobi juda murakkab bo'lib, oylik hisoblashda doimiy xatoliklar yuz berardi.",
    solution:
      "Tibbiy bo'limlar bo'yicha maxsus smena grafiklari joriy etildi. Face ID va planshet orqali ishlangan har bir soat daqiqasigacha hisoblanib, 1C:ZUP tizimiga avtomatik T-13 tabeli shaklida eksport qilina boshladi.",
    quote:
      "Bosh buxgalter sifatida menga xodimlarning aniq soatlari kerak edi. Hozir 1C dagi tugmani bosamiz — 290 ta tibbiyot xodimining oyligi, tungi smena va bayram pullari 10 soniyada xatosiz tayyor.",
    author: "Nigora Karimova",
    authorRole: "Klinika Bosh Buxgalteri",
    roi: "21x",
  },
];

export function CaseStudiesSection({ onOpenTrial }: CaseStudiesSectionProps) {
  const [activeTab, setActiveTab] = useState(CASE_STUDIES[0].id);
  const currentCase = CASE_STUDIES.find((c) => c.id === activeTab) || CASE_STUDIES[0];

  return (
    <section id="cases" className="py-20 bg-slate-50/60 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-black uppercase tracking-wider mb-4 border border-blue-200 dark:border-blue-800">
            <Briefcase className="w-3.5 h-3.5" />
            O&apos;zbekistonda Muvaffaqiyatli Keyslar
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Bizneslar StaffPulse bilan qanday qilib{" "}
            <span className="text-blue-600 dark:text-blue-400">millionlab so&apos;m tejamoqda?</span>
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Quruq va&apos;dalar emas — Toshkent va viloyatlardagi Tug&apos;ruqxonalar, Ko&apos;p tarmoqli Poliklinikalar va yetakchi Tibbiyot Markazlarining
            haqiqiy audit va samaradorlik natijalari.
          </p>
        </div>

        {/* Company Switcher Tabs */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-10">
          {CASE_STUDIES.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all border shadow-sm cursor-pointer",
                activeTab === item.id
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-blue-500 shadow-md ring-2 ring-blue-500/20"
                  : "bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-transparent hover:bg-white dark:hover:bg-slate-800"
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <div className="text-left">
                <div className="font-extrabold leading-none">{item.company}</div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {item.category}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Active Case Study Detail Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-10 overflow-hidden relative">
          
          {/* Subtle decorative background gradient */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-gradient-to-bl from-blue-500/10 to-indigo-500/0 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: Problem, Solution & Narrative (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="flex items-center gap-3">
                <span className="text-3xl">{currentCase.icon}</span>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {currentCase.company}
                  </h3>
                  <span className={cn("inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border mt-1", currentCase.badgeBg)}>
                    {currentCase.category}
                  </span>
                </div>
              </div>

              {/* Problem Block */}
              <div className="p-4 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
                <div className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  StaffPulse&apos;gacha bo&apos;lgan muammo:
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {currentCase.problem}
                </p>
              </div>

              {/* Solution Block */}
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50">
                <div className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  StaffPulse orqali yechim:
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {currentCase.solution}
                </p>
              </div>

              {/* Director / HR Quote */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 relative">
                <Quote className="w-8 h-8 text-slate-300 dark:text-slate-600 absolute top-4 right-4" />
                <p className="text-sm italic font-medium text-slate-800 dark:text-slate-200 relative z-10 leading-relaxed">
                  &ldquo;{currentCase.quote}&rdquo;
                </p>
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {currentCase.author}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {currentCase.authorRole}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Right: Key Hard Metric Badges & ROI Card (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              
              <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  Haqiqiy Tejamkorlik Ko&apos;rsatkichi
                </div>

                <div className="text-3xl sm:text-4xl font-black text-white mt-2">
                  +{currentCase.stats.savingsNow}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Ilgari har oy yo&apos;qotilayotgan:{" "}
                  <span className="text-red-400 line-through font-bold">
                    {currentCase.stats.lossBefore}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 pt-4 border-t border-slate-800">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                    <div className="text-[11px] text-slate-400">Qamrov:</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {currentCase.stats.employees}
                    </div>
                    <div className="text-[10px] text-slate-400">{currentCase.stats.branches}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                    <div className="text-[11px] text-slate-400">Investitsiya qaytishi:</div>
                    <div className="text-xl font-black text-emerald-400 mt-0.5">
                      {currentCase.roi} ROI
                    </div>
                    <div className="text-[10px] text-slate-400">1 oylik obuna evaziga</div>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-blue-950/60 border border-blue-800/60 text-xs text-blue-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>{currentCase.stats.timeSaved}</span>
                </div>

                <button
                  onClick={onOpenTrial}
                  className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-extrabold text-sm text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Siz ham shu natijaga erishing</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
