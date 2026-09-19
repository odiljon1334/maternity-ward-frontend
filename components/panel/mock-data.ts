/**
 * ⚠️ MOCK MA'LUMOTLAR — Admin panel UI qatlovi uchun vaqtinchalik.
 *
 * Bu fayl 2026-09-19'da, Odiljon "avval faqat UI, real ulanish keyin"
 * deb so'raganidan keyin yaratildi (Reja.md — FAZA 5). Real backend
 * tayyor bo'lgach, shu fayldagi konstantalar tegishli `api.ts`
 * chaqiruvlari (masalan `paymentsApi.getOverview()`, yangi
 * `superadminApi.getPlatformStats()` va h.k.) bilan almashtiriladi —
 * komponentlar (`StatCard`, jadval, grafik) o'zgarishi shart emas,
 * chunki ular shu fayldagi TypeScript interfeyslarga tayanadi.
 */

export interface PanelStat {
  key: string;
  label: string;
  value: string;
  delta: { value: string; direction: "up" | "down"; note: string };
  icon: "hospitals" | "users" | "revenue" | "pending";
  tone: "blue" | "green" | "violet" | "amber";
}

export const MOCK_STATS: PanelStat[] = [
  {
    key: "hospitals",
    label: "Jami shifoxonalar",
    value: "24",
    delta: { value: "+3", direction: "up", note: "shu oy qo'shildi" },
    icon: "hospitals",
    tone: "blue",
  },
  {
    key: "activeUsers",
    label: "Faol foydalanuvchilar",
    value: "187",
    delta: { value: "+12", direction: "up", note: "oxirgi 7 kunda kirgan" },
    icon: "users",
    tone: "green",
  },
  {
    key: "mrr",
    label: "Oylik daromad (MRR)",
    value: "8 400 000 so'm",
    delta: { value: "+12.4%", direction: "up", note: "o'tgan oyga nisbatan" },
    icon: "revenue",
    tone: "violet",
  },
  {
    key: "pending",
    label: "Kutilayotgan to'lovlar",
    value: "5 ta",
    delta: { value: "1 250 000 so'm", direction: "down", note: "jami qarzdorlik" },
    icon: "pending",
    tone: "amber",
  },
];

export const MOCK_REVENUE_TREND = [
  { month: "Fev", mrr: 5_200_000 },
  { month: "Mar", mrr: 5_800_000 },
  { month: "Apr", mrr: 6_100_000 },
  { month: "May", mrr: 6_400_000 },
  { month: "Iyun", mrr: 6_900_000 },
  { month: "Iyul", mrr: 7_300_000 },
  { month: "Avg", mrr: 7_900_000 },
  { month: "Sen", mrr: 8_400_000 },
];

export const MOCK_PAYMENT_STATUS = [
  { name: "To'langan", value: 16, color: "#22c55e" },
  { name: "Kutilmoqda", value: 5, color: "#f59e0b" },
  { name: "Muddati o'tgan", value: 3, color: "#ef4444" },
];

export const MOCK_RECENT_HOSPITALS = [
  { id: "1", name: "1-son Tug'ruq xonasi", code: "TX-01", employees: 42, isActive: true, createdAt: "2026-09-14" },
  { id: "2", name: "Andijon Perinatal markazi", code: "AND-PM", employees: 67, isActive: true, createdAt: "2026-09-10" },
  { id: "3", name: "Farg'ona Tug'ruqxonasi No2", code: "FRG-02", employees: 31, isActive: false, createdAt: "2026-09-05" },
  { id: "4", name: "Namangan Ona va bola markazi", code: "NAM-OB", employees: 54, isActive: true, createdAt: "2026-08-29" },
  { id: "5", name: "Buxoro Perinatal markazi", code: "BXR-PM", employees: 38, isActive: true, createdAt: "2026-08-22" },
];

export const MOCK_ROLE_DISTRIBUTION = [
  { role: "EMPLOYEE", label: "Xodim", count: 612 },
  { role: "DEPARTMENT_HEAD", label: "Bo'lim boshlig'i", count: 48 },
  { role: "DIRECTOR", label: "Direktor", count: 24 },
  { role: "ADMIN", label: "Administrator", count: 11 },
];

export const MOCK_ATTENTION = {
  pendingPaymentsCount: 5,
  inactiveHospitalsCount: 2,
};
