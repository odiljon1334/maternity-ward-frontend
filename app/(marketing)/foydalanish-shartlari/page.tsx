import type { Metadata } from "next";
import { LegalDocumentPage, type LegalSection } from "@/components/marketing/LegalDocumentPage";

export const metadata: Metadata = {
  title: "Foydalanish shartlari",
  description: "StaffPlusPRO xizmatidan foydalanish qoidalari va tomonlarning mas'uliyati.",
};

const sections: LegalSection[] = [
  {
    title: "Xizmat",
    paragraphs: [
      "StaffPlusPRO muassasalarga xodimlar davomatini, ish grafiklarini, hisobot va hisob-kitoblarni boshqarish uchun dasturiy platforma beradi. Ayrim funksiyalar tarif, muassasa sozlamasi, qurilma turi va alohida integratsiya shartlariga bog'liq.",
    ],
  },
  {
    title: "Hisob va vakolat",
    items: [
      "Login ma'lumotlarini boshqa shaxsga bermang va qurilmani himoyalang.",
      "Administrator faqat o'ziga biriktirilgan muassasa va ruxsat etilgan amallar doirasida ishlashi kerak.",
      "Xodim boshqa shaxs nomidan check-in, selfi yoki smena tasdig'ini yubormasligi kerak.",
      "Shubhali kirish yoki noto'g'ri ma'lumot aniqlansa darhol administratorga xabar bering.",
    ],
  },
  {
    title: "Davomat, grafik va hisob-kitob",
    paragraphs: [
      "Tizim terminal, mobil qurilma va rahbar kiritgan ma'lumotlar asosida hisoblaydi. Yakuniy tabel, ish haqi, bonus, jarima, avans va mehnatga oid qarorlar vakolatli muassasa xodimi tomonidan tekshirilishi va tasdiqlanishi kerak. Platforma mustaqil yuridik, soliq yoki buxgalteriya maslahati bermaydi.",
    ],
  },
  {
    title: "GPS va kamera ruxsatlari",
    paragraphs: [
      "Mobil davomatda joylashuv ish joyi hududini, kamera esa check-in qilayotgan shaxsni tekshirish uchun ishlatiladi. Ruxsat berilmasa tegishli mobil funksiya ishlamasligi mumkin. Kuzatuv faol bo'lgan payt va uning chegaralari maxfiylik siyosatida bayon qilingan.",
    ],
  },
  {
    title: "Integratsiyalar va mavjudlik",
    paragraphs: [
      "Telegram, email, to'lov, xarita, Face Match va terminal xizmatlari uchinchi tomon tizimlariga bog'liq bo'lishi mumkin. T-13 Excel eksporti mavjud; 1C, Didox, MedSoft yoki boshqa tizimlarga to'g'ridan-to'g'ri API ulanishi faqat alohida tasdiqlangan loyiha bo'lsa taqdim etiladi.",
      "Rejalashtirilgan texnik ishlar, internet yoki provayder uzilishi vaqtincha ta'sir qilishi mumkin. Kritik davomat oqimlari uchun monitoring va tiklash choralari qo'llanadi, biroq uzluksizlikning mutlaq kafolati berilmaydi.",
    ],
  },
  {
    title: "Sinov va to'lov",
    paragraphs: [
      "Sinov uchun yuborilgan ariza avtomatik ravishda faol tenant yoki pullik hisob yaratmaydi. Operator talablarni aniqlashtirib, mavjud tarif va shartlarni tasdiqlagandan keyin hisob faollashtiriladi. Pullik xizmatlar bo'yicha narx, muddat va uskunalar alohida taklif yoki shartnomada belgilanadi.",
    ],
  },
  {
    title: "O'zgarishlar",
    paragraphs: [
      "Mahsulot rivojlanganda ushbu shartlar yangilanishi mumkin. Muhim o'zgarishlar sayt, ilova yoki muassasa administratoriga bildirishnoma orqali yetkaziladi. Yangilangan sana hujjat boshida ko'rsatiladi.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDocumentPage
      title="Foydalanish shartlari"
      summary="Platformadan kim, qanday vakolat bilan foydalanishi hamda davomat, hisob-kitob va integratsiyalar bo'yicha mas'uliyat chegaralarini belgilaydi."
      updatedAt="28-sentabr 2026"
      sections={sections}
    />
  );
}
