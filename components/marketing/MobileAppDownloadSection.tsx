"use client";

import Link from "next/link";
import {
  ArrowRight,
  Download,
  Loader2,
  LogIn,
  Send,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  INSTALL_STEPS,
  sizeMb,
  useAppManifest,
  type InstallStepKey,
} from "@/lib/app-release";
import {
  APP_PAGE_LABEL,
  APP_PAGE_PATH,
  SUPPORT_BOT_URL,
} from "@/lib/contacts";
import { AppQrCode } from "./AppQrCode";

const STEP_ICON: Record<InstallStepKey, LucideIcon> = {
  download: Download,
  allow: ShieldCheck,
  protect: ShieldAlert,
  login: LogIn,
};

/**
 * Bosh sahifadagi "Xodimlar ilovasi" bo'limi: qanday yuklab olish,
 * o'rnatish va xodimlarga tarqatish. Batafsil yo'riqnoma — /ilova.
 */
export function MobileAppDownloadSection() {
  const m = useAppManifest();
  const latest = m.status === "ready" ? m.data?.latest : undefined;

  return (
    <section
      id="ilova"
      className="relative scroll-mt-20 border-t border-slate-100 bg-slate-50 py-20 text-slate-900 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#312E81] via-[#4F46E5] to-[#7C3AED] p-6 text-white shadow-2xl shadow-indigo-900/20 sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-400/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-indigo-300/25 blur-3xl" />

          <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
            {/* ── Chap: matn, qadamlar, tugmalar ── */}
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
                <Smartphone className="h-3.5 w-3.5" />
                Xodimlar ilovasi · Android
              </span>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                Ilova 1 daqiqada o&apos;rnatiladi
              </h2>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-indigo-100">
                Play Market kerak emas: xodim telefonida{" "}
                <b className="text-white">{APP_PAGE_LABEL}</b> ni ochadi,
                yuklab oladi va muassasa bergan login bilan kiradi.
              </p>

              <ol className="mt-7 grid gap-3 sm:grid-cols-2">
                {INSTALL_STEPS.map((s, i) => {
                  const Icon = STEP_ICON[s.key];
                  return (
                    <li
                      key={s.key}
                      className="flex gap-3.5 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
                    >
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/15">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold">
                          <span className="text-indigo-200">{i + 1}. </span>
                          {s.title}
                        </p>
                        <p className="mt-1 text-[13px] leading-relaxed text-indigo-100/90">
                          {s.text}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                {m.status === "loading" ? (
                  <span className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white/90 px-6 text-sm font-extrabold text-indigo-700">
                    <Loader2 className="h-4 w-4 animate-spin" /> Tekshirilmoqda…
                  </span>
                ) : latest ? (
                  <a
                    href={latest.url}
                    download
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-extrabold text-indigo-700 shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-50 active:scale-[0.98]"
                  >
                    <Download className="h-4 w-4" strokeWidth={2.5} />
                    Android uchun yuklab olish
                  </a>
                ) : null}
                <Link
                  href={APP_PAGE_PATH}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 text-sm font-bold text-white transition hover:bg-white/20"
                >
                  To&apos;liq yo&apos;riqnoma
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              {latest ? (
                <p className="mt-3 text-[12.5px] font-medium text-indigo-100/90">
                  Versiya {latest.version} · {sizeMb(latest.size)} · Android
                  7.0+ · Bepul
                </p>
              ) : null}
            </div>

            {/* ── O'ng: QR va rahbarlar uchun maslahat ── */}
            <div className="flex flex-col gap-4 lg:col-span-5 lg:items-end">
              <div className="hidden w-full max-w-[300px] rounded-[28px] bg-white p-6 text-center text-slate-900 shadow-2xl shadow-indigo-950/30 md:block lg:self-end">
                <AppQrCode className="mx-auto h-[200px] w-[200px]" />
                <p className="mt-4 text-[15px] font-extrabold">
                  Telefon kamerasi bilan skanerlang
                </p>
                <p className="mt-1 text-[12.5px] leading-snug text-slate-500">
                  yoki brauzerda <b>{APP_PAGE_LABEL}</b> ni oching
                </p>
              </div>

              <div className="w-full rounded-2xl border border-white/15 bg-white/10 p-5 lg:max-w-[300px]">
                <p className="flex items-center gap-2 text-sm font-extrabold">
                  <Users className="h-4 w-4" /> Xodimlarga qanday tarqatiladi
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-indigo-100/90">
                  Havolani yoki QR kodni jamoa guruhiga yuboring. Telegram
                  yordamchimizda <b className="text-white">/ilova</b> buyrug&apos;i
                  ham yuklab olish havolasini beradi.
                </p>
                <a
                  href={SUPPORT_BOT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-white underline-offset-2 hover:underline"
                >
                  <Send className="h-3.5 w-3.5" /> Telegram yordamchini ochish
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
