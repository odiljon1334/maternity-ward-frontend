// StaffPulse marketing sahifasi — "O'zbekiston bozoriga mos integratsiyalar"
// bo'limi content'i (StaffPulse-Reja.md, 1-to'plam, 2-band).
//
// MUHIM: 2026-09-19 holatiga ko'ra bu integratsiyalarning HECH BIRI hali
// real ishlab chiqilmagan (backend'da tekshirildi — hech qanday 1C/
// Mehnat.uz/Payme/Click/Uzum Business kodi yo'q). Shuning uchun bu yerda
// hammasi ochiq-oydin "Rejalashtirilgan" deb belgilanadi — real mijozga
// ko'rsatiladigan sahifada bu holat o'zgarguncha "mavjud" deb ko'rsatilmasligi
// KERAK (soxta da'vo bo'lmasligi uchun).

export type IntegrationStatus = "planned";

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
    description: "Kadrlar hisobini O'zbekiston mehnat vazirligi talablariga moslashtirish.",
    status: "planned",
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
};
