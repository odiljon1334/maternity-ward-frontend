/**
 * Post grafigidagi kunduzgi/kechki hisob va post normasini postlarga ajratish.
 *
 * Backenddagi `schedule-planning-calculator.ts` bilan bir xil qoida — web
 * jadval, Excel va tasdiqlashga yuborish tekshiruvi bir xil son ko'rsatadi.
 */

export type ShiftKind = "DAY" | "NIGHT";

export type ShiftLike = {
  type?: string | null;
  startTime: string;
  endTime: string;
  isOvernight?: boolean | null;
};

export type EmployeeShiftStats = {
  /** Shu oyda boshlangan kunduzgi smenalar soni */
  dayShifts: number;
  /** Kunduzgi smenalarning shu oyga tushgan daqiqalari */
  dayMinutes: number;
  /** Shu oyda boshlangan kechki smenalar soni */
  nightShifts: number;
  /** Kechki smenalarning shu oyga tushgan daqiqalari (20:00–08:00 → 4 + 8) */
  nightMinutes: number;
};

export const EMPTY_SHIFT_STATS: EmployeeShiftStats = {
  dayShifts: 0,
  dayMinutes: 0,
  nightShifts: 0,
  nightMinutes: 0,
};

/**
 * Shablon turi ustun: DAYTIME (08:00–20:00) — kunduzgi, NIGHTTIME
 * (20:00–08:00) — kechki. Maxsus smena yarim tundan o'tsa kechki.
 * 14:00–00:00 kabi smena shu kunda tugaydi — kunduzgi.
 */
export function shiftKind(shift: ShiftLike): ShiftKind {
  if (shift.type === "NIGHTTIME") return "NIGHT";
  if (shift.type === "DAYTIME") return "DAY";
  const crossesMidnight = shift.isOvernight || shift.endTime <= shift.startTime;
  return crossesMidnight && shift.endTime !== "00:00" ? "NIGHT" : "DAY";
}

export function addShiftToStats(
  stats: EmployeeShiftStats,
  kind: ShiftKind,
  minutesInMonth: number,
  startsInMonth: boolean,
) {
  if (kind === "NIGHT") {
    stats.nightMinutes += minutesInMonth;
    if (startsInMonth) stats.nightShifts += 1;
  } else {
    stats.dayMinutes += minutesInMonth;
    if (startsInMonth) stats.dayShifts += 1;
  }
}

export function sumShiftStats(list: EmployeeShiftStats[]): EmployeeShiftStats {
  const total = { ...EMPTY_SHIFT_STATS };
  for (const stats of list) {
    total.dayShifts += stats.dayShifts;
    total.dayMinutes += stats.dayMinutes;
    total.nightShifts += stats.nightShifts;
    total.nightMinutes += stats.nightMinutes;
  }
  return total;
}

export type PostNormBreakdown = {
  postNormMinutes: number;
  fullPostCount: number;
  remainderMinutes: number;
  missingMinutes: number;
  postSlots: number;
};

/**
 * 2440 soat / 744 → 3 to'liq post, 208 soat ortib qoldi, yana 536 soat kerak.
 * Ortib qolgan qismni foydalanuvchi o'zi hal qiladi: oxirgi postni to'ldiradi
 * yoki xodimni «Postdan tashqari» deb belgilaydi.
 */
export function postNormBreakdown(
  plannedMinutes: number,
  postNormMinutes: number,
): PostNormBreakdown {
  if (postNormMinutes <= 0) {
    return { postNormMinutes, fullPostCount: 0, remainderMinutes: plannedMinutes, missingMinutes: 0, postSlots: 0 };
  }
  const fullPostCount = Math.floor(plannedMinutes / postNormMinutes);
  const remainderMinutes = plannedMinutes - fullPostCount * postNormMinutes;
  const postSlots = Math.max(1, fullPostCount + (remainderMinutes ? 1 : 0));
  return {
    postNormMinutes,
    fullPostCount,
    remainderMinutes,
    missingMinutes: postSlots * postNormMinutes - plannedMinutes,
    postSlots,
  };
}
