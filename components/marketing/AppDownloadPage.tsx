"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  Inbox,
  Loader2,
  LogIn,
  ScanFace,
  Send,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { AppQrCode } from "./AppQrCode";

type Manifest = {
  latest: {
    version: string;
    build: number;
    url: string;
    sha256: string;
    size: number;
    publishedAt: string;
    notes: string[];
  };
  minSupportedBuild: number;
};

const MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];
const dateUz = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()}-${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
const mb = (bytes: number) =>
  `${(bytes / 1024 / 1024).toFixed(1).replace(".0", "")} MB`;

const SUPPORT_TELEGRAM = "https://t.me/StaffPlusPRO_Support_bot";

const STEPS = [
  {
    icon: Download,
    title: "Yuklab oling",
    text: "«Android uchun yuklab olish» tugmasini bosing. Fayl telefoningizga saqlanadi.",
  },
  {
    icon: ShieldCheck,
    title: "O'rnatishga ruxsat bering",
    text: "Telefon «Noma'lum manbalardan o'rnatish»ni so'rasa — brauzer uchun «Ruxsat berish»ni yoqing. Bu bir martalik.",
  },
  {
    icon: ShieldAlert,
    title: "Play Protect ogohlantirsa",
    text: "Ilova Play Market'dan emasligi uchun ogohlantirish chiqishi mumkin: «Batafsil» → «Baribir o'rnatish» ni bosing.",
  },
  {
    icon: LogIn,
    title: "Kiring",
    text: "Ilovani oching va muassasangiz bergan login va parol bilan kiring.",
  },
];

const FEATURES = [
  {
    icon: ScanFace,
    title: "Selfi va GPS bilan kelish",
    text: "Ish joyida ekaningiz va o'zingiz ekaningiz bir bosishda tasdiqlanadi.",
  },
  {
    icon: CalendarDays,
    title: "Ish grafigi",
    text: "Keyingi smena, oy bo'yicha ish kunlari va dam olish kunlari.",
  },
  {
    icon: Inbox,
    title: "So'rovlar",
    text: "Ta'til, «Kechikaman» xabari va hamkasb bilan smena almashish.",
  },
  {
    icon: Send,
    title: "Telegram eslatmalari",
    text: "Ish boshlanishidan 30 daqiqa oldin eslatma, kelish-ketish xabari.",
  },
];

const FAQ = [
  {
    q: "Login va parolni qayerdan olaman?",
    a: "Muassasangiz administratori yoki kadrlar bo'limi beradi. Parolni unutgan bo'lsangiz, ilovadagi «Parolni unutdingizmi?» havolasidan foydalaning.",
  },
  {
    q: "Ilova qanday yangilanadi?",
    a: "Yangi versiya chiqqanda ilovaning o'zi xabar beradi — «Yangilash» tugmasini bossangiz, shu sahifadagi kabi o'rnatiladi. Ma'lumotlaringiz saqlanib qoladi.",
  },
  {
    q: "Joylashuvim doim kuzatiladimi?",
    a: "Yo'q. Joylashuv faqat ish vaqtida — kelishni belgilaganingizdan ketishni belgilaguningizcha yuboriladi. Bu vaqtda bildirishnoma panelida «StaffPlusPRO — Ish vaqti» yozuvi turadi.",
  },
  {
    q: "Qaysi telefonlarda ishlaydi?",
    a: "Android 7.0 va undan yangi telefonlarda. iPhone versiyasi tayyorlanmoqda — hozircha iPhone'da clinicuk24.com saytidan foydalanishingiz mumkin.",
  },
  {
    q: "Xiaomi/Redmi telefonimda kuzatuv to'xtab qolyapti",
    a: "Sozlamalar → Ilovalar → StaffPlusPRO → Batareya → «Cheklovsiz» ni tanlang. Ilova ham birinchi ochilganda buni ko'rsatadi.",
  },
];

function useManifest() {
  const [state, setState] = useState<{
    status: "loading" | "ready" | "none";
    data?: Manifest;
  }>({ status: "loading" });
  useEffect(() => {
    let alive = true;
    fetch("/app/android/latest.json", { cache: "no-store" })
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(String(r.status))),
      )
      .then(
        (data: Manifest) =>
          alive &&
          setState({ status: data?.latest?.url ? "ready" : "none", data }),
      )
      .catch(() => alive && setState({ status: "none" }));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

function usePlatform() {
  const [p, setP] = useState<"android" | "ios" | "desktop">("android");
  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) setP("ios");
    else if (
      !/Android/i.test(ua) &&
      window.matchMedia("(min-width: 768px)").matches
    )
      setP("desktop");
  }, []);
  return p;
}

