// StaffPulse marketing sahifasi — "O'zbekiston bozoriga mos integratsiyalar"
// bo'limi content'i (StaffPulse-Reja.md, 1-to'plam, 2-band).
//
// MUHIM (2026-09-20 holatiga ko'ra):
// - "available" — REAL ishlaydigan xususiyat, backend'da tekshirilgan va
//   test qilingan (1C: T-13 tabel eksporti — /reports/t13/excel, commit
//   bf00ee7/366a3ac). Faqat shu holatda "mavjud" deb ko'rsatiladi.
// - "planned" — hali real ishlab chiqilmagan, lekin kelajakda qilish
//   REJALASHTIRILGAN yo'nalishlar (to'lov tizimlari).
// - "compatible" — Odiljonning aniq qarori (2026-09-20): Mehnat.uz (YAMMT)
//   bilan API integratsiyasi QILINMAYDI. Buning o'rniga tizimning o'z
//   ma'lumot tuzilishi (kadrlar hisobi, shtat jadvali, ta'tillar, buyruqlar
//   arxivi) YAMMT talablariga mos keladigan qilib ko'rib chiqiladi — bu
//   integratsiya emas, struktura moslik degani.

export type IntegrationStatus = "available" | "planned" | "compatible";

export type IntegrationItem = {
  key: string;
  name: string;
  description: string;
  status: IntegrationStatus;
};

export const INTEGRATIONS: IntegrationItem[] = [
  {
    key: "1c",
    name: "1C: Buxgalteriya / ZUP",
    description: "T-13 tabelini bir tugma bilan yuklab olish — standart Я/Н/В/ОТ/Б kodlari bilan, 1C:ZUP'ga qo'lda qayta kiritish shart emas.",
    status: "available",
  },
  {
    key: "mehnat-uz",
    name: "Mehnat.uz (YAMMT)",
    description: "Yagona Milliy Mehnat Tizimi talablariga mos kadrlar hisobi, shtat jadvali, qonuniy ta'tillar va buyruqlar arxivi tizim bilan hamnafas yuritiladi.",
    status: "compatible",
  },
  {
    key: "payments",
    name: "Payme / Click / Uzum Business",
    description: "Yuridik va korporativ shifoxonalar uchun to'g'ridan-to'g'ri hisob-kitob.",
    status: "planned",
  },
];

export const INTEGRATION_STATUS_LABELS: Record<IntegrationStatus, string> = {
  available: "Tayyor",
  planned: "Rejalashtirilgan",
  compatible: "Talablarga mos",
};
