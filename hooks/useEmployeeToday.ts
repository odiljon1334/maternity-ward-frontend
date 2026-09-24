"use client";

import { useQuery } from "@tanstack/react-query";
import { attendanceApi, type SelfToday } from "@/lib/api";
import { tzTime } from "@/lib/time";

/** Kun holati: kelish kutilmoqda / ishda / yakunlandi / grafik bo'yicha dam olish */
export type TodayState = "in" | "out" | "done" | "off";

export const SELF_TODAY_KEY = ["self-today"] as const;

/**
 * Xodimning hozirgi holati — qarorni SERVER qiladi (GET /attendance/self/today):
 * qaysi amal kutilmoqda, joriy yozuv va smena vaqtlari.
 *
 * Ilgari holat telefonda oylik ro'yxatdan "bugungi sana" bo'yicha topilardi:
 * tungi smena yarim tundan o'tganda, telefon boshqa vaqt zonasida bo'lsa yoki
 * xodim terminal orqali kelgan bo'lsa (kesh eskirgan) — noto'g'ri tugma
 * ko'rinardi. Endi ilova oynaga qaytganda va har daqiqada yangilanadi.
 */
export function useEmployeeToday(enabled = true) {
  const q = useQuery<SelfToday>({
    queryKey: SELF_TODAY_KEY,
    queryFn: () => attendanceApi.selfToday(),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
    enabled,
  });

  const d = q.data;
  const record = d?.record ?? null;

  let state: TodayState = "in";
  if (d?.action === "DONE") state = "done";
  else if (d?.action === "CHECK_OUT") state = "out";
  else if (d?.dayOff) state = "off";

  const fmt = (v?: string | null) => (v ? tzTime(v).format("HH:mm") : null);

  return {
    record,
    schedule: d?.schedule ?? null,
    state,
    /** Kutilgan kelish/ketish — mutlaq vaqt (tungi smenada ketish ertasi kuni) */
    expectedCheckIn: d?.expectedCheckIn ?? null,
    expectedCheckOut: d?.expectedCheckOut ?? null,
    shiftStart: fmt(d?.expectedCheckIn),
    shiftEnd: fmt(d?.expectedCheckOut),
    graceMinutes: d?.graceMinutes ?? 0,
    overnight: !!d?.overnight,
    isLoading: q.isLoading,
    isError: q.isError && !d,
    refetch: q.refetch,
  };
}
