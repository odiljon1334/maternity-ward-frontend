"use client";

import { useState } from "react";
import {
  MapPin,
  CheckCircle2,
  ShieldCheck,
  EyeOff,
  Navigation,
  Battery,
  Clock,
  Radio,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function LiveMapShowcase({ onOpenTrial }: { onOpenTrial?: () => void }) {
  const [simulatedState, setSimulatedState] = useState<"checked_in" | "checked_out">("checked_in");

  return (
    <section id="live-map" className="py-20 lg:py-28 bg-slate-900 text-white relative overflow-hidden border-t border-slate-800">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>100% Shaxsiy Maxfiylik &amp; Smart Geofencing</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Mobil Check-in qilsa <span className="text-emerald-400">Live Xarita</span> ishga tushadi. <br className="hidden sm:inline" />
            Check-out qilsa — <span className="text-slate-400">kuzatuv butunlay uziladi</span>.
          </h2>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            Biz xodimlarning shaxsiy hayotini hurmat qilamiz: GPS monitoring faqatgina xodim ish joyiga kelib rasman <b>Check-in</b> qilgan paytdagina faollashadi. Ish tugab <b>Check-out</b> bosilishi bilan aloqa 100% to&apos;xtatiladi.
          </p>
        </div>

        {/* Interactive Simulator Card */}
        <div className="rounded-3xl bg-slate-800/80 border border-slate-700/80 shadow-2xl p-6 sm:p-8 lg:p-10 space-y-8 backdrop-blur-xl">
          {/* Simulator Toggle Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-2xl bg-slate-900/90 border border-slate-700">
            <div className="flex items-center gap-3 text-xs sm:text-sm">
              <span className="font-bold text-slate-300">Xodim holatini sinab ko&apos;ring:</span>
            </div>

            <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSimulatedState("checked_in")}
                className={cn(
                  "flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer",
                  simulatedState === "checked_in"
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>1. Check-in (Ishda — Xarita Online)</span>
              </button>

              <button
                type="button"
                onClick={() => setSimulatedState("checked_out")}
                className={cn(
                  "flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer",
                  simulatedState === "checked_out"
                    ? "bg-slate-700 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <EyeOff className="w-4 h-4" />
                <span>2. Check-out (Kuzatuv Uzildi)</span>
              </button>
            </div>
          </div>

          {/* Grid Layout: Visual Map View + Info Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Map Visual Simulator */}
            <div className="lg:col-span-7 relative h-[380px] sm:h-[440px] rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner flex flex-col justify-between p-6">
              {/* Fake Map Grid Background */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#10b981 1px, transparent 1px)`,
                  backgroundSize: "24px 24px",
                  backgroundPosition: "0 0, 12px 12px",
                }}
              />

              {/* Map overlay header */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-bold">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Andijon shahar 1-son Tug&apos;ruqxona (Geofence Radiusi: 200m)</span>
                </div>

                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5",
                    simulatedState === "checked_in"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  )}
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      simulatedState === "checked_in" ? "bg-emerald-400 animate-ping" : "bg-slate-500"
                    )}
                  />
                  {simulatedState === "checked_in" ? "JONLI HARAKATDA" : "ALOQA UZILGAN"}
                </span>
              </div>

              {/* Map Center Display */}
              <div className="relative z-10 flex items-center justify-center">
                {simulatedState === "checked_in" ? (
                  <div className="relative flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
                    {/* Pulsing Radar Ring */}
                    <div className="absolute w-36 h-36 rounded-full bg-emerald-500/20 animate-ping pointer-events-none" />
                    <div className="absolute w-24 h-24 rounded-full bg-emerald-500/30 pointer-events-none" />

                    {/* Marker Pin */}
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-1 shadow-2xl flex items-center justify-center text-white border-2 border-white">
                      <div className="font-black text-sm">DK</div>
                    </div>

                    {/* Popup Card */}
                    <div className="mt-3 px-4 py-2 rounded-2xl bg-slate-900/95 border border-emerald-500/40 text-center shadow-xl space-y-0.5">
                      <p className="text-xs font-bold text-white">Dr. Nilufar Karimova</p>
                      <p className="text-[11px] text-emerald-400 font-semibold">1-son Tug&apos;ruq bo&apos;limi • 45 metr masofada</p>
                      <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Battery className="w-3 h-3 text-emerald-400" /> 88%
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Hozirgina yangilandi
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-slate-900/90 border border-slate-700 max-w-sm animate-in fade-in zoom-in-95 duration-300 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center">
                      <EyeOff className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-bold text-white">Kuzatuv To&apos;xtatildi</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Xodim ish kunini yakunlab <b>Check-out</b> qildi. GPS ma&apos;lumotlar uzatish to&apos;liq o&apos;chirildi va serverga koordinata jo&apos;natilmaydi.
                    </p>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      🔒 Maxfiylik 100% kafolatlangan
                    </span>
                  </div>
                )}
              </div>

              {/* Map Footer status */}
              <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <span>Shifoxona radiusi: 200 metr</span>
                <span>Haqiqiy koordinata aniqligi: ~8 metr</span>
              </div>
            </div>

            {/* Right Information & Benefits */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Nega bu korxona va xodim uchun birdek qulay?
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Tibbiyot birlashmalari, shoshilinch tez tibbiy yordam va ko&apos;p tarmoqli klinikalarda kim hozir bino ichida ekanligini real vaqtda bilish hayotiy ahamiyatga ega.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/60 flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <h4 className="font-bold text-white text-sm">Ishdan tashqarida kuzatuv yo&apos;q</h4>
                    <p className="text-slate-400 leading-relaxed">
                      Xodim uyiga ketganda yoki dam olish kunlarida ilova hech qanday GPS signal yubormaydi. Xodimning shaxsiy erkinligi daxlsiz.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/60 flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <h4 className="font-bold text-white text-sm">Kasalxona ichida aniq geofencing</h4>
                    <p className="text-slate-400 leading-relaxed">
                      Xodim operatsiya blokida, qabulxona yoki tug&apos;ruq zalida ekanligi xaritada ko&apos;rinadi. Favqulodda vaziyatda tez topiladi.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/60 flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                    <Battery className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <h4 className="font-bold text-white text-sm">Batareyani tejovchi algoritm</h4>
                    <p className="text-slate-400 leading-relaxed">
                      Doimiy GPS emas, aqlli harakat datchigi orqali smartfon quvvatini bir kunda 3-4% dan ortiq sarflamaydi.
                    </p>
                  </div>
                </div>
              </div>

              {onOpenTrial && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onOpenTrial}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>14 kun bepul sinab ko&apos;rish</span>
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
