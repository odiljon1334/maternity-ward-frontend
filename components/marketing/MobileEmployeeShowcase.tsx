"use client";

import { useState } from "react";
import {
  ScanFace,
  ClipboardList,
  CalendarDays,
  Palmtree,
  Wallet,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sun,
  Moon,
  MapPin,
  Camera,
  Bell,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Coffee,
  Umbrella,
  Plus,
  ArrowRight,
  Sparkles,
  Check,
  Smartphone,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileEmployeeShowcaseProps {
  onOpenTrial?: () => void;
}

export function MobileEmployeeShowcase({ onOpenTrial }: MobileEmployeeShowcaseProps) {
  const [activeTab, setActiveTab] = useState<"checkin" | "attendance" | "schedule" | "leaves">("attendance");
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedDay, setSelectedDay] = useState(20);
  const [leaveFilter, setLeaveFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [gpsLocated, setGpsLocated] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  return (
    <section id="mobile-app" className="py-20 sm:py-28 bg-white text-slate-900 relative overflow-hidden border-t border-slate-100">
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-blue-600/10 via-indigo-600/10 to-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Xodim Mobil Ilovasi (PWA &amp; Telegram)</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Xodimlar uchun qulay va zamonaviy mobil kabinet
          </h2>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Face ID qurilma o&apos;rnatish shart emas. Har bir xodim o&apos;z smartfonida GPS ish joyi, selfi orqali davomat, shaxsiy ish grafigi, oylik hisobot va ta&apos;til so&apos;rovlarini 1 daqiqada boshqaradi.
          </p>
        </div>

        {/* Interactive Phone Frame & Features Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Feature Highlights & Quick Screen Switcher */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-1.5 rounded-2xl bg-slate-100 border border-slate-200 flex flex-wrap gap-1.5 mb-6">
              {[
                { id: "checkin", label: "1. Check-in (GPS & Selfie)", icon: ScanFace },
                { id: "attendance", label: "2. Mening davomatim", icon: ClipboardList },
                { id: "schedule", label: "3. Mening grafigim", icon: CalendarDays },
                { id: "leaves", label: "4. Ta'til so'rovlari", icon: Palmtree },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer",
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Feature Description Card based on Active Screen */}
            <div className="rounded-3xl p-6 sm:p-8 bg-slate-50 border border-slate-200 space-y-4 shadow-xl">
              {activeTab === "checkin" && (
                <>
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <ScanFace className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Smartfon orqali tezkor Check-in</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Xodim korxona binosiga yetib kelganda bir marta tugmani bosadi: GPS koordinata ish joyi radiusi ichida ekani tekshiriladi va jonli selfi surati olinadi. 
                  </p>
                  <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Geofencing: korxonadan tashqarida turib belgilash imkonsiz</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Check-in bosilgach Live Xarita ishga tushadi; Check-out bosilgach kuzatuv 100% to&apos;xtatiladi</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Surat va aniq vaqt bir zumda direktor Telegram botiga yuboriladi</span>
                    </li>
                  </ul>
                </>
              )}

              {activeTab === "attendance" && (
                <>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Oylik Davomat Taqvimi &amp; Foiz</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Xodim o&apos;zining butun oylik keldi-ketdi tarixini, kechikish daqiqalarini va davomat foizini to&apos;liq shaffof ko&apos;rib boradi. Kadrlar bo&apos;limi bilan hech qanday tushunmovchilik qolmaydi.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Har bir kun bo&apos;yicha aniq status (Keldi, Kechikdi, Dam olish)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Shaxsiy davomat foizi va hisoblangan soatlar</span>
                    </li>
                  </ul>
                </>
              )}

              {activeTab === "schedule" && (
                <>
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Shaxsiy Ish Rejasi &amp; Kunlik Smenalar</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Har bir kun uchun turlicha ish vaqtlari (masalan, 08:00–14:00, 08:00–18:00 yoki 20:00–08:00 tungi smenalar) avtomatik kalendarda belgilab beriladi.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Ish kunlari, dam olish kunlari va smena vaqtlari aniq ko&apos;rinadi</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Tungi smena ustamalari avtomatik hisoblanadi</span>
                    </li>
                  </ul>
                </>
              )}

              {activeTab === "leaves" && (
                <>
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Palmtree className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Qog&apos;ozsiz Ta&apos;til &amp; Ruxsat So&apos;rovlari</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Mehnat ta&apos;tili, ish haqi saqlanmagan ta&apos;til yoki kasallik varaqasini to&apos;g&apos;ridan-to&apos;g&apos;ri ilovadan yuborish. Rahbariyat Telegram orqali 1 soniyada tasdiqlaydi.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Arizalar holati: Kutilmoqda, Tasdiqlangan, Rad etilgan</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Avtomatik T-13 tabelga va oylik ish haqiga bog&apos;lanadi</span>
                    </li>
                  </ul>
                </>
              )}
            </div>

            {onOpenTrial && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenTrial}
                  className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                >
                  <span>Xodimlarni mobil ilovaga bepul ulash</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Exact Mobile Phone UI Mockup from User's Screenshots */}
          <div className="lg:col-span-6 flex justify-center">
            {/* Phone Bezel */}
            <div className="relative w-full max-w-[390px] rounded-[48px] bg-slate-900 p-3.5 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700/50">
              {/* Dynamic Island / Notch */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-950 rounded-full z-30" />

              {/* Phone Screen Container */}
              <div className="relative w-full rounded-[38px] bg-[#0c101c] text-white overflow-hidden min-h-[690px] flex flex-col justify-between border border-slate-800/80 select-none">
                {/* ── Screen Topbar ── */}
                <div className="pt-8 px-4 pb-3 border-b border-slate-800/60 bg-[#0f1424] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button type="button" className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
                      <Menu className="w-4 h-4" />
                    </button>
                    <div>
                      <h4 className="text-xs font-extrabold text-white leading-tight">
                        {activeTab === "checkin" && "Bugungi holat"}
                        {activeTab === "attendance" && "Mening davomatim"}
                        {activeTab === "schedule" && "Mening grafigim"}
                        {activeTab === "leaves" && "Ta'til so'rovlari"}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Odiljon Akramov &bull; {activeTab === "checkin" ? "Shaxsiy vaqt nazorati" : "2026 yil, Sentabr"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-800 text-amber-400">
                      <Sun className="w-3.5 h-3.5" />
                    </div>
                    {/* Notification Bell with Badge */}
                    <button
                      type="button"
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-1.5 rounded-lg bg-slate-800 text-blue-400 hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center">
                        2
                      </span>
                    </button>
                    {/* User Avatar */}
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-[11px] font-bold ring-1 ring-blue-400">
                      OA
                    </div>
                  </div>
                </div>

                {/* ── Notifications Dropdown / Overlay (Screenshot 5) ── */}
                {showNotifications && (
                  <div className="absolute top-20 inset-x-2 z-40 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-3.5 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <Bell className="w-3.5 h-3.5 text-blue-400" />
                        <span>BILDIRISHNOMALAR (2)</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-blue-400">
                        <button type="button" onClick={() => setShowNotifications(false)}>Hammasini o&apos;qish</button>
                        <span>&bull;</span>
                        <button type="button" onClick={() => setShowNotifications(false)}>Barchasi &rarr;</button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-start gap-2.5">
                        <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-white">
                            <span>Check-out eslatmasi ⏰</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          </div>
                          <p className="text-[10px] text-slate-300 leading-snug">
                            Ish vaqtingiz tugadi. Iltimos, check-out qilishni unutmang!
                          </p>
                          <span className="text-[9px] text-slate-500 font-mono block">09-19 08:10</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-start gap-2.5">
                        <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-white">
                            <span>Check-out eslatmasi ⏰</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          </div>
                          <p className="text-[10px] text-slate-300 leading-snug">
                            Ish vaqtingiz tugadi. Iltimos, check-out qilishni unutmang!
                          </p>
                          <span className="text-[9px] text-slate-500 font-mono block">09-19 08:05</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Screen Body (Based on Active Tab) ── */}
                <div className="flex-1 p-3.5 space-y-3.5 overflow-y-auto max-h-[570px] scrollbar-none">
                  {/* SCREEN 1: CHECK-IN (Screenshot 2) */}
                  {activeTab === "checkin" && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sana</span>
                        <p className="text-xs font-black text-white">20 Sentabr 2026, Yakshanba</p>
                      </div>

                      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 text-center space-y-2">
                        <Clock className="w-6 h-6 text-slate-500 mx-auto" />
                        <p className="text-xs text-slate-300 font-semibold">
                          Bugun hali davomat belgilanmagan
                        </p>
                      </div>

                      {/* Card 1: Hozirgi ish joyi */}
                      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                            <MapPin className="w-3.5 h-3.5 text-blue-400" />
                            <span>Hozirgi ish joyi</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/20 text-amber-400">
                            Majburiy
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Ish joyingizning manzilini aniqlash uchun quyidagi tugmani bosing
                        </p>
                        <button
                          type="button"
                          onClick={() => setGpsLocated(!gpsLocated)}
                          className={cn(
                            "w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer",
                            gpsLocated
                              ? "bg-emerald-600 text-white"
                              : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
                          )}
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{gpsLocated ? "✓ Manzil aniqlandi (Bosh bino)" : "Manzilni aniqlash"}</span>
                        </button>
                      </div>

                      {/* Card 2: Selfie */}
                      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                            <Camera className="w-3.5 h-3.5 text-blue-400" />
                            <span>Selfie</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/20 text-amber-400">
                            Majburiy
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCameraActive(!cameraActive)}
                          className={cn(
                            "w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer",
                            cameraActive
                              ? "bg-emerald-600 text-white"
                              : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
                          )}
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{cameraActive ? "✓ Selfie muvaffaqiyatli olindi" : "Kamerani ochish"}</span>
                        </button>
                      </div>

                      {/* Check-in CTA */}
                      <div className="pt-2 text-center space-y-1.5">
                        <button
                          type="button"
                          disabled={!gpsLocated || !cameraActive}
                          className={cn(
                            "w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all",
                            gpsLocated && cameraActive
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg cursor-pointer"
                              : "bg-slate-800 text-slate-500 cursor-not-allowed"
                          )}
                        >
                          <span>Check-in</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        {(!gpsLocated || !cameraActive) && (
                          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                            <span>⬆ GPS manzil va selfie kerak</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SCREEN 2: MENING DAVOMATIM (Screenshot 1) */}
                  {activeTab === "attendance" && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      {/* Month Switcher Bar */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold">
                        <button type="button" className="p-1 rounded text-slate-400 hover:text-white">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span>Sentabr 2026</span>
                        <button type="button" className="p-1 rounded text-slate-400 hover:text-white">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* 4 Stats Cards */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block">Keldi</span>
                            <span className="text-sm font-black text-white">1</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block">Kechikdi</span>
                            <span className="text-sm font-black text-white">0</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                            <XCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block">Kelmadi</span>
                            <span className="text-sm font-black text-white">2</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block">Kechikish</span>
                            <span className="text-sm font-black text-white">0 daqiqa</span>
                          </div>
                        </div>
                      </div>

                      {/* Calendar Card */}
                      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-white flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5 text-blue-400" />
                            Oylik davomat taqvimi
                          </span>
                          <div className="flex items-center gap-2 text-[9px]">
                            <span className="text-emerald-400 font-semibold">&bull; Keldi</span>
                            <span className="text-amber-400 font-semibold">&bull; Kechikdi</span>
                            <span className="text-rose-400 font-semibold">&bull; Kelmadi</span>
                          </div>
                        </div>

                        {/* Weekday Header */}
                        <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-400">
                          <span>Du</span><span>Se</span><span>Ch</span><span>Pa</span><span>Ju</span><span>Sh</span><span>Ya</span>
                        </div>

                        {/* Calendar Day Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                          {/* Row 1 */}
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-400">1 ☀️</div>
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-400">2 ☀️</div>
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-400">3 ☀️</div>
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-400">4 ☀️</div>
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-500">5 ⭐️</div>
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-500">6 ⭐️</div>
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-400">7 ☀️</div>

                          {/* Row 2 */}
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-400">8 ☀️</div>
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-400">9 ☀️</div>
                          {/* 10 - Kelmadi (Red) */}
                          <div className="p-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">10 ☀️</div>
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-400">11 ☀️</div>
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-500">12 ⭐️</div>
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-500">13 ⭐️</div>
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-400">14 ☀️</div>

                          {/* Row 3 */}
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-400">15 ☀️</div>
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-400">16 ☀️</div>
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-400">17 ☀️</div>
                          {/* 18 - Kelmadi (Red) */}
                          <div className="p-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">18 ☀️</div>
                          {/* 19 - Keldi (Green) */}
                          <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">19 ⭐️</div>
                          {/* 20 - Active Today (Blue ring) */}
                          <div
                            onClick={() => setSelectedDay(20)}
                            className={cn(
                              "p-1 rounded-lg text-blue-300 font-black cursor-pointer border-2",
                              selectedDay === 20 ? "bg-blue-600/30 border-blue-500" : "bg-slate-800/40 border-transparent"
                            )}
                          >
                            20 ⭐️
                          </div>
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-400">21 ☀️</div>

                          {/* Row 4 */}
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-400">22 ☀️</div>
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-400">23 ☀️</div>
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-400">24 ☀️</div>
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-400">25 🌙</div>
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-500">26 ⭐️</div>
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-500">27 ⭐️</div>
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-400">28 🌙</div>

                          {/* Row 5 */}
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-400">29 🌙</div>
                          <div className="p-1 rounded-lg bg-slate-800/40 text-slate-400">30 🌙</div>
                        </div>
                      </div>

                      {/* Selected Day Banner */}
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-800/40 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                            20 Sentabr, Yakshanba
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                            <span>🌴 Dam olish kuni</span>
                          </span>
                        </div>
                        <h5 className="text-xs font-black text-white">Dam olish kuningiz xayrli o&apos;tsin!</h5>
                        <p className="text-[10px] text-slate-300 leading-snug">
                          Grafik bo&apos;yicha bugun dam olish kuningiz. Vaqtingizni maroqli o&apos;tkazing!
                        </p>
                      </div>

                      {/* Davomat Foizi Card */}
                      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                            Davomat foizi
                          </span>
                          <span className="text-blue-400 font-mono">33%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 w-[33%]" />
                        </div>
                        <span className="text-[9px] text-slate-500 block">3 ta kun qayd etilgan</span>
                      </div>
                    </div>
                  )}

                  {/* SCREEN 3: MENING GRAFIGIM (Screenshot 3) */}
                  {activeTab === "schedule" && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      {/* Purple Hero Card */}
                      <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 text-white shadow-xl space-y-3 relative overflow-hidden">
                        <div className="absolute right-0 top-0 text-white/10 pointer-events-none">
                          <Sparkles className="w-28 h-28" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-200 block">
                          ✦ SHAXSIY ISH REJASI
                        </span>
                        <h4 className="text-xl font-black">Сентябр 2026</h4>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="px-3 py-1 rounded-xl bg-white/20 text-[10px] font-bold">
                            Joriy oy
                          </span>
                          <div className="flex items-center gap-1">
                            <button type="button" className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white">
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white">
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 4 Stats Cards */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block">Ish kunlari</span>
                            <span className="text-sm font-black text-white">22</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                            <Coffee className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block">Dam olish</span>
                            <span className="text-sm font-black text-white">8</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                            <Sun className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block">Kunduzgi</span>
                            <span className="text-sm font-black text-white">18</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                            <Moon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block">Kechki smena</span>
                            <span className="text-sm font-black text-white">4</span>
                          </div>
                        </div>
                      </div>

                      {/* Monthly Schedule Table Preview */}
                      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-white flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
                            Oylik ish grafiki taqvimi
                          </span>
                          <div className="flex items-center gap-2 text-[8px] text-slate-400">
                            <span>☀️ Kunduzgi</span>
                            <span>🌙 Kechki</span>
                            <span>🌴 Dam</span>
                          </div>
                        </div>

                        {/* Shift Times Sample */}
                        <div className="grid grid-cols-4 gap-1.5 text-center text-[9px]">
                          <div className="p-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                            <span className="font-bold text-amber-400 block">1 Sentabr</span>
                            <span className="text-[8px] text-slate-300">08:00 - 14:00</span>
                          </div>
                          <div className="p-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                            <span className="font-bold text-amber-400 block">2 Sentabr</span>
                            <span className="text-[8px] text-slate-300">08:00 - 15:00</span>
                          </div>
                          <div className="p-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                            <span className="font-bold text-amber-400 block">3 Sentabr</span>
                            <span className="text-[8px] text-slate-300">08:00 - 16:00</span>
                          </div>
                          <div className="p-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                            <span className="font-bold text-purple-400 block">25 Sentabr</span>
                            <span className="text-[8px] text-slate-300">20:00 - 08:00</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SCREEN 4: TA'TIL SO'ROVLARI (Screenshot 4) */}
                  {activeTab === "leaves" && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      {/* Hero Request Banner */}
                      <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-900/60 via-purple-950/40 to-slate-900 border border-indigo-700/40 space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300 block">
                          ✦ XODIM IMKONIYATLARI
                        </span>
                        <h4 className="text-base font-black text-white">Ta&apos;til so&apos;rovlari</h4>
                        <p className="text-[10px] text-slate-300 leading-snug">
                          Yillik va boshqa turdagi ta&apos;tillar uchun so&apos;rovlar yuboring va ularning holatini kuzatib boring.
                        </p>
                        <button
                          type="button"
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Yangi so&apos;rov</span>
                        </button>
                      </div>

                      {/* 3 Stats Counters */}
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[9px] text-slate-400 block">Jami so&apos;rovlar</span>
                          <span className="text-sm font-black text-white">0</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[9px] text-slate-400 block">Tasdiqlangan</span>
                          <span className="text-sm font-black text-emerald-400">0</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[9px] text-slate-400 block">Kutilayotgan</span>
                          <span className="text-sm font-black text-amber-400">0</span>
                        </div>
                      </div>

                      {/* Filter Tabs */}
                      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold">
                        {[
                          { id: "all", label: "Barchasi" },
                          { id: "pending", label: "Kutilmoqda" },
                          { id: "approved", label: "Tasdiqlangan" },
                          { id: "rejected", label: "Rad etilgan" },
                        ].map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setLeaveFilter(f.id as any)}
                            className={cn(
                              "flex-1 py-1 rounded-lg transition-all",
                              leaveFilter === f.id
                                ? "bg-blue-600 text-white"
                                : "text-slate-400 hover:text-white"
                            )}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      {/* Empty State Card */}
                      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 text-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-slate-800 text-blue-400 mx-auto flex items-center justify-center">
                          <Umbrella className="w-5 h-5" />
                        </div>
                        <h5 className="text-xs font-bold text-white">So&apos;rovlar topilmadi</h5>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          Sizda hali bu filtr bo&apos;yicha ta&apos;til so&apos;rovlari mavjud emas. Yangi ariza yuborish uchun tugmani bosing.
                        </p>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-[10px] font-bold text-blue-300"
                        >
                          Birinchi so&apos;rovni yaratish
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Screen Bottom Navigation Bar (Screenshot 1-4) ── */}
                <div className="px-2 py-2 border-t border-slate-800 bg-[#0a0e1a] flex items-center justify-around text-center">
                  {[
                    { id: "checkin", label: "Check-in", icon: ScanFace },
                    { id: "attendance", label: "Davomatim", icon: ClipboardList },
                    { id: "schedule", label: "Grafigim", icon: CalendarDays },
                    { id: "leaves", label: "Ta'til", icon: Palmtree },
                    { id: "payroll", label: "Maoshim", icon: Wallet, hasBadge: true },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          if (tab.id !== "payroll") {
                            setActiveTab(tab.id as any);
                          }
                        }}
                        className={cn(
                          "relative flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer",
                          isActive
                            ? "text-blue-400"
                            : "text-slate-500 hover:text-slate-300"
                        )}
                      >
                        <div className="relative">
                          <Icon className="w-4 h-4" />
                          {tab.hasBadge && (
                            <span className="absolute -bottom-1 -right-2 text-[10px]">🌴</span>
                          )}
                        </div>
                        <span className="text-[9px] font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
