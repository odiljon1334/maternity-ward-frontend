/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { attendanceApi, schedulesApi } from "@/lib/api";

/** Kun holati: kelish kutilmoqda / ishda / yakunlandi / grafik bo'yicha dam olish */
export type TodayState = "in" | "out" | "done" | "off";

const OFF_STATUSES = new Set([
  "DAY_OFF", "SICK", "VACATION", "HOLIDAY", "MATERNITY_LEAVE", "OTHER_ABSENCE",
]);

/**
 * Xodimning bugungi davomat yozuvi va grafigi.
 *
 * Kalitlar `my-attendance` va `my-schedule` sahifalari bilan bir xil —
 * pastki menyu, check-in sahifasi va o'sha sahifalar bitta keshdan o'qiydi.
 */
export function useEmployeeToday(enabled = true) {
  const now = dayjs();
  const month = now.month() + 1;
  const year = now.year();
  const todayStr = now.format("YYYY-MM-DD");

  const attendance = useQuery({
    queryKey: ["my-attendance-today", month, year],
    queryFn: () => attendanceApi.my({ month, year }),
    select: (d: any) =>
      (d?.records ?? []).find((r: any) => dayjs(r.workDate).format("YYYY-MM-DD") === todayStr) ?? null,
    staleTime: 30_000,
    enabled,
  });

  const schedule = useQuery<any[], Error, any>({
    queryKey: ["my-schedule", month, year],
    queryFn: () => schedulesApi.my({ month, year }),
    select: (rows) =>
      (rows ?? []).find((s: any) => dayjs(s.date).format("YYYY-MM-DD") === todayStr) ?? null,
    staleTime: 5 * 60_000,
    enabled,
  });

  const record = attendance.data ?? null;
  const sch = schedule.data ?? null;

  const shiftStart: string | null =
    record?.expectedCheckIn ? dayjs(record.expectedCheckIn).format("HH:mm")
    : sch?.status === "WORKING" && sch?.shift?.startTime ? sch.shift.startTime : null;
  const shiftEnd: string | null =
    record?.expectedCheckOut ? dayjs(record.expectedCheckOut).format("HH:mm")
    : sch?.status === "WORKING" && sch?.shift?.endTime ? sch.shift.endTime : null;

  let state: TodayState = "in";
  if (record?.checkIn && record?.checkOut) state = "done";
  else if (record?.checkIn) state = "out";
  else if (sch && OFF_STATUSES.has(sch.status)) state = "off";

  return {
    record,
    schedule: sch,
    state,
    shiftStart,
    shiftEnd,
    isLoading: attendance.isLoading,
  };
}
