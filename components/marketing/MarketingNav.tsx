"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Menu,
  X,
  ArrowRight,
  ScanFace,
  Play,
  Video,
  Sparkles,
  CreditCard,
  HelpCircle,
  LogIn,
  Layers,
  MessageSquare,
  Building2,
  Calculator,
  FileSpreadsheet,
  Users,
  ChevronDown,
  MapPin,
} from "lucide-react";

interface MarketingNavProps {
  onOpenDemo: () => void;
  onOpenTrial: () => void;
  onOpenTutorials?: () => void;
}

export function MarketingNav({ onOpenDemo, onOpenTrial, onOpenTutorials }: MarketingNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const [integrationsMenuOpen, setIntegrationsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 dark:bg-slate-950/90 backdrop-blur-md shadow-xs border-b border-slate-200/80 dark:border-slate-800/80 py-2.5 sm:py-3"
            : "bg-transparent py-3 sm:py-5"
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 lg:gap-3">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-xl tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                  StaffPlus
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 shrink-0">
                  PRO
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 hidden 2xl:block whitespace-nowrap">
                Universal Davomat &amp; Smart HR Ekotizimi
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links (Clean, grouped SaaS layout that never overflows) */}
          <nav className="hidden xl:flex items-center gap-1.5 2xl:gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {/* Tizim Imkoniyatlari Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setSystemMenuOpen(true)}
              onMouseLeave={() => setSystemMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setSystemMenuOpen(!systemMenuOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Imkoniyatlar</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${systemMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {systemMenuOpen && (
                <div className="absolute left-0 top-full pt-1.5 w-60 z-50">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    <a
                      href="/#features"
                      onClick={() => setSystemMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors"
                    >
                      <Layers className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <div className="font-semibold">Asosiy funksiyalar</div>
                        <div className="text-[10px] text-slate-400 font-normal">HR &amp; avtomatlashgan davomat</div>
                      </div>
                    </a>
                    <a
                      href="/#kiosk-mode"
                      onClick={() => setSystemMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors"
                    >
                      <ScanFace className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div>
                        <div className="font-semibold text-blue-600 dark:text-blue-400">Planshet Kiosk</div>
                        <div className="text-[10px] text-slate-400 font-normal">Yuzni tanish plansheti</div>
                      </div>
                    </a>
                    <a
                      href="/#live-map"
                      onClick={() => setSystemMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">Live Xarita</div>
                        <div className="text-[10px] text-slate-400 font-normal">Check-in geofencing</div>
                      </div>
                    </a>
                    <a
                      href="/dashboard/operations"
                      onClick={() => setSystemMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors"
                    >
                      <Video className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <div className="font-semibold text-blue-600 dark:text-blue-400">Filiallar &amp; Meet</div>
                        <div className="text-[10px] text-slate-400 font-normal">Direktorlar kengashi &amp; SOS</div>
                      </div>
                    </a>
                    <a
                      href="/#roi-calculator"
                      onClick={() => setSystemMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-colors"
                    >
                      <Calculator className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">ROI Hisobi</div>
                        <div className="text-[10px] text-slate-400 font-normal">Iqtisodiy foydani hisoblash</div>
                      </div>
                    </a>
                    <a
                      href="/#cases"
                      onClick={() => setSystemMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <div className="font-semibold">Muvaffaqiyat keyslari</div>
                        <div className="text-[10px] text-slate-400 font-normal">Real korxonalar tajribasi</div>
                      </div>
                    </a>
                  </div>
                </div>
              )}
            </div>

            <a
              href="/#industries"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              Sohalar
            </a>

            {/* Integratsiyalar & Uskunalar Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setIntegrationsMenuOpen(true)}
              onMouseLeave={() => setIntegrationsMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIntegrationsMenuOpen(!integrationsMenuOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Integratsiya</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${integrationsMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {integrationsMenuOpen && (
                <div className="absolute left-0 top-full pt-1.5 w-60 z-50">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    <a
                      href="/#terminals"
                      onClick={() => setIntegrationsMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors"
                    >
                      <ScanFace className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <div className="font-semibold">Face ID &amp; Turniketlar</div>
                        <div className="text-[10px] text-slate-400 font-normal">Hikvision va boshqa terminallar</div>
                      </div>
                    </a>
                    <a
                      href="/#integrations"
                      onClick={() => setIntegrationsMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors"
                    >
                      <Activity className="w-4 h-4 text-teal-500 shrink-0" />
                      <div>
                        <div className="font-semibold">1C &amp; ERP Tizimlari</div>
                        <div className="text-[10px] text-slate-400 font-normal">Avtomatik oylik va tabel</div>
                      </div>
                    </a>
                    <a
                      href="/#whitelabel"
                      onClick={() => setIntegrationsMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div>
                        <div className="font-semibold">White-Label</div>
                        <div className="text-[10px] text-slate-400 font-normal">O&apos;z brendingiz ostida</div>
                      </div>
                    </a>
                    <a
                      href="/#faq"
                      onClick={() => setIntegrationsMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <div className="font-semibold">Ko&apos;p beriladigan savollar</div>
                        <div className="text-[10px] text-slate-400 font-normal">FAQ &amp; xavfsizlik</div>
                      </div>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Video Tutorial Link */}
            {onOpenTutorials ? (
              <button
                type="button"
                onClick={onOpenTutorials}
                className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold transition-colors cursor-pointer whitespace-nowrap px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Video Qo&apos;llanma</span>
              </button>
            ) : (
              <Link
                href="/video-qollanma"
                className={`flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold transition-colors whitespace-nowrap px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 ${
                  pathname === "/video-qollanma" ? "underline" : ""
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Video Qo&apos;llanma</span>
              </Link>
            )}

            <Link
              href="/tariflar"
              className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 ${
                pathname === "/tariflar" ? "text-blue-600 dark:text-blue-400 font-bold" : ""
              }`}
            >
              Tariflar
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Demo Button */}
            <button
              onClick={onOpenDemo}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/90 dark:hover:bg-slate-700/80 border border-slate-300/80 dark:border-slate-700 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0"
              title="Jonli interaktiv demo tizimini ko'rish"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-blue-400"></span>
              </span>
              <Play className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400 shrink-0" />
              <span>Demo ko&apos;rish</span>
            </button>

            {/* Login Link */}
            <Link
              href="/login"
              className="hidden lg:inline-flex px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0"
            >
              Tizimga kirish
            </Link>

            {/* Trial CTA Button */}
            <button
              onClick={onOpenTrial}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all hover:gap-2 cursor-pointer whitespace-nowrap shrink-0"
              title="14 kunlik sinovni boshlash"
            >
              <span>14 kunlik sinov</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
            </button>

            {/* Mobile / Tablet Hamburger Toggle (Shown on all screens < xl) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="xl:hidden p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer shrink-0 ml-0.5"
              aria-label="Menyuni ochish"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Modern Mobile Slide-Over Drawer with Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content panel */}
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between p-5 sm:p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-base text-slate-900 dark:text-white">
                        StaffPlus
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        PRO
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">Universal HR &amp; Davomat</p>
                  </div>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Menyuni yopish"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="py-5 space-y-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3">
                    Asosiy Bo&apos;limlar
                  </span>

                  <a
                    href="/#features"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <Layers className="w-4 h-4 text-blue-500" />
                    <span>Imkoniyatlar</span>
                  </a>

                  <a
                    href="/#industries"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-indigo-500" />
                    <span>Sohaviy Yechimlar</span>
                  </a>

                  <a
                    href="/#kiosk-mode"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                  >
                    <ScanFace className="w-4 h-4 text-blue-500" />
                    <span>Planshet Kiosk (0 so&apos;m)</span>
                  </a>

                  <a
                    href="/dashboard/operations"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                  >
                    <Video className="w-4 h-4 text-blue-500" />
                    <span>Filiallar &amp; Majlis (Meet / SOS)</span>
                  </a>

                  <a
                    href="/#cases"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <Users className="w-4 h-4 text-amber-500" />
                    <span>O&apos;zbekiston Keyslari</span>
                  </a>

                  <a
                    href="/#roi-calculator"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>ROI &amp; Tejamkorlik</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                      Kalkulyator
                    </span>
                  </a>

                  <a
                    href="/#integrations"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-red-500" />
                    <span>1C &amp; Mehnat.uz Integratsiya</span>
                  </a>

                  <a
                    href="/#whitelabel"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>White-Label Studio</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                      O&apos;z brendingiz
                    </span>
                  </a>

                  <a
                    href="/#terminals"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <ScanFace className="w-4 h-4 text-indigo-500" />
                    <span>Face ID Integratsiyasi (1-2 ta)</span>
                  </a>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3">
                    Ta&apos;lim va Tariflar
                  </span>

                  {onOpenTutorials ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenTutorials();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Video className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Video Qo&apos;llanmalar</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                        5 dars
                      </span>
                    </button>
                  ) : (
                    <Link
                      href="/video-qollanma"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Video className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Video Qo&apos;llanmalar</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                        5 dars
                      </span>
                    </Link>
                  )}

                  <Link
                    href="/tariflar"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-teal-500" />
                    <span>Tariflar va Kalkulyator</span>
                  </Link>

                  <a
                    href="/#faq"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>Ko&apos;p beriladigan savollar (FAQ)</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDemo();
                }}
                className="w-full py-3 px-4 rounded-xl border border-slate-300/80 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                <span>Interaktiv Demo Ko&apos;rish</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenTrial();
                }}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>14 kunlik sinovni boshlash</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Mavjud akkaunt bilan kirish</span>
              </Link>

              <div className="pt-2 text-center">
                <a
                  href="https://t.me/StaffPlusPROSupportBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-blue-500 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                  <span>Telegram orqali savol berish</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
