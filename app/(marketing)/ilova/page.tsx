import type { Metadata } from "next";
import { AppDownloadPage } from "@/components/marketing/AppDownloadPage";

export const metadata: Metadata = {
  title: "StaffPlusPRO ilovasi — Android uchun yuklab olish",
  description:
    "Xodimlar uchun StaffPlusPRO mobil ilovasi: selfi va GPS bilan kelish-ketish, ish grafigi, ta'til va smena almashish so'rovlari, Telegram eslatmalari.",
  openGraph: {
    title: "StaffPlusPRO ilovasi — Android",
    description: "Kelish-ketish, grafik va so'rovlar — telefoningizda.",
    type: "website",
    locale: "uz_UZ",
  },
};

export default function IlovaPage() {
  return <AppDownloadPage />;
}
