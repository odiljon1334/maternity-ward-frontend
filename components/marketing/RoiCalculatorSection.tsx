"use client";

import React, { useState } from "react";
import { formatMoney } from "@/lib/utils";
import {
  Clock,
  Coins,
  ShieldCheck,
  ArrowRight,
  Calculator,
  Building2,
  FileSpreadsheet,
} from "lucide-react";

interface RoiCalculatorSectionProps {
  onOpenTrial?: () => void;
  onOpenProposal?: (data: {
    employees: number;
    salary: number;
    lostMinutes: number;
    monthlyLoss: number;
    savings: number;
  }) => void;
}

export function RoiCalculatorSection({
  onOpenTrial,
  onOpenProposal,
}: RoiCalculatorSectionProps) {
  const [employees, setEmployees] = useState<number>(65);
  const [avgSalary, setAvgSalary] = useState<number>(4500000); // 4.5 mln UZS
  const [avgLostMinutes, setAvgLostMinutes] = useState<number>(18); // min per day

  // Mathematical logic:
  // Working days per month: 22 days
  // Working hours per day: 8 hours = 480 minutes
  // Hourly rate = avgSalary / (22 * 8)
  // Minute rate = avgSalary / (22 * 480)
  const workMinutesPerMonth = 22 * 480;
  const minuteCost = avgSalary / workMinutesPerMonth;

  // Monthly wasted money on tardiness/untracked absence:
  const monthlyTardinessLoss = Math.round(
    employees * avgLostMinutes * 22 * minuteCost
  );

  // Ghost presence / buddy-punching & manual HR calculation mistakes (conservative 3% of payroll)
  const manualHrAdminLoss = Math.round(employees * avgSalary * 0.025);

  // Total monthly company loss without biometrics/automation:
  const totalMonthlyLoss = monthlyTardinessLoss + manualHrAdminLoss;

  // Estimated StaffPulse cost per month:
  // Base 12,000 UZS per active employee, with discounts for scale
  const staffPulseCost = Math.round(
    employees <= 20
      ? 290000
      : employees <= 50
      ? 590000
      : employees <= 100
      ? 990000
      : employees <= 300
      ? 1890000
      : employees * 7500
  );

  // Net monthly savings:
  const netMonthlySavings = Math.max(0, totalMonthlyLoss - staffPulseCost);
  const netYearlySavings = netMonthlySavings * 12;

  // Return on Investment multiple:
  const roiMultiplier = Math.round(totalMonthlyLoss / Math.max(staffPulseCost, 1));

  const formatUZS = (val: number) => {
    return formatMoney(val);
  };

  return (
    <section id="roi-calculator" className="py-20 bg-slate-900 text-white relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Coins className="w-4 h-4" />
            <span>Iqtisodiy Samaradorlik &amp; Tejamkorlik</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            StaffPulse tizimi korxonangizga qancha pul tejab beradi?
          </h2>
          <p className="mt-3.5 text-sm sm:text-base text-slate-300 leading-relaxed">
            Kechikishlar, o&apos;zaro biometriyasiz kartochka urishlar (buddy-punching) va kadrlar hisobidagi qo&apos;lda qilingan xatoliklar qancha zarar keltirishini real hisoblab ko&apos;ring.
          </p>
        </div>

        {/* Main Grid: Inputs vs Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Sliders (7 cols) */}
          <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl backdrop-blur-md">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                <div className="flex items-center gap-2.5">
                  <Calculator className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-white text-base sm:text-lg">
                    Korxona Ko&apos;rsatkichlari
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  O&apos;zbekiston mehnat standartlari (22 ish kuni)
                </span>
              </div>

              {/* Slider 1: Xodimlar soni */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    Xodimlar soni:
                  </span>
                  <span className="text-base font-extrabold text-blue-400 bg-blue-950/60 px-3 py-1 rounded-xl border border-blue-800/60" suppressHydrationWarning>
                    {employees} nafar
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="500"
                  step="5"
                  value={employees}
                  onChange={(e) => setEmployees(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>5 nafar</span>
                  <span>100</span>
                  <span>250</span>
                  <span>500+ nafar</span>
                </div>
              </div>

              {/* Slider 2: O'rtacha oylik maosh */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 font-medium flex items-center gap-2">
                    <Coins className="w-4 h-4 text-emerald-400" />
                    O&apos;rtacha oylik maosh (netto):
                  </span>
                  <span className="text-base font-extrabold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-800/60" suppressHydrationWarning>
                    {formatUZS(avgSalary)}
                  </span>
                </div>
                <input
                  type="range"
                  min="2000000"
                  max="15000000"
                  step="500000"
                  value={avgSalary}
                  onChange={(e) => setAvgSalary(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>2 mln</span>
                  <span>5 mln</span>
                  <span>10 mln</span>
                  <span>15 mln so&apos;m</span>
                </div>
              </div>

              {/* Slider 3: Kechikishlar va intizom yo'qotishlari */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Xodim boshiga kunlik yo&apos;qotilgan vaqt (kechikish/erta ketish):
                  </span>
                  <span className="text-base font-extrabold text-amber-400 bg-amber-950/60 px-3 py-1 rounded-xl border border-amber-800/60" suppressHydrationWarning>
                    {avgLostMinutes} daqiqa / kun
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="45"
                  step="1"
                  value={avgLostMinutes}
                  onChange={(e) => setAvgLostMinutes(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>5 daq (intizomli)</span>
                  <span>15 daq (o&apos;rtacha)</span>
                  <span>30 daq</span>
                  <span>45 daqiqa</span>
                </div>
              </div>

              {/* Explanatory breakdown note */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/60 text-xs text-slate-300 space-y-1.5">
                <div className="font-semibold text-slate-200">Kalkulyatsiya tarkibi:</div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Kechikishlar tufayli to&apos;lanayotgan ortiqcha maosh:</span>
                  <span className="text-red-400 font-bold" suppressHydrationWarning>{formatUZS(monthlyTardinessLoss)}/oy</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Tabel tuzish, kadrlar hisobi va xatolar xarajati:</span>
                  <span className="text-red-400 font-bold" suppressHydrationWarning>{formatUZS(manualHrAdminLoss)}/oy</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/70 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Matematik model O&apos;zbekiston Mehnat kodeksi mezonlariga asoslangan
              </span>
            </div>
          </div>

          {/* Right Column: Savings Summary & CTA (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-emerald-950/40 via-slate-800 to-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative">
            <div className="space-y-6">
              <div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500 text-slate-950">
                  Kafolatlangan Tejamkorlik
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-3">
                  Har oy sof tejaladigan mablag&apos;:
                </h3>
              </div>

              {/* Massive Net Savings Amount */}
              <div className="p-5 rounded-2xl bg-emerald-900/30 border border-emerald-500/30 space-y-2">
                <div className="text-2xl sm:text-4xl font-black text-emerald-400 tracking-tight" suppressHydrationWarning>
                  +{formatUZS(netMonthlySavings)}
                </div>
                <div className="text-xs text-emerald-200/90 font-medium" suppressHydrationWarning>
                  Yiliga: <strong className="text-white">+{formatUZS(netYearlySavings)}</strong> sof foyda!
                </div>
              </div>

              {/* ROI & Comparison Stats */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700">
                  <div className="text-[11px] text-slate-400">Samaradorlik (ROI):</div>
                  <div className="text-xl font-extrabold text-blue-400 mt-0.5" suppressHydrationWarning>
                    {roiMultiplier}x marta
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Har 1 so&apos;m investitsiyaga</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700">
                  <div className="text-[11px] text-slate-400">StaffPulse oylik to&apos;lovi:</div>
                  <div className="text-base sm:text-lg font-bold text-white mt-0.5" suppressHydrationWarning>
                    {formatUZS(staffPulseCost)}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">0 so&apos;m o&apos;rnatish bilan</div>
                </div>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed">
                Tizim o&apos;z xarajatini dastlabki <strong>3-5 kun ichidayoq</strong> to&apos;liq oqlaydi. Qolgan 25 kun korxonangiz uchun toza daromad hisoblanadi.
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-8 space-y-3">
              <button
                onClick={onOpenTrial}
                className="w-full py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
              >
                <span>14 kunlik sinovni boshlash</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onOpenProposal && (
                <button
                  onClick={() =>
                    onOpenProposal({
                      employees,
                      salary: avgSalary,
                      lostMinutes: avgLostMinutes,
                      monthlyLoss: totalMonthlyLoss,
                      savings: netMonthlySavings,
                    })
                  }
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                  <span>Direktor uchun Tijoriy Taklif (PDF) chiqarish</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
