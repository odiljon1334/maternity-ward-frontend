"use client";

import { useEffect, useState } from "react";

/**
 * Android ilova relizi haqidagi ma'lumot — serverdagi
 * `/app/android/latest.json` (scripts/release-android.sh yozadi).
 * /ilova sahifasi va bosh sahifadagi ilova bo'limi shu bitta manbadan o'qiydi.
 */
export type AppManifest = {
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

export type ManifestState = {
  status: "loading" | "ready" | "none";
  data?: AppManifest;
};

export function useAppManifest(): ManifestState {
  const [state, setState] = useState<ManifestState>({ status: "loading" });
  useEffect(() => {
    let alive = true;
    fetch("/app/android/latest.json", { cache: "no-store" })
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(String(r.status))),
      )
      .then(
        (data: AppManifest) =>
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

export const dateUz = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()}-${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const sizeMb = (bytes: number) =>
  `${(bytes / 1024 / 1024).toFixed(1).replace(".0", "")} MB`;

/** Qurilma turi: kompyuterda QR, iPhone'da izoh ko'rsatiladi */
export function useDevicePlatform() {
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

/** O'rnatish qadamlari — matn bitta joyda, ikonkalar komponentda */
export const INSTALL_STEPS = [
  {
    key: "download",
    title: "Yuklab oling",
    text: "«Android uchun yuklab olish» tugmasini bosing. Fayl telefoningizga saqlanadi.",
  },
  {
    key: "allow",
    title: "O'rnatishga ruxsat bering",
    text: "Telefon «Noma'lum manbalardan o'rnatish»ni so'rasa — brauzer uchun «Ruxsat berish»ni yoqing. Bu bir martalik.",
  },
  {
    key: "protect",
    title: "Play Protect ogohlantirsa",
    text: "Ilova Play Market'dan emasligi uchun ogohlantirish chiqishi mumkin: «Batafsil» → «Baribir o'rnatish» ni bosing.",
  },
  {
    key: "login",
    title: "Kiring va sozlang",
    text: "Muassasangiz bergan login va parol bilan kiring. Ilova joylashuv, kamera va batareya ruxsatlarini o'zi so'raydi.",
  },
] as const;

export type InstallStepKey = (typeof INSTALL_STEPS)[number]["key"];