export function AppDownloadPage() {
  const m = useManifest();
  const platform = usePlatform();
  const latest = m.data?.latest;

  const download =
    m.status === "loading" ? (
      <span className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white/90 px-6 text-base font-extrabold text-indigo-700 sm:w-auto">
        <Loader2 className="h-5 w-5 animate-spin" /> Tekshirilmoqda…
      </span>
    ) : m.status === "ready" && latest ? (
      <a
        href={latest.url}
        download
        className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-white px-7 text-base font-extrabold text-indigo-700 shadow-[0_14px_30px_rgba(15,18,34,0.28)] transition active:scale-[0.98] hover:bg-indigo-50 sm:w-auto"
      >
        <Download className="h-5 w-5" strokeWidth={2.5} /> Android uchun yuklab
        olish
      </a>
    ) : (
      <span className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white/20 px-6 text-base font-bold text-white/90 sm:w-auto">
        Ilova tez orada chiqadi
      </span>
    );

  return (
    <div className="ci font-jakarta min-h-screen bg-[var(--ci-bg)] text-[var(--ci-ink)]">
      {/* ── Qahramon ── */}
      <header className="relative overflow-hidden rounded-b-[36px] bg-gradient-to-br from-[#312E81] via-[#4F46E5] to-[#7C3AED] pb-12 pt-8 text-white md:pb-16 md:pt-10">
        <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-violet-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl" />

        <div className="relative mx-auto flex max-w-5xl flex-col gap-10 px-5 sm:px-10 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-white/15">
                <Activity className="h-6 w-6" strokeWidth={2.4} />
              </span>
              <span className="text-xl font-extrabold tracking-tight">
                StaffPlusPRO
              </span>
            </Link>

            <div className="mt-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[13px] font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />{" "}
                Xodimlar ilovasi · Android
              </span>
            </div>
            <h1 className="mt-4 text-[34px] font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
              Ish kuningiz — <br className="hidden sm:block" />
              bitta ilovada
            </h1>
            <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-indigo-100">
              Kelish va ketish, ish grafigi, ta&apos;til va smena almashish
              so&apos;rovlari — hammasi telefoningizda.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              {download}
            </div>
            {m.status === "none" ? (
              <p className="mt-3 text-[13px] font-medium text-indigo-100/90">
                Birinchi versiya shu sahifada paydo bo&apos;ladi — muassasangiz
                xabar beradi.
              </p>
            ) : null}
            {latest ? (
              <p className="mt-3 text-[13px] font-medium text-indigo-100/90">
                Versiya {latest.version} · {mb(latest.size)} ·{" "}
                {dateUz(latest.publishedAt)} · Android 7.0+
              </p>
            ) : null}

            {platform === "ios" ? (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 text-[13.5px] leading-relaxed">
                <Smartphone className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <span>
                  iPhone uchun versiya tayyorlanmoqda. Hozircha{" "}
                  <Link
                    href="/login"
                    className="font-bold underline underline-offset-2"
                  >
                    clinicuk24.com
                  </Link>{" "}
                  orqali kirishingiz mumkin.
                </span>
              </div>
            ) : null}
          </div>

          {/* Kompyuterdan ochilganda — telefon bilan skanerlash uchun QR */}
          <div className={platform === "desktop" ? "block" : "hidden md:block"}>
            <div className="w-[260px] rounded-[28px] bg-white p-5 text-center text-[var(--ci-ink)] shadow-[0_24px_60px_rgba(15,18,34,0.35)]">
              <AppQrCode className="mx-auto h-[200px] w-[200px]" />
              <p className="mt-4 text-[15px] font-extrabold">
                Telefonda oching
              </p>
              <p className="mt-1 text-[12.5px] leading-snug text-[var(--ci-muted)]">
                Telefon kamerasi bilan skanerlang yoki{" "}
                <b>clinicuk24.com/ilova</b> ni yozing
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-12 px-5 py-12 sm:px-10">
        {/* ── O'rnatish ── */}
        <section>
          <h2 className="text-[22px] font-extrabold tracking-tight">
            O&apos;rnatish — 1 daqiqa
          </h2>
          <p className="mt-1 text-[14px] text-[var(--ci-muted)]">
            Ilova hozircha Play Market&apos;da emas, shu sahifadan
            o&apos;rnatiladi.
          </p>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="flex gap-4 rounded-[20px] border border-[var(--ci-border)] bg-[var(--ci-card)] p-4 sm:block sm:p-5"
              >
                <div className="flex flex-shrink-0 items-center gap-3 self-start">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ci-indigo-tint)] text-[var(--ci-indigo-text)]">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="hidden text-[12px] font-extrabold uppercase tracking-wide text-[var(--ci-faint)] sm:inline">
                    {i + 1}-qadam
                  </span>
                </div>
                <div className="min-w-0 sm:mt-4">
                  <p className="text-[15px] font-extrabold">
                    <span className="text-[var(--ci-indigo-text)] sm:hidden">
                      {i + 1}.{" "}
                    </span>
                    {s.title}
                  </p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ci-muted)] sm:mt-1.5">
                    {s.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Imkoniyatlar ── */}
        <section>
          <h2 className="text-[22px] font-extrabold tracking-tight">
            Ilovada nimalar bor
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex gap-4 rounded-[20px] border border-[var(--ci-border)] bg-[var(--ci-card)] p-5"
              >
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[13px] bg-[var(--ci-teal-tint)] text-[var(--ci-teal-text)]">
                  <f.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[15px] font-extrabold">{f.title}</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ci-muted)]">
                    {f.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Yangiliklar ── */}
        {latest?.notes?.length ? (
          <section className="rounded-[24px] border border-[var(--ci-border)] bg-[var(--ci-card)] p-6">
            <h2 className="text-[17px] font-extrabold">
              Versiya {latest.version} — nima yangi
            </h2>
            <ul className="mt-3 space-y-2">
              {latest.notes.map((n) => (
                <li key={n} className="flex items-start gap-2.5 text-[14px]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--ci-teal-text)]" />{" "}
                  {n}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ── Savollar ── */}
        <section>
          <h2 className="text-[22px] font-extrabold tracking-tight">
            Ko&apos;p beriladigan savollar
          </h2>
          <div className="mt-5 divide-y divide-[var(--ci-border)] overflow-hidden rounded-[20px] border border-[var(--ci-border)] bg-[var(--ci-card)]">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-bold">
                  {f.q}
                  <ChevronDown className="h-5 w-5 flex-shrink-0 text-[var(--ci-muted)] transition group-open:rotate-180" />
                </summary>
                <p className="mt-2.5 text-[14px] leading-relaxed text-[var(--ci-muted)]">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Xavfsizlik ── */}
        {latest ? (
          <section className="rounded-[20px] bg-[var(--ci-soft)] p-5 text-[13px] leading-relaxed text-[var(--ci-muted)]">
            <p className="flex items-center gap-2 font-bold text-[var(--ci-ink)]">
              <ShieldCheck className="h-4 w-4 text-[var(--ci-teal-text)]" />{" "}
              Ilovani faqat shu sahifadan yuklab oling
            </p>
            <p className="mt-1.5">
              Boshqa joydan (Telegram guruhlar, noma&apos;lum saytlar) olingan
              fayllarga ishonmang. Fayl nazorat yig&apos;indisi (SHA-256):
            </p>
            <code className="mt-2 block break-all rounded-xl bg-[var(--ci-card)] px-3 py-2 font-mono text-[11.5px] text-[var(--ci-ink)]">
              {latest.sha256}
            </code>
          </section>
        ) : null}
      </main>

      <footer className="border-t border-[var(--ci-border)] px-5 py-8 text-center text-[13px] text-[var(--ci-muted)]">
        <p>
          Yordam kerakmi?{" "}
          <a
            href={SUPPORT_TELEGRAM}
            className="font-bold text-[var(--ci-indigo-text)]"
            target="_blank"
            rel="noopener noreferrer"
          >
            Telegram orqali yozing
          </a>
        </p>
        <p className="mt-2">
          © StaffPlusPRO ·{" "}
          <Link href="/" className="underline underline-offset-2">
            clinicuk24.com
          </Link>
        </p>
      </footer>
    </div>
  );
}
