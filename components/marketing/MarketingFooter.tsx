"use client";

import Link from "next/link";
import { Activity, Phone, MapPin, Send } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                <Activity className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                StaffPlus <span className="text-blue-400">PRO</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Universal xodimlar davomati va Smart HR ekotizimi. Har bir korxona o&apos;z logosi va nomida (White-Label) ishlaydi. Tug&apos;ruqxona va klinikalar uchun maxsus MaternityCare tibbiy moduli mavjud.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
                Universal Face ID
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
                CLICK &bull; Payme
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
                Didox E-Faktura
              </span>
            </div>
          </div>

          {/* Links 1: Platforma */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm">Platforma</h4>
            <ul className="space-y-2">
              <li>
                <a href="/#features" className="hover:text-white transition-colors">
                  Imkoniyatlar
                </a>
              </li>
              <li>
                <a href="/#whitelabel" className="hover:text-white transition-colors text-blue-400">
                  White-Label Studio
                </a>
              </li>
              <li>
                <a href="/#terminals" className="hover:text-white transition-colors">
                  Face ID &amp; Terminallar
                </a>
              </li>
              <li>
                <Link href="/video-qollanma" className="hover:text-white transition-colors text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span>Video Qo&apos;llanmalar</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300">5 dars</span>
                </Link>
              </li>
              <li>
                <Link href="/tariflar" className="hover:text-white transition-colors">
                  Tariflar jadvali
                </Link>
              </li>
              <li>
                <a href="/#faq" className="hover:text-white transition-colors">
                  FAQ (Savollar)
                </a>
              </li>
            </ul>
          </div>

          {/* Links 2: Modullar */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm">Sohaviy Modullar</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-slate-300 font-medium">MaternityCare (Klinikalar)</span>
              </li>
              <li>
                <span className="text-slate-400">Industry &amp; Zavodlar</span>
              </li>
              <li>
                <span className="text-slate-400">Corporate &amp; IT Ofislar</span>
              </li>
              <li>
                <span className="text-slate-400">Retail &amp; Savdo tarmoqlari</span>
              </li>
              <li>
                <span className="text-slate-400">Campus &amp; Ta&apos;lim</span>
              </li>
            </ul>
          </div>

          {/* Contact Col */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm">Aloqa &amp; Yordam</h4>
            <div className="space-y-2.5">
              <a
                href="tel:+998955775454"
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>+998 95 577 54 54</span>
              </a>
              <a
                href="https://t.me/StaffPlusPRO_Support_bot"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Telegram: @StaffPlusPRO_Support_bot</span>
              </a>
              <div className="flex items-start gap-2 text-slate-400 text-[11px] pt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>Andijon shahri, O&apos;zbekiston</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-xs">
          <p>© {new Date().getFullYear()} StaffPlusPRO. Barcha huquqlar himoyalangan.</p>
          <div className="flex items-center gap-6 text-[11px] text-slate-400">
            <Link href="/tariflar" className="hover:text-slate-200 transition-colors">Tariflar</Link>
            <Link href="/video-qollanma" className="hover:text-slate-200 transition-colors">Qo&apos;llanmalar</Link>
            <Link href="/login" className="hover:text-slate-200 transition-colors">Tizimga kirish</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
