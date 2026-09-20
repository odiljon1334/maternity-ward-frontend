"use client";

import { useState } from "react";
import {
  X,
  CheckCircle2,
  ScanFace,
  Calendar,
  DollarSign,
  Bot,
  ArrowRight,
  Wifi,
  Clock,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface InteractiveDemoTourProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTrial: () => void;
}

const TOUR_STEPS = [
  {
    id: "face-id",
    title: "1. Biometrik Face ID Terminali",
    badge: "0.3 soniyada tanish",
    icon: <ScanFace className="w-5 h-5 text-blue-600" />,
    description: "Xodim terminalga yaqinlashganda yuzni darhol taniydi va davomatni milliy serverga uzatadi. Fotosurat yoki soxtalashtirish o'tmaydi.",
  },
  {
    id: "realtime",
    title: "2. Jonli Davomat & Real-time Monitoring",
    badge: "Jonli oqim",
    icon: <Clock className="w-5 h-5 text-emerald-600" />,
    description: "Har bir bo'lim bo'yicha kim hozir ishda, kim kechikkan yoki ta'tilda ekanligi bir qarashda ko'rinadi.",
  },
  {
    id: "schedules",
    title: "3. 24/7 Smena va Ish Rejasi",
    badge: "Avto-generatsiya",
    icon: <Calendar className="w-5 h-5 text-indigo-600" />,
    description: "Shifokor va xodimlarning kunlik, tungi va 24 soatlik navbatchiliklarini avtomatlashtiring. Bir bosishda butun oylik grafik tuziladi.",
  },
  {
    id: "payroll",
    title: "4. Oylik Maosh va Tabel Avtomatizatsiyasi",
    badge: "100% aniqlik",
    icon: <DollarSign className="w-5 h-5 text-amber-600" />,
    description: "Kechikish daqiqalari, erta ketishlar, tungi smena ustamalari avtomatik hisoblanadi. Excel va 1C formatida 1 daqiqada eksport qilinadi.",
  },
  {
    id: "ai-assistant",
    title: "5. AI Rahbariyat Yordamchisi",
    badge: "Aqlli tahlil",
    icon: <Bot className="w-5 h-5 text-violet-600" />,
    description: "Korxona rahbariga davomat anomaliyalari, smenalardagi yuklamalar va xodimlar yetishmovchiligi bo'yicha tavsiyalar beruvchi sun'iy intellekt.",
  },
];

