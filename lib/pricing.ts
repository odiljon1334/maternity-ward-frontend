/**
 * StaffPlusPRO — YAGONA narx hisoblash manbai (single source of truth).
 *
 * TARIX (2026-09-20): loyihada bir vaqtning o'zida 4 xil, bir-biriga mos
 * kelmaydigan narx sxemasi ishlatilib kelingan (tariflar sahifasi matni,
 * interaktiv kalkulyator, ROI kalkulyatori/PDF taklifnoma, backend
 * to'lov/qarzdorlik hisobi, Telegram bot to'lov summasi — hammasi turlicha
 * raqam bilan). Odiljon bilan kelishilgan YAGONA rasmiy narx quyida — barcha
 * joyda FAQAT shu funksiyalar orqali hisoblanishi kerak, hech qayerda
 * qo'lda raqam yozilmasin.
 *
 * Bosqichlar (2026-09-20'da Odiljon tomonidan tasdiqlangan):
 *  - 1–14 xodim:    "Start" — FIKS oylik to'lov 599 000 so'm (chegirma,
 *                   asl narx 699 000 so'm).
 *  - 15–199 xodim:  "Biznes" — 15 000 so'm / xodim / oy.
 *  - 200–500 xodim: "Korporativ" — 12 000 so'm / xodim / oy.
 *  - 501+ xodim:    Kelishiladi (individual so'zlashuv, aniq narx yo'q).
 *
 * Yillik to'lov qoidasi: oylik narx × 10 (ya'ni 2 oy BEPUL — barcha
 * bosqichlarda bir xil, oddiy va tushunarli qoida).
 */

export type PlanSlug = 'start' | 'biznes' | 'korporativ';

export interface StaffPricing {
  plan: PlanSlug;
  planLabel: string;
  isFlat: boolean;
  negotiated: boolean;
  /** Faqat "start" bosqichida — so'm/oy, aks holda null */
  flatMonthly: number | null;
  /** Faqat "start" bosqichida — chegirmagacha bo'lgan asl narx, so'm/oy */
  flatMonthlyOriginal: number | null;
  /** "biznes"/"korporativ" bosqichlarida — so'm/xodim/oy, aks holda null */
  perEmployeeMonthly: number | null;
  /** "biznes"/"korporativ" bosqichlarida — so'm/xodim/yil (oylik × 10) */
  perEmployeeAnnual: number | null;
  /** Hisoblangan umumiy oylik to'lov (negotiated bo'lsa — null) */
  monthlyTotal: number | null;
  /** Hisoblangan umumiy yillik to'lov (negotiated bo'lsa — null) */
  annualTotal: number | null;
}

const ANNUAL_MULTIPLIER = 10; // 12 oy narxi o'rniga 10 oy — 2 oy bepul

export function getStaffPricing(staffCount: number): StaffPricing {
  const n = Math.max(0, Math.floor(staffCount || 0));

  if (n <= 14) {
    const flatMonthly = 599_000;
    return {
      plan: 'start',
      planLabel: 'Start',
      isFlat: true,
      negotiated: false,
      flatMonthly,
      flatMonthlyOriginal: 699_000,
      perEmployeeMonthly: null,
      perEmployeeAnnual: null,
      monthlyTotal: flatMonthly,
      annualTotal: flatMonthly * ANNUAL_MULTIPLIER,
    };
  }

  if (n <= 199) {
    const perEmployeeMonthly = 15_000;
    return {
      plan: 'biznes',
      planLabel: 'Biznes',
      isFlat: false,
      negotiated: false,
      flatMonthly: null,
      flatMonthlyOriginal: null,
      perEmployeeMonthly,
      perEmployeeAnnual: perEmployeeMonthly * ANNUAL_MULTIPLIER,
      monthlyTotal: perEmployeeMonthly * n,
      annualTotal: perEmployeeMonthly * ANNUAL_MULTIPLIER * n,
    };
  }

  if (n <= 500) {
    const perEmployeeMonthly = 12_000;
    return {
      plan: 'korporativ',
      planLabel: 'Korporativ',
      isFlat: false,
      negotiated: false,
      flatMonthly: null,
      flatMonthlyOriginal: null,
      perEmployeeMonthly,
      perEmployeeAnnual: perEmployeeMonthly * ANNUAL_MULTIPLIER,
      monthlyTotal: perEmployeeMonthly * n,
      annualTotal: perEmployeeMonthly * ANNUAL_MULTIPLIER * n,
    };
  }

  // 501+ — kelishiladi
  return {
    plan: 'korporativ',
    planLabel: 'Korporativ',
    isFlat: false,
    negotiated: true,
    flatMonthly: null,
    flatMonthlyOriginal: null,
    perEmployeeMonthly: null,
    perEmployeeAnnual: null,
    monthlyTotal: null,
    annualTotal: null,
  };
}

export function formatSom(value: number): string {
  return new Intl.NumberFormat('uz-UZ').format(Math.round(value)).replace(/,/g, ' ');
}
