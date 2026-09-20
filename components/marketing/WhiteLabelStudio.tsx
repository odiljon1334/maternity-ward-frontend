"use client";

import { useState } from "react";
import {
  Building2,
  Stethoscope,
  Factory,
  Briefcase,
  GraduationCap,
  ShoppingBag,
  Palette,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Monitor,
  Send,
  ChevronRight,
} from "lucide-react";

interface IndustryPreset {
  id: string;
  name: string;
  category: string;
  icon: any;
  defaultName: string;
  tagline: string;
  moduleBadge: string;
  accentColor: string;
  shiftTypes: string[];
  sampleEmployees: { name: string; role: string; status: string; time: string }[];
}

const PRESETS: IndustryPreset[] = [
  {
    id: "clinic",
    name: "Tibbiyot & Tug'ruqxona",
    category: "MaternityCare Moduli",
    icon: Stethoscope,
    defaultName: "City Med Clinic & Maternity",
    tagline: "24/7 shifokorlar smenasi va T-13 tibbiy tabel",
    moduleBadge: "MaternityCare Edition",
    accentColor: "from-teal-600 to-emerald-600",
    shiftTypes: ["24h Sutkalik", "Kunduzgi 08:00-20:00", "Tungi 20:00-08:00"],
    sampleEmployees: [
      { name: "Dr. Karimova N.", role: "Akusher-ginekolog", status: "Navbatchi", time: "08:02" },
      { name: "Dr. Yusupov O.", role: "Anesteziolog", status: "Tungi smenada", time: "20:00" },
      { name: "Hamshira Saidova", role: "Bosh hamshira", status: "Kechikmagan", time: "07:55" },
    ],
  },
  {
    id: "factory",
    name: "Ishlab chiqarish & Zavod",
    category: "Sanoat Moduli",
    icon: Factory,
    defaultName: "Grand Tech Texnopark",
    tagline: "Brigadalar, sexlar va smena almashinuvi",
    moduleBadge: "Industry & Factory Edition",
    accentColor: "from-blue-600 to-indigo-600",
    shiftTypes: ["1-smena 07:00-15:30", "2-smena 15:30-00:00", "Tungi sex smenasi"],
    sampleEmployees: [
      { name: "Aliyev Jamshid", role: "Sex boshlig'i", status: "Sexda", time: "06:50" },
      { name: "Toshmatov B.", role: "Texnolog-usta", status: "Vaqtida kelgan", time: "06:58" },
      { name: "Nazarov S.", role: "Operator", status: "1-smena faol", time: "07:00" },
    ],
  },
  {
    id: "office",
    name: "Ofis & IT Kompaniya",
    category: "Korporativ Modul",
    icon: Briefcase,
    defaultName: "Apex Innovations Group",
    tagline: "Moslashuvchan grafik va daqiqabay kechikish",
    moduleBadge: "Corporate & Tech Edition",
    accentColor: "from-violet-600 to-purple-600",
    shiftTypes: ["Standart 09:00-18:00", "Flex 10:00-19:00", "Masofaviy (Hybrid)"],
    sampleEmployees: [
      { name: "Rustamov Diyor", role: "Team Lead", status: "Ofisda", time: "08:52" },
      { name: "Azimova Madina", role: "HR Menejer", status: "Ofisda", time: "08:58" },
      { name: "Bekzod Umarov", role: "Senior Developer", status: "Flex rejim", time: "09:30" },
    ],
  },
  {
    id: "retail",
    name: "Do'kon & Savdo Tarmog'i",
    category: "Retail Modul",
    icon: ShoppingBag,
    defaultName: "Safia Marketlar Tarmog'i",
    tagline: "Filiallar, kassa va savdo nuqtalari",
    moduleBadge: "Retail & Chain Edition",
    accentColor: "from-amber-500 to-orange-600",
    shiftTypes: ["Ertalabki kassa 08:00-16:00", "Kechki savdo 14:00-22:00", "2/2 Smena"],
    sampleEmployees: [
      { name: "Xoliqova Z.", role: "Kassir-operator", status: "Kassada", time: "07:50" },
      { name: "Qodirov J.", role: "Filial mudiri", status: "Onlayn", time: "08:10" },
      { name: "Saidov Elyor", role: "Merchendayzer", status: "2-filialda", time: "08:05" },
    ],
  },
  {
    id: "edu",
    name: "Ta'lim & Maktab",
    category: "Akademik Modul",
    icon: GraduationCap,
    defaultName: "Registon Academy & Maktab",
    tagline: "Dars jadvallari va pedagoglar hisobi",
    moduleBadge: "Education & Campus Edition",
    accentColor: "from-sky-500 to-blue-700",
    shiftTypes: ["1-smena 08:00-13:00", "2-smena 13:30-18:30", "Kafedra soatlari"],
    sampleEmployees: [
      { name: "Ustoz Ergasheva", role: "Bosh o'qituvchi", status: "Auditda", time: "07:45" },
      { name: "Muallim Olimov", role: "Matematika", status: "Darsda", time: "07:55" },
      { name: "Rahmonova G.", role: "Metodist", status: "Kutubxonada", time: "08:00" },
    ],
  },
];