export function InteractiveDemoTour({
  isOpen,
  onClose,
  onStartTrial,
}: InteractiveDemoTourProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [simulatedScan, setSimulatedScan] = useState(false);
  const [scanPerson, setScanPerson] = useState("Dr. Aliyev Rustam (Jarroh)");

  if (!isOpen) return null;

  const handleSimulateScan = () => {
    setSimulatedScan(true);
    setTimeout(() => {
      setSimulatedScan(false);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Window */}
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-10 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/70 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                  StaffPlusPRO &bull; Interaktiv Sandbox Demo
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  Ro&apos;yxatsiz Sinab Ko&apos;rish
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                StaffPlusPRO imkoniyatlarini 1 daqiqada jonli interfeys orqali sinab ko&apos;ring
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 scrollbar-none">
          {TOUR_STEPS.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === idx
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
              }`}
            >
              <span>{idx + 1}.</span>
              <span>{step.title.split(". ")[1]}</span>
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active Step Description */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {TOUR_STEPS[activeTab].title}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  {TOUR_STEPS[activeTab].badge}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {TOUR_STEPS[activeTab].description}
              </p>
            </div>
            <button
              onClick={() => setActiveTab((prev) => (prev + 1) % TOUR_STEPS.length)}
              className="self-start sm:self-auto shrink-0 flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Keyingi qadam
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Screen Preview by Tab */}
          {activeTab === 0 && (
            /* Face ID Terminal View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Terminal Viewfinder */}
              <div className="relative aspect-[4/3] rounded-2xl bg-slate-950 border-2 border-blue-500/30 overflow-hidden flex flex-col justify-between p-4 shadow-xl">
                {/* Top status bar */}
                <div className="flex items-center justify-between text-[11px] text-white/70 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>HIKVISION DS-K1T343</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ONLINE</span>
                  </div>
                </div>

                {/* Face Target Box */}
                <div className="relative mx-auto w-48 h-48 rounded-2xl border-2 border-dashed border-blue-400/60 flex items-center justify-center">
                  <div className="w-40 h-40 rounded-full border border-blue-400/30 flex items-center justify-center">
                    <ScanFace className="w-16 h-16 text-blue-400/80 animate-pulse" />
                  </div>
                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-400" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-400" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-400" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-400" />
                </div>

                {/* Simulated check-in alert overlay */}
                {simulatedScan ? (
                  <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
                    <span className="text-white font-bold text-sm">MUVAFFAQIYATLI BELGILANDI</span>
                    <span className="text-emerald-300 text-xs font-semibold mt-1">{scanPerson}</span>
                    <span className="text-white/60 text-[10px] font-mono mt-1">
                      08:00:14 • Kirish • Kechikish yo&apos;q
                    </span>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-[11px] text-white/60">Yuzni skanerlash doirasiga qarating</p>
                  </div>
                )}
              </div>

              {/* Controls & Log */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Jonli Sinovdan O&apos;tkazish
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Quyidagi tugmani bosib, xodimning Face ID terminalida ro&apos;yxatdan o&apos;tish jarayonini sinab ko&apos;ring:
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Sinov xodimi:
                  </label>
                  <select
                    value={scanPerson}
                    onChange={(e) => setScanPerson(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Dr. Aliyev Rustam (Jarroh)">Dr. Aliyev Rustam — Jarrohlik bo&apos;limi</option>
                    <option value="Hamshira Karimova Dilnoza (Tug'ruqxona)">Hamshira Karimova Dilnoza — Tug&apos;ruqxona</option>
                    <option value="Dr. Yusupov Bobur (Reanimatsiya)">Dr. Yusupov Bobur — Reanimatolog</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateScan}
                  disabled={simulatedScan}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer transition-all"
                >
                  <ScanFace className="w-4 h-4" />
                  Yuzni skanerlashni simulyatsiya qilish
                </button>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                    <span>Terminal holati:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Ulangan (100% Sinxron)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Biometrik ISUP / WebSocket protokoli orqali oqim 0.1s kechikish bilan bulutli serverga yetib keladi.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 1 && (
            /* Realtime Attendance Dashboard */
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-[11px] text-slate-500">Jami xodimlar:</span>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">84 nafar</p>
                </div>
                <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400">Ishda (Hozir):</span>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">76 nafar (90.4%)</p>
                </div>
                <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20">
                  <span className="text-[11px] text-amber-700 dark:text-amber-400">Kechikkanlar:</span>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">3 nafar</p>
                </div>
                <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-950/20">
                  <span className="text-[11px] text-blue-700 dark:text-blue-400">Ta&apos;til / Sababli:</span>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">5 nafar</p>
                </div>
              </div>

              {/* Table of Live Feed */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-100/70 dark:bg-slate-800/60 font-semibold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Jonli Davomat Tasmasi (Bugungi kun)</span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Jonli yangilanmoqda
                  </span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  <div className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-bold text-[11px]">
                        AR
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Dr. Aliyev Rustam</p>
                        <p className="text-[10px] text-slate-500">Jarrohlik bo&apos;limi • 1-korpus Terminal #2</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        07:54 (O&apos;z vaqtida)
                      </span>
                    </div>
                  </div>

                  <div className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center font-bold text-[11px]">
                        KD
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Hamshira Karimova Dilnoza</p>
                        <p className="text-[10px] text-slate-500">Tug&apos;ruqxona qabul • Terminal #1</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        07:58 (O&apos;z vaqtida)
                      </span>
                    </div>
                  </div>

                  <div className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center font-bold text-[11px]">
                        OM
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Dr. Omonov Murod</p>
                        <p className="text-[10px] text-slate-500">Laboratoriya bo&apos;limi • Terminal #3</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                        08:14 (14 daqiqa kech)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            /* Schedules Roster Preview */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Tibbiy Navbatchilik va Smena Matritsasi
                </h4>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  Tug&apos;ruq bo&apos;limi • Sentyabr 2026
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <th className="p-2.5 font-semibold">Xodim</th>
                      <th className="p-2.5 font-semibold">Lavozim</th>
                      <th className="p-2 text-center">Dush 15</th>
                      <th className="p-2 text-center">Sesh 16</th>
                      <th className="p-2 text-center">Chor 17</th>
                      <th className="p-2 text-center">Pay 18</th>
                      <th className="p-2 text-center">Jum 19</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="p-2.5 font-medium text-slate-900 dark:text-white">Dr. Aliyev R.</td>
                      <td className="p-2.5 text-slate-500">Katta doya-ginekolog</td>
                      <td className="p-2 text-center"><span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">KUN</span></td>
                      <td className="p-2 text-center"><span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold">TUN</span></td>
                      <td className="p-2 text-center"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">DAM</span></td>
                      <td className="p-2 text-center"><span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">KUN</span></td>
                      <td className="p-2 text-center"><span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold">TUN</span></td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium text-slate-900 dark:text-white">Dr. Yusupov B.</td>
                      <td className="p-2.5 text-slate-500">Reanimatolog</td>
                      <td className="p-2 text-center"><span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold">24H</span></td>
                      <td className="p-2 text-center"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">DAM</span></td>
                      <td className="p-2 text-center"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">DAM</span></td>
                      <td className="p-2 text-center"><span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold">24H</span></td>
                      <td className="p-2 text-center"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">DAM</span></td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium text-slate-900 dark:text-white">Hamshira Karimova</td>
                      <td className="p-2.5 text-slate-500">Katta hamshira</td>
                      <td className="p-2 text-center"><span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">KUN</span></td>
                      <td className="p-2 text-center"><span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">KUN</span></td>
                      <td className="p-2 text-center"><span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">KUN</span></td>
                      <td className="p-2 text-center"><span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">KUN</span></td>
                      <td className="p-2 text-center"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">DAM</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-500">
                Grafik avtomatik tuzilgach, har bir xodimga o&apos;z Telegram botida shaxsiy smena eslatmasi boradi.
              </p>
            </div>
          )}

          {activeTab === 3 && (
            /* Payroll & Timesheet */
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                    Sentyabr 2026 &bull; Oylik Tabel va Ish Haqi Hisoboti
                  </h5>
                  <p className="text-xs text-slate-500">
                    O&apos;zbekiston Mehnat Kodeksi talablariga mos avtomatlashtirilgan koeffitsientlar
                  </p>
                </div>
                <button
                  onClick={() => alert("Demo namuna: Excel tabel tayyorlandi")}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <DollarSign className="w-4 h-4" />
                  Excel eksport
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500">Ishlangan soatlar:</span>
                  <p className="text-base font-bold text-slate-900 dark:text-white">168 soat</p>
                  <p className="text-[10px] text-emerald-600">+18 soat tungi navbatchilik</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500">Kechikish ushlanmasi:</span>
                  <p className="text-base font-bold text-red-500">-42 000 so&apos;m</p>
                  <p className="text-[10px] text-slate-500">3 marta jami 35 daqiqa</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500">Hisoblangan sof maosh:</span>
                  <p className="text-base font-bold text-emerald-600">6 480 000 so&apos;m</p>
                  <p className="text-[10px] text-slate-500">Bank kartasiga to&apos;lanadi</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 4 && (
            /* AI Medical Assistant */
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-violet-200 dark:border-violet-900/40 bg-violet-50/50 dark:bg-violet-950/20 space-y-3">
                <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300 font-bold text-sm">
                  <Bot className="w-5 h-5" />
                  <span>Gemini AI &bull; Bosh shifokor uchun tahliliy xulosa:</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  &ldquo;Hurmatli Bosh shifokor! Ushbu haftada Tug&apos;ruq bo&apos;limida kechki smenalarda xodimlar intizomi 99.4% ni tashkil etdi. Biroq, Qabul bo&apos;limida dushanba kunlari soat 08:00–08:30 oralig&apos;ida 4 nafar hamshirada 10-15 daqiqalik kechikishlar kuzatildi. Navbatchilik jadvalini optimallashtirish tavsiya etiladi.&rdquo;
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>AI Bot bosh shifokorning Telegramiga har ertalab soat 08:30 da tahliliy xulosa yuboradi.</span>
                <span className="text-blue-600 font-semibold">Telegram integratsiyalashgan</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTAs */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            O&apos;z tashkilotingizda sinab ko&apos;rmoqchimisiz?
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
            >
              Yopish
            </button>
            <button
              onClick={() => {
                onClose();
                onStartTrial();
              }}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/25 flex items-center justify-center gap-1.5"
            >
              14 kunlik sinovni boshlash
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
