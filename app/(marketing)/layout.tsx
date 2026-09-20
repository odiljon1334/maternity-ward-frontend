import type { Metadata } from "next";
import { TrackingScripts } from "@/components/marketing/TrackingScripts";

export const metadata: Metadata = {
  title: "StaffPulse — Universal Xodimlar Davomati, Face ID & Smart Kadrlar Tizimi",
  description:
    "Har qanday korxona, ofis, ishlab chiqarish va klinikalar (MaternityCare) uchun Face ID davomat tizimi. O'z logotipingiz bilan White-Label, 24/7 smenalar, avtomatlashtirilgan T-13 tabel va Telegram bot.",
  keywords: [
    "davomat tizimi",
    "face id davomat uzbekistan",
    "xodimlar davomati",
    "white label hr",
    "tabel dasturi",
    "tibbiyot davomati",
    "MaternityCare",
    "StaffPulse",
    "biometrik terminal",
  ],
  openGraph: {
    title: "StaffPulse — Korxonalar va Klinikalar Uchun Face ID Davomat Ekotizimi",
    description:
      "Universal Face ID terminallar, White-Label brending, 24/7 smenalar, oylik tabel va ish haqi avtomatizatsiyasi. 14 kun bepul sinab ko'ring!",
    type: "website",
    locale: "uz_UZ",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      <TrackingScripts />
      <div className="flex-1">{children}</div>
    </div>
  );
}
