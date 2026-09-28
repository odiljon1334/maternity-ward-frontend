import type { Metadata } from "next";
import { TrackingScripts } from "@/components/marketing/TrackingScripts";

export const metadata: Metadata = {
  title: "StaffPlusPRO — Universal Xodimlar Davomati, Face ID & Smart Kadrlar Tizimi",
  description:
    "Muassasa va tashkilotlar uchun Face ID va mobil davomat, 24/7 smenalar, T-13 Excel hisobotlari, ish haqi hisobi va Telegram bildirishnomalari.",
  keywords: [
    "davomat tizimi",
    "face id davomat uzbekistan",
    "xodimlar davomati",
    "white label hr",
    "tabel dasturi",
    "tibbiyot davomati",
    "MaternityCare",
    "StaffPlusPRO",
    "biometrik terminal",
  ],
  openGraph: {
    title: "StaffPlusPRO — Korxonalar va Klinikalar Uchun Face ID Davomat Ekotizimi",
    description:
      "Face ID terminallar, Android ilova, iPhone veb kabineti, 24/7 smenalar, T-13 Excel va ish haqi hisobi. Sinov uchun ariza qoldiring.",
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