export function WhiteLabelStudio() {
  const [selectedPreset, setSelectedPreset] = useState<IndustryPreset>(PRESETS[0]);
  const [customName, setCustomName] = useState(PRESETS[0].defaultName);
  const [customSlogan, setCustomSlogan] = useState(PRESETS[0].tagline);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile" | "telegram">("desktop");

  const handleSelectPreset = (preset: IndustryPreset) => {
    setSelectedPreset(preset);
    setCustomName(preset.defaultName);
    setCustomSlogan(preset.tagline);
  };

  return (
    <section id="whitelabel" className="py-20 sm:py-28 relative overflow-hidden bg-slate-900 text-white">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/30">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>100% White-Label &bull; Sizning Korxona Brendingiz</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Har bir korxona —{" "}
            <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-indigo-300 bg-clip-text text-transparent">
              o&apos;z logotipi va brendi
            </span>{" "}
            bilan
          </h2>

          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            StaffPlusPRO yagona qolipga tiqilmaydi. Tizim nomi, logotipi va mobil interfeysi aynan <strong>sizning korxonangiz nomida</strong> namoyon bo&apos;ladi. Tug&apos;ruqxona va klinikalar uchun esa maxsus <strong>MaternityCare</strong> vertikal moduli mavjud.
          </p>
        </div>

        {/* Industry Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
          {PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = preset.id === selectedPreset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-800 border-blue-500 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500"
                    : "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${preset.accentColor} text-white shadow-xs`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block leading-snug">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {preset.category}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Interactive Customizer & Live White-Label Studio */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Controls column */}
          <div className="lg:col-span-4 bg-slate-800/60 rounded-3xl border border-slate-700/80 p-6 sm:p-7 space-y-6 flex flex-col justify-between backdrop-blur-xs">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-blue-400" />
                  <span>Brendingizni Sinab Ko&apos;ring</span>
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Jonli Generator
                </span>
              </div>

              {/* Company name input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Korxonangiz yoki Klinikangiz Nomi
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Masalan: Artel, Medion, Akfa..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Tagline input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Shior yoki Faoliyat Tavsifi
                </label>
                <input
                  type="text"
                  value={customSlogan}
                  onChange={(e) => setCustomSlogan(e.target.value)}
                  placeholder="Xodimlar intizomi va 24/7 navbatchilik"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Smena and module info */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Faollashgan modul:</span>
                  <span className="font-bold text-emerald-400">{selectedPreset.moduleBadge}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium block">
                    Moslashtirilgan smenalar:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPreset.shiftTypes.map((shift, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700"
                      >
                        {shift}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Features list */}
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Xodimlar mobil ilovasida sizning logotipingiz chiqadi</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Telegram bot xabarlari korxonangiz nomidan yuboriladi</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Eksport qilinadigan barcha T-13 tabelda sizning rekvizitlaringiz</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700/60">
              <a
                href="/register"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-600/30"
              >
                <span>Ushbu brendingda 14 kun sinab ko&apos;rish</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-8 bg-slate-950 rounded-3xl border border-slate-800 p-6 sm:p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            {/* View mode switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-300">
                  White-Label Jonli Ko&apos;rinish Simulyatori
                </span>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <button
                  onClick={() => setPreviewMode("desktop")}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 font-semibold transition-colors cursor-pointer ${
                    previewMode === "desktop"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Web Portal</span>
                </button>
                <button
                  onClick={() => setPreviewMode("mobile")}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 font-semibold transition-colors cursor-pointer ${
                    previewMode === "mobile"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Xodim Ilovasi</span>
                </button>
                <button
                  onClick={() => setPreviewMode("telegram")}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 font-semibold transition-colors cursor-pointer ${
                    previewMode === "telegram"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Telegram Bot</span>
                </button>
              </div>
            </div>

            {/* PREVIEW CONTENT */}
            <div className="py-6 flex-1 flex flex-col justify-center">
              {previewMode === "desktop" && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
                  {/* Fake browser bar */}
                  <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 pl-2">
                        {customName.toLowerCase().replace(/[^a-z0-9]/g, "") || "korxona"}.staffpluspro.uz
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold">
                      {selectedPreset.moduleBadge}
                    </span>
                  </div>

                  {/* Dashboard header with custom logo and name */}
                  <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedPreset.accentColor} flex items-center justify-center text-white font-black text-lg shadow-md`}>
                        {customName.charAt(0) || "K"}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-white tracking-tight">
                          {customName || "Sizning Korxonangiz"}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {customSlogan || "Boshqaruv va davomat tizimi"}
                        </p>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Terminallar Onlayn
                      </span>
                    </div>
                  </div>

                  {/* Live employee attendance mock rows */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                      <span>Jonli Kelgan Xodimlar</span>
                      <span>Smena &bull; Vaqt</span>
                    </div>

                    <div className="space-y-2">
                      {selectedPreset.sampleEmployees.map((emp, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-between text-xs hover:bg-slate-800/80 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs">
                              {emp.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-white block">
                                {emp.name}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {emp.role}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-bold text-emerald-400 block">
                              {emp.time}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {emp.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {previewMode === "mobile" && (
                <div className="max-w-xs mx-auto w-full rounded-3xl border-4 border-slate-700 bg-slate-900 p-4 shadow-2xl space-y-4">
                  <div className="w-20 h-3.5 bg-slate-800 rounded-full mx-auto" />
                  <div className="text-center pt-2 space-y-1">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${selectedPreset.accentColor} mx-auto flex items-center justify-center text-white font-black text-xl shadow-lg`}>
                      {customName.charAt(0) || "K"}
                    </div>
                    <h5 className="font-extrabold text-sm text-white">
                      {customName || "Korxona Nomi"}
                    </h5>
                    <p className="text-[10px] text-slate-400">Xodim Shaxsiy Kabineti</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Bugungi Smena:</span>
                      <span className="text-white font-bold">{selectedPreset.shiftTypes[0]}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Kirish vaqti:</span>
                      <span className="text-emerald-400 font-mono font-bold">08:00 (O&apos;z vaqtida)</span>
                    </div>
                  </div>

                  <button className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md">
                    <span>Face ID orqali Check-in</span>
                  </button>
                </div>
              )}

              {previewMode === "telegram" && (
                <div className="max-w-md mx-auto w-full rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-xs">
                    <div className="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center text-white">
                      <Send className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">
                        @{customName.toLowerCase().replace(/[^a-z0-9]/g, "") || "korxona"}_bot
                      </span>
                      <span className="text-[10px] text-slate-400">Rasmiy Rahbariyat Xabarnomasi</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-800/90 text-xs space-y-2 border border-slate-700/60 font-sans">
                    <p className="font-bold text-sky-400">
                      📊 {customName} — Ertalabki Davomat Xulosasi (08:30)
                    </p>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      Hurmatli Rahbariyat! Bugun jami 48 nafar xodimdan 46 nafari o&apos;z vaqtida keldi. 2 nafar xodim kechikdi.
                    </p>
                    <div className="p-2 rounded bg-slate-900/60 font-mono text-[10px] text-amber-300">
                      ⚠️ Kechikkanlar: Saidov E. (14 daqiqa), Qodirov J. (8 daqiqa)
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Tizim: StaffPlusPRO Enterprise &bull; {selectedPreset.moduleBadge}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom info bar */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
              <span>
                Brendingiz sozlamalari 1 marta kiritiladi va barcha xodimlar hamda hisobotlarda avtomatik qo&apos;llanadi.
              </span>
              <span className="text-blue-400 font-semibold shrink-0">
                White-Label barcha tariflarda mavjud
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
