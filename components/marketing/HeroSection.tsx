"use client";

import { useState } from "react";
import {
  ArrowRight,
  Play,
  CheckCircle2,
  ScanFace,
  Clock,
  Send,
  Users,
  TrendingUp,
  Stethoscope,
  Factory,
  Briefcase,
  Sparkles,
} from "lucide-react";

interface HeroSectionProps {
  onOpenDemo: () => void;
  onOpenTrial: () => void;
  onOpenTutorials?: () => void;
}

export function HeroSection({ onOpenDemo, onOpenTrial, onOpenTutorials }: HeroSectionProps) {
  const [activeOrgType, setActiveOrgType] = useState<"clinic" | "factory" | "office">("clinic");

  const orgConfig = {
    clinic: {
      name: "Toshkent Viloyat Tug'ruqxonasi",
      sub: "MaternityCare Moduli &bull; 24/7 Navbatchilik",
      domain: "tugruqxona.staffpulse.uz",
      badge: "MaternityCare Edition",
      stat: "148 nafar shifokor va hamshira",
      terminalText: "1-2 ta Face ID terminal onlayn",
    },
    factory: {
      name: "Artel Texnopark 2-Sex",
      sub: "Sanoat Moduli &bull; 3 Smenali Ishlab Chiqarish",
      domain: "artel-plant.staffpulse.uz",
      badge: "Industry Edition",
      stat: "1 240 nafar ishchi va usta",
      terminalText: "2 ta Face ID turniket onlayn",
    },
    office: {
      name: "Orient FinTech Group",
      sub: "Korporativ Modul &bull; Har kungi turli grafik",
      domain: "orient.staffpulse.uz",
      badge: "Corporate Edition",
      stat: "85 nafar mutaxassis",
      terminalText: "1 ta Face ID terminal onlayn",
    },
  };

  const currentOrg = orgConfig[activeOrgType];

  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden bg-gradient-to-b from-blue-50/40 via-white to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[950px] h-[450px] bg-gradient-to-tr from-blue-500/15 via-teal-500/10 to-purple-500/10 dark:from-blue-600/10 dark:via-teal-600/5 dark:to-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Trust & White-Label Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200/80 dark:border-blue-800/60 bg-white/85 dark:bg-slate-900/85 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-xs backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>100% White-Label: Har bir korxona o&apos;z logosi va nomida ishlaydi</span>
            <span className="text-slate-300 dark:text-slate-700">&bull;</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              1 yoki 2 ta Face ID yetarli
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Har qanday korxona uchun{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 bg-clip-text text-transparent">
              universal Face ID davomat
            </span>{" "}
            va kadrlar ekotizimi
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Har bir kun uchun har xil vaqtdagi smena yarating. Xodimlar uchun o&apos;z logotipingiz (White-Label), avtomatik T-13 tabel va oylik maosh hisob-kitobi.
            <span className="block mt-2 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 text-blue-800 dark:text-blue-300 text-xs sm:text-sm font-medium">
              💡 <strong>Muhim:</strong> Face ID qurilma asosan 1 ta yoki 2 ta qo&apos;yiladi. <strong>Dasturga to&apos;lov qilinsa — o&apos;rnatib sozlab berishga xizmat haqqi olinmaydi!</strong>
            </span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenTrial}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>14 kunlik sinovni boshlash</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onOpenTutorials ? (
              <button
                type="button"
                onClick={onOpenTutorials}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                <span>Video Qo&apos;llanmani ko&apos;rish</span>
              </button>
            ) : (
              <a
                href="/video-qollanma"
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                <span>Video Qo&apos;llanmani ko&apos;rish</span>
              </a>
            )}

            <button
              onClick={onOpenDemo}
              className="w-full sm:w-auto px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
              <span>Interaktiv demo ko&apos;rish</span>
            </button>
          </div>

          {/* Micro value badges */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400 pt-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Har bir kunga alohida smena vaqti
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              1 yoki 2 ta Face ID terminali
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              O&apos;rnatish va dasturiy sozlash kiritilgan
            </span>
          </div>
        </div>

        {/* Live White-Label Showcase Mockup */}
        <div className="mt-12 sm:mt-16 relative mx-auto max-w-5xl">
          {/* Quick industry switcher for mockup */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
              Interfeysni ko&apos;rish:
            </span>
            <button
              onClick={() => setActiveOrgType("clinic")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeOrgType === "clinic"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Klinika (MaternityCare)</span>
            </button>

            <button
              onClick={() => setActiveOrgType("factory")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeOrgType === "factory"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <Factory className="w-3.5 h-3.5" />
              <span>Ishlab chiqarish &bull; Zavod</span>
            </button>

            <button
              onClick={() => setActiveOrgType("office")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeOrgType === "office"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Ofis &bull; Biznes</span>
            </button>
          </div>

          {/* Glass frame */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-slate-900/95 shadow-2xl shadow-blue-500/10 overflow-hidden">
            {/* Topbar of Mockup */}
            <div className="px-5 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/90 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-400/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 pl-2 border-l border-slate-200 dark:border-slate-800">
                  {currentOrg.domain}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {currentOrg.badge}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {currentOrg.terminalText}
                </span>
              </div>
            </div>

            {/* Mockup Organization Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/60 bg-gradient-to-r from-slate-50/50 to-white dark:from-slate-800/20 dark:to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
                  {currentOrg.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {currentOrg.name}
                    </h3>
                    <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Sizning Logotipingiz
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {currentOrg.sub} &bull; {currentOrg.stat}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Ertalabki hisobot:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Telegram botga jo&apos;natildi (08:30)
                </span>
              </div>
            </div>

            {/* Dashboard Content Inside Mockup */}
            <div className="p-4 sm:p-6 space-y-5">
              {/* Header metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Ro&apos;yxatda:</span>
                    <Users className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">100%</div>
                  <span className="text-[10px] text-emerald-600 font-medium">Barcha xodimlar bazada</span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40">
                  <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
                    <span>Vaqtida kelgan:</span>
                    <Clock className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">97.4%</div>
                  <span className="text-[10px] text-emerald-600 font-medium">Yuqori intizom</span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/40">
                  <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
                    <span>Kechikkanlar:</span>
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">2 nafar</div>
                  <span className="text-[10px] text-amber-600 font-medium">Daqiqasigacha hisoblangan</span>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800/40">
                  <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-400">
                    <span>T-13 Tabel:</span>
                    <Send className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="mt-1 text-xl font-bold text-blue-600 dark:text-blue-400">Avtomatik</div>
                  <span className="text-[10px] text-blue-600 font-medium">1C / Excel tayyor</span>
                </div>
              </div>

              {/* Bottom split: Recent check-ins & Telegram notification mockup */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Live stream check-ins */}
                <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <ScanFace className="w-4 h-4 text-blue-600" />
                      Face ID terminallaridan jonli kelish oqimi
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Jonli sinxron</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {[
                      { name: "Rahmonov Sardor", role: "Mutaxassis", time: "07:54:12", status: "O'z vaqtida", terminal: "1-kirish Face ID", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40" },
                      { name: "Karimova Nilufar", role: "Bo'lim xodimi", time: "07:58:30", status: "O'z vaqtida", terminal: "2-kirish Face ID", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40" },
                      { name: "Toshmatov Bobur", role: "Smena xodimi", time: "08:08:45", status: "Kechikdi (8 daq)", terminal: "Turniket Face ID", color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40" },
                    ].map((row, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[11px] text-slate-600 dark:text-slate-300">
                            {row.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {row.name}
                            </span>
                            <span className="text-[10px] text-slate-500">{row.role} &bull; {row.terminal}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block text-xs">
                            {row.time}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.color}`}>
                            {row.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Telegram Bot Notification Mockup */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/70 dark:bg-slate-800/30 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px]">
                        <Send className="w-3 h-3" />
                      </div>
                      <span>Rahbar Telegram Boti</span>
                    </div>

                    <div className="mt-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1.5 shadow-xs">
                      <p className="font-bold text-sky-600 dark:text-sky-400">
                        {currentOrg.name} Davomat Boti
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 leading-snug">
                        🔔 <strong>Ertalabki xabarnoma (08:30)</strong>
                        <br />
                        Kechikkanlar soni: <strong>1 nafar</strong>
                        <br />
                        Kechikish: Toshmatov B. (8 daqiqa).
                      </p>
                      <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                        Oylik tabelga avtomatik kiritildi.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>StaffPulse Core</span>
                    <span className="text-emerald-600 font-semibold">24/7 Avtomat</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
