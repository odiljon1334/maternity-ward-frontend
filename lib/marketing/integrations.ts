// StaffPulse marketing sahifasi — "O'zbekiston bozoriga mos integratsiyalar"
// bo'limi content'i (StaffPulse-Reja.md, 1-to'plam, 2-band).
//
// MUHIM (2026-09-20 holatiga ko'ra):
// - "planned" — hali real ishlab chiqilmagan, lekin kelajakda API integratsiyasi
//   sifatida qilish REJALASHTIRILGAN yo'nalishlar (1C, to'lov tizimlari).
//   Backend'da tekshirildi — hech qanday kod yo'q, shuning uchun "mavjud" deb
//   ko'rsatilmaydi (soxta da'vo bo'lmasligi uchun).
// - "compatible" — Odiljonning aniq qarori (2026-09-20): Mehnat.uz (YAMMT) bilan
//   API integratsiyasi QILINMAYDI. Buning o'rniga tizimning o'z ma'lumot
//   tuzilishi (kadrlar hisobi, shtat jadvali, ta'tillar, buyruqlar arxivi)
//   YAMMT talablariga mos keladigan qilib ko'rib chiqiladi/moslashtiriladi —
//   bu integratsiya emas, struktura moslik degani.

export type IntegrationStatus = "planned" | "compatible";

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
    description: "T-13 tabelini bir tugma bilan 1C'ga uzatish — buxgalteriya oylik hisob-kitobni qo'lda qayta kiritmaydi.",
    status: "planned",
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
  planned: "Rejalashtirilgan",
  compatible: "Talablarga mos",
};
