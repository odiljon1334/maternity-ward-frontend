"use client";

import { useState } from "react";
import {
  ScanFace,
  Smartphone,
  Send,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Wrench,
  Gift,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InteractiveTelegramBot } from "./InteractiveTelegramBot";

interface DirectorTelegramShowcaseProps {
  onOpenTrial?: () => void;
}

export function DirectorTelegramShowcase({ onOpenTrial }: DirectorTelegramShowcaseProps) {
  const [activeMode, setActiveMode] = useState<"terminal" | "mobile">("terminal");
  const [testScenario, setTestScenario] = useState<"ontime" | "late">("late");

  return (
    <section id="director-feature" className="py-20 sm:py-28 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-500/5 dark:bg-blue-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-300/40">
            <Send className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Director Uchun Real-Vaqtda Telegram &amp; Face Recognition</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Xodim kelishi bilan <span className="text-blue-600 dark:text-blue-400">real yuz surati</span> va vaqti direktorda!
          </h2>

          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
            Hikvision Face Recognition terminalidan o&apos;tganda yoki mobil ilovada tasdiqlaganda — <strong>haqiqiy kamera snapshoti</strong>, aniq vaqt, kechikish holati va GPS lokatsiyasi zudlik bilan Telegram botga keladi.
          </p>
        </div>

        {/* 3 Core Rules / Policies Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-12">
          {/* Rule 1: FaceID Majburiy emas */}
          <div className="rounded-2xl p-5 sm:p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 uppercase tracking-wider whitespace-nowrap shrink-0">
                  Ixtiyoriy
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                FaceID Qurilma Majburiy Emas
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
                Dastlab apparat sotib olishingiz shart emas. Xodimlar smartfon ilovasi orqali <strong>GPS geolokatsiya + yuz tasdiqlash</strong> bilan 0 xarajat bilan foydalanaveradi.
              </p>
            </div>
          </div>

          {/* Rule 2: Ko'p xodimlik kompaniyalar uchun apparat qoidasi */}
          <div className="rounded-2xl p-5 sm:p-6 bg-blue-50/50 dark:bg-blue-950/30 border-2 border-blue-500/40 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                  <Wrench className="w-5 h-5" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-600 text-white uppercase tracking-wider whitespace-nowrap shrink-0 shadow-xs">
                  Obunada 0 So&apos;m
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                O&apos;rnatish Xizmati Tekin (0 So&apos;m)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
                Ko&apos;p xodimli korxonalarda terminal qo&apos;yib berish so&apos;ralsa: faqat apparat va kabel to&apos;lanadi. Joyiga borib <strong>o&apos;rnatish, montaj va dasturga sozlash xizmati obuna paketiga kiritilgan!</strong>
              </p>
            </div>
          </div>

          {/* Rule 3: 1000+ Xodim Bepul Terminallar */}
          <div className="rounded-2xl p-5 sm:p-6 bg-emerald-50/50 dark:bg-emerald-950/30 border-2 border-emerald-500/40 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Gift className="w-5 h-5" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-600 text-white uppercase tracking-wider whitespace-nowrap shrink-0 shadow-xs">
                  Paketda Sovg&apos;a
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                1000+ Xodim: Uskunalar Bepul
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
                Katta korxonalar va zavodlar uchun barcha Face ID terminallari, kabellar, montaj va dasturiy ulanish to&apos;liq <strong>bizning hisobimizdan sovg&apos;a tariqasida</strong> taqdim etiladi!
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Simulation Container */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white shadow-2xl overflow-hidden">
          {/* Top Control Bar */}
          <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-950/60">
            {/* Mode Switcher */}
            <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60">
              <button
                type="button"
                onClick={() => setActiveMode("terminal")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                  activeMode === "terminal"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                )}
              >
                <ScanFace className="w-4 h-4" />
                <span>1. Hikvision Face Recognition Terminal</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode("mobile")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                  activeMode === "mobile"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                )}
              >
                <Smartphone className="w-4 h-4" />
                <span>2. Mobile (Smartfon) orqali tasdiqlash</span>
              </button>
            </div>

            {/* Scenario toggle (Vaqtida vs Kech) */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Xodim holati namunasi:</span>
              <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
                <button
                  type="button"
                  onClick={() => setTestScenario("ontime")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5",
                    testScenario === "ontime"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Vaqtida keldi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTestScenario("late")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5",
                    testScenario === "late"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Kech keldi (Kechikish)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Display Body */}
          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left side: Source Hardware or Mobile Capture (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  {activeMode === "terminal" ? "Terminal yuzni aniqlash jarayoni" : "Mobil ilovada yuz va GPS tekshiruvi"}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Protokol: Hikvision ISUP 5.0 / WebSocket Real-time
                </span>
              </div>

              {/* Hardware / Mobile Simulator Card */}
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400">
                      {activeMode === "terminal" ? <Cpu className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {activeMode === "terminal" ? "Hikvision DS-K1T671MF (Turniket #1)" : "StaffPulse Mobile Client (iOS / Android)"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {activeMode === "terminal" ? "IP: 192.168.1.120 • Holat: ONLAYN 🟢" : "GPS: Toshkent, Chilonzor 9 • Aniqlik: ±3m"}
                      </p>
                    </div>
                  </div>

                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5",
                    testScenario === "ontime"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  )}>
                    {testScenario === "ontime" ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Vaqtida keldi</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Kech keldi (18 daqiqa)</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Face Snapshot Preview with Terminal HUD Graphics */}
                <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700/60 p-4 flex flex-col sm:flex-row items-center gap-5">
                  {/* Snapshot Frame */}
                  <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-xl bg-slate-800 border-2 border-dashed border-blue-500/60 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {/* Simulated Employee Real Face Snapshot */}
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex flex-col items-center justify-center relative p-3">
                      {/* Face recognition frame overlay */}
                      <div className="absolute inset-2 border-2 border-blue-400/80 rounded-lg pointer-events-none flex flex-col justify-between p-1">
                        <div className="flex justify-between text-[9px] font-mono text-blue-300">
                          <span>REC 99.4%</span>
                          <span>{testScenario === "ontime" ? "08:52:14" : "09:18:22"}</span>
                        </div>
                        <div className="text-[9px] font-mono text-emerald-400 text-center bg-black/60 py-0.5 rounded">
                          FACE_ID_MATCH
                        </div>
                      </div>

                      <div className="w-16 h-16 rounded-full bg-slate-600 border-2 border-white/20 flex items-center justify-center text-xl font-bold text-white shadow-md">
                        JD
                      </div>
                      <span className="text-[11px] font-bold text-white mt-2">Javohir D.</span>
                      <span className="text-[9px] text-slate-300">Bosh Mutaxassis</span>
                    </div>

                    {/* Corner Reticle Markers */}
                    <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-emerald-400" />
                    <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-emerald-400" />
                    <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-emerald-400" />
                    <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-emerald-400" />
                  </div>

                  {/* Recognition Telemetry */}
                  <div className="space-y-2.5 text-xs flex-1 w-full">
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Xodim F.I.SH:</span>
                      <span className="font-bold text-white">Dilshodov Javohir Elyor o&apos;g&apos;li</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Lavozimi / Bo&apos;lim:</span>
                      <span className="text-slate-200">Moliya bo&apos;limi • Bosh mutaxassis</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Grafik bo&apos;yicha vaqt:</span>
                      <span className="font-mono text-slate-300">09:00:00</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Terminal qayd etgan vaqt:</span>
                      <span className={cn("font-mono font-bold", testScenario === "ontime" ? "text-emerald-400" : "text-rose-400")}>
                        {testScenario === "ontime" ? "08:52:14 (8 daqiqa erta)" : "09:18:22 (18 daqiqa kechikish)"}
                      </span>
                    </div>
                    {activeMode === "mobile" && (
                      <div className="flex justify-between border-b border-slate-800 pb-1.5 text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                          Geolokatsiya:
                        </span>
                        <span className="text-indigo-300 font-mono">41.2858° N, 69.2035° E (Ofis hududi)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Yuz tasdiqlanishi bilan Telegram xabar 0.4 soniya ichida direktor telefoniga jo&apos;natiladi.</span>
                </div>
              </div>
            </div>

            {/* Right side: Telegram Bot Message Simulator for Director (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-sm rounded-3xl bg-slate-950 border-2 border-slate-800 p-4 shadow-2xl relative">
                {/* Telegram Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>StaffPulse Director Bot</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    </h4>
                    <p className="text-[10px] text-slate-400">bot • Direktor shaxsiy xabarnomasi</p>
                  </div>
                </div>

                {/* Telegram Message Bubble */}
                <div className="mt-3.5 rounded-2xl bg-slate-900 border border-slate-800 p-3.5 space-y-2.5 text-xs text-slate-200">
                  {/* Photo Header Attachment inside Telegram */}
                  <div className="relative rounded-xl overflow-hidden bg-slate-800 border border-slate-700 aspect-video flex items-center justify-center">
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center p-3 relative">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-lg">
                          JD
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">Dilshodov Javohir</p>
                          <p className="text-[10px] text-slate-400">
                            {activeMode === "terminal" ? "Hikvision Face Terminal #1" : "Smartfon Selfie + GPS"}
                          </p>
                          <span className={cn(
                            "inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-bold",
                            testScenario === "ontime" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                          )}>
                            {testScenario === "ontime" ? "🟢 Vaqtida keldi" : "🔴 Kech keldi (18 daqiqa)"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Telegram Message Caption */}
                  <div className="space-y-1.5 text-[11px] leading-relaxed">
                    <p className="font-bold text-sky-400">
                      🔔 XODIM KELISHI QAYD ETILDI
                    </p>
                    <p>
                      <strong>Xodim:</strong> Dilshodov Javohir Elyor o&apos;g&apos;li
                    </p>
                    <p>
                      <strong>Bo&apos;lim:</strong> Moliya va Iqtisodiyot
                    </p>
                    <p>
                      <strong>Qurilma / Manba:</strong>{" "}
                      {activeMode === "terminal" ? "Hikvision Face Terminal (Kirish turniketi)" : "Mobile App (Geolokatsiya tasdiqlangan)"}
                    </p>
                    <p>
                      <strong>Vaqt:</strong>{" "}
                      <span className="font-mono font-bold text-white">
                        {testScenario === "ontime" ? "08:52:14" : "09:18:22"}
                      </span>
                    </p>
                    <p>
                      <strong>Holati:</strong>{" "}
                      {testScenario === "ontime" ? (
                        <span className="text-emerald-400 font-bold">✅ O&apos;z vaqtida keldi</span>
                      ) : (
                        <span className="text-rose-400 font-bold">⚠️ Kech keldi (18 daqiqa kechikish)</span>
                      )}
                    </p>
                    {activeMode === "mobile" && (
                      <p className="text-indigo-300">
                        <strong>📍 Manzil:</strong> Chilonzor 9, Bosh ofis binosi (Radius ichida)
                      </p>
                    )}
                  </div>

                  {/* Interactive Telegram Inline Buttons */}
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <button
                      type="button"
                      className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <span>👤 Xodim tabelini ko&apos;rish</span>
                    </button>
                    {activeMode === "mobile" && (
                      <button
                        type="button"
                        className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Xaritadagi lokatsiyani ochish</span>
                      </button>
                    )}
                  </div>

                  <div className="text-right text-[9px] text-slate-500 font-mono">
                    {testScenario === "ontime" ? "08:52" : "09:18"} &bull; Yetkazildi
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="p-6 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              <span className="text-white font-bold">Xulosa:</span> FaceID terminal qo&apos;yish majburiy emas. Terminal so&apos;ralsa — apparat va kabel uchun to&apos;lov qilinadi, o&apos;rnatish va sozlash xizmati obuna paketiga kiritilgan!
            </div>
            {onOpenTrial && (
              <button
                type="button"
                onClick={onOpenTrial}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
              >
                <span>Sinovdan o&apos;tish (14 kunlik sinov)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Live Interactive Telegram Bot Sandbox */}
        <div className="mt-14 max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Bot className="w-4 h-4" />
              <span>Jonli Telegram Bot Simulyatori</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Bot bilan real vaqtda suhbatlashib ko&apos;ring
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Quyidagi bot interfeysidagi tugmalarni bosing va korxonangiz davomat hisobotlari qanday kelishini sinab ko&apos;ring:
            </p>
          </div>

          <InteractiveTelegramBot onOpenTrial={onOpenTrial} />
        </div>
      </div>
    </section>
  );
}
