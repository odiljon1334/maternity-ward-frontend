"use client";

import React from "react";
import {
  Tablet,
  CheckCircle2,
  ArrowRight,
  Zap,
  Volume2,
  ScanFace,
  DollarSign,
} from "lucide-react";
import Link from "next/link";

interface TabletKioskShowcaseProps {
  onOpenTrial?: () => void;
}

export function TabletKioskShowcase({ onOpenTrial }: TabletKioskShowcaseProps) {

  const perks = [
    {
      title: "0 so'mlik Uskuna Xarajati",
      desc: "Qimmatbaho $300-$500 lik Hikvision yoki ZKTeco sotib olish shart emas. Har qanday Android planshet yoki eski iPad kifoya.",
      icon: DollarSign,
    },
    {
      title: "0.3 Soniyada Yuzni Tanish",
      desc: "Xodim devorga o'rnatilgan planshet qarshisiga keladi — sun'iy intellekt kamerada yuzni zumda aniqlaydi.",
      icon: Zap,
    },
    {
      title: "O'zbek Tilida Ovozli Tabrik",
      desc: "'Xush kelibsiz, Sarvar!' deb planshet baland ovozda tabriklaydi. Xodimlar intizomi va kayfiyati 1-kundan ko'tariladi.",
      icon: Volume2,
    },
    {
      title: "Telegramga Darhol Hisobot",
      desc: "Xodim kelishi yoki ketishi bilan boshqaruvchi Telegram botiga kim, qaysi vaqtda kelganligi avtomatik boradi.",
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="kiosk-mode" className="py-20 bg-slate-900 text-white relative overflow-hidden border-y border-slate-800">
      
      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left info & pitch (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-wider border border-blue-500/30">
              <Tablet className="w-3.5 h-3.5" />
              YANGI IMKONIYAT: KIOSK REJIMI
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Qimmat uskunaga hojat yo&apos;q:{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Planshetingizni Face ID
              </span>{" "}
              terminaliga aylantiring!
            </h2>

            <p className="text-base text-slate-300 leading-relaxed">
              Devoringizga bitta oddiy planshetni o&apos;rnatib qo&apos;ying va StaffPulse Kiosk rejimini oching.
              Xodimlar kirishda unga qaraydi, tizim 0.3 soniyada taniydi, o&apos;zbekcha ovoz chiqaradi va
              tabelni avtomatik to&apos;ldiradi.
            </p>

            {/* Feature List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {perks.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 hover:border-slate-600 transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-2.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-sm text-white">{p.title}</div>
                    <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {p.desc}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                href="/dashboard/kiosk"
                className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 font-extrabold text-sm text-white shadow-xl shadow-blue-500/25 flex items-center gap-2 transition-all cursor-pointer"
              >
                <ScanFace className="w-4 h-4" />
                <span>Kiosk Terminalini Ochish (Jonli)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {onOpenTrial && (
                <button
                  onClick={onOpenTrial}
                  className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 font-bold text-sm text-slate-200 border border-slate-700 transition-all cursor-pointer"
                >
                  Bepul Sinab Ko&apos;rish
                </button>
              )}
            </div>
          </div>

          {/* Right: Mockup of Wall-Mounted Tablet (6 cols) */}
          <div className="lg:col-span-6 flex justify-center">
            
            {/* Tablet Hardware Frame */}
            <div className="relative w-full max-w-md p-4 rounded-[40px] bg-slate-800 border-4 border-slate-700 shadow-2xl ring-1 ring-white/10">
              
              {/* Camera dot & mic */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
                <div className="w-1 h-1 rounded-full bg-slate-700" />
              </div>

              {/* Tablet Screen Content */}
              <div className="mt-2 rounded-[30px] bg-slate-950 p-5 overflow-hidden border border-slate-800 relative">
                
                {/* Simulated Kiosk UI Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                      <ScanFace className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">StaffPulse Kiosk</div>
                      <div className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        TERMINAL ONLINE
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-white">08:44:12</div>
                    <div className="text-[9px] text-slate-400">Toshkent</div>
                  </div>
                </div>

                {/* Simulated Camera Scan Window */}
                <div className="my-4 relative h-52 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
                  
                  {/* Background camera image simulation */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-900 flex items-center justify-center">
                    <div className="w-32 h-40 rounded-2xl border-2 border-emerald-400 bg-emerald-500/10 flex flex-col items-center justify-between p-3 relative shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                      <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" />
                      
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-400/80 flex items-center justify-center">
                        <ScanFace className="w-8 h-8 text-emerald-400 animate-pulse" />
                      </div>

                      <span className="text-[10px] font-bold text-emerald-300 bg-slate-950/80 px-2 py-0.5 rounded-md">
                        0.28s • Yuz tanildi
                      </span>
                    </div>
                  </div>

                  {/* Audio Toast Badge */}
                  <div className="absolute bottom-2 left-2 right-2 p-2.5 rounded-xl bg-slate-950/90 border border-emerald-500/50 backdrop-blur-md flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      DR
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>Dilnoza Raximova</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="text-[10px] text-emerald-400 font-medium">
                        &ldquo;Xush kelibsiz, Dilnoza!&rdquo; (08:44)
                      </div>
                    </div>
                  </div>

                </div>

                {/* Bottom Recent Strip */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 flex items-center justify-between">
                    <span>So&apos;nggi qayd etilganlar:</span>
                    <span className="text-blue-400 font-mono">Bugun: 48 nafar</span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-white">Akmal Saidov</span>
                    <span className="text-emerald-400 font-mono font-bold">08:42 • Keldi</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-white">Jasur Alimov</span>
                    <span className="text-emerald-400 font-mono font-bold">08:39 • Keldi</span>
                  </div>
                </div>

                {/* Hardware Spec Note */}
                <div className="mt-3 pt-2 border-t border-slate-800/60 text-center text-[10px] text-slate-500">
                  Mos keladi: Samsung Galaxy Tab, iPad, Xiaomi Pad yoki Web-kamera
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
