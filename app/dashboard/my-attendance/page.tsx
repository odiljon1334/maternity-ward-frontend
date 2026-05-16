"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { formatMinutes, cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight,
  Clock, CheckCircle2, XCircle, AlertTriangle, Coffee,
  TrendingUp, Calendar,
} from "lucide-react";
import dayjs from "dayjs";
import { useAuthStore } from "@/stores/auth";

const STATUS_MAP: Record<string, { label: string; cls: string; icon: any }> = {
  PRESENT:    { label: "Keldi",      cls: "badge-green",  icon: CheckCircle2  },
  LATE:       { label: "Kechikdi",   cls: "badge-yellow", icon: AlertTriangle },
  ABSENT:     { label: "Kelmadi",    cls: "badge-red",    icon: XCircle       },
  EARLY_LEAVE:{ label: "Erta ketdi", cls: "badge-blue",   icon: Clock         },
  LATE_EARLY: { label: "Kech+Erta",  cls: "badge-purple", icon: AlertTriangle },
};

export default function MyAttendancePage() {
  const { user } = useAuthStore();
  const now   = dayjs();
  const [month, setMonth] = useState(now.month() + 1);
  const [year,  setYear]  = useState(now.year());

  const goPrev = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const goNext = () => {
    const isCurrentMonth = month === now.month() + 1 && year === now.year();
    if (isCurrentMonth) return; // Kelajakka yo'l yo'q
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["my-attendance", month, year],
    queryFn: () => attendanceApi.my({ month, year }),
    staleTime: 2 * 60_000,
  });

  const records: any[] = data?.records ?? [];
  const stats           = data?.stats   ?? {};
  const monthLabel      = dayjs().month(month - 1).format("MMMM");
  const isCurrentMonth  = month === now.month() + 1 && year === now.year();

  // Ish vaqti foizi (agar bir oyda 22 ish kuni bo'lsa)
  const workDaysPct = stats.totalDays > 0
    ? Math.round((stats.present + (stats.late || 0)) / stats.totalDays * 100)
    : 0;

  const empName = user?.employee?.fullName || user?.username || "Xodim";

  return (
    <div>
      <Topbar
        title="Mening davomatim"
        subtitle={`${empName} · ${year} yil, ${monthLabel}`}
      />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-5">
        {/* ── Oy navigatsiyasi ── */}
        <div className="flex items-center justify-between">
          <button onClick={goPrev} className="btn-ghost p-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-semibold text-[var(--text-primary)]">
            {monthLabel} {year}
          </span>
          <button onClick={goNext} disabled={isCurrentMonth} className="btn-ghost p-2 disabled:opacity-30">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* ── Statistika kartalar ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-4 h-20 animate-pulse bg-[var(--bg-hover)]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Keldi",     value: stats.present    ?? 0, icon: CheckCircle2,  color: "text-emerald-400", bg: "bg-emerald-600/15" },
              { label: "Kechikdi",  value: stats.late       ?? 0, icon: AlertTriangle, color: "text-amber-400",   bg: "bg-amber-600/15"   },
              { label: "Kelmadi",   value: stats.absent     ?? 0, icon: XCircle,       color: "text-red-400",     bg: "bg-red-600/15"     },
              { label: "Kechikish", value: formatMinutes(stats.totalLateMin ?? 0), icon: Clock, color: "text-indigo-400", bg: "bg-indigo-600/15" },
            ].map((s) => (
              <div key={s.label} className="card p-4 flex items-center gap-3">
                <div className={cn("p-2 rounded-xl flex-shrink-0", s.bg)}>
                  <s.icon className={cn("w-5 h-5", s.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Davomat foizi progress bar ── */}
        {!isLoading && stats.totalDays > 0 && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-[var(--text-primary)]">Davomat foizi</span>
              </div>
              <span className="text-sm font-bold text-indigo-400">{workDaysPct}%</span>
            </div>
            <div className="h-2.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-700"
                style={{ width: `${workDaysPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1.5">
              <span>{stats.totalDays} ta kun qayd etilgan</span>
              {(stats.totalOvertimeMin ?? 0) > 0 && (
                <span className="text-emerald-400">+{formatMinutes(stats.totalOvertimeMin)} ortiqcha</span>
              )}
            </div>
          </div>
        )}

        {/* ── Kunlar ro'yxati ── */}
        <div className="card overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-[var(--border)] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
            <h3 className="font-semibold text-sm text-[var(--text-primary)]">Kunlik yozuvlar</h3>
            <span className="ml-auto text-xs text-[var(--text-muted)]">{records.length} ta kun</span>
          </div>

          {isLoading && (
            <div className="p-4 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-[var(--bg-hover)] animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && records.length === 0 && (
            <div className="px-5 py-12 text-center text-[var(--text-muted)] text-sm">
              Bu oy uchun ma'lumot yo'q
            </div>
          )}

          {!isLoading && records.length > 0 && (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      {["Sana", "Kelish", "Ketish", "Tushlik", "Kechikish", "Ish vaqti", "Holat"].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r: any) => {
                      const st   = STATUS_MAP[r.status] ?? { label: r.status, cls: "badge-gray", icon: Clock };
                      const date = dayjs(r.workDate);
                      const isToday = date.format("YYYY-MM-DD") === now.format("YYYY-MM-DD");
                      return (
                        <tr key={r.id} className={cn("border-b border-[var(--border)]", isToday && "bg-indigo-500/5")}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              {isToday && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />}
                              <div>
                                <p className="font-medium text-[var(--text-primary)]">{date.format("DD MMMM")}</p>
                                <p className="text-xs text-[var(--text-muted)]">{date.format("dddd")}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-[var(--text-primary)]">
                            {r.checkIn ? dayjs(r.checkIn).format("HH:mm") : "—"}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-[var(--text-muted)]">
                            {r.checkOut ? dayjs(r.checkOut).format("HH:mm") : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-xs">
                            {r.lunchOut ? (
                              <span className="flex items-center gap-1 text-orange-400">
                                <Coffee className="w-3 h-3 flex-shrink-0" />
                                {dayjs(r.lunchOut).format("HH:mm")}
                                {r.lunchIn && `–${dayjs(r.lunchIn).format("HH:mm")}`}
                                {(r.lunchLateMin ?? 0) > 0 && (
                                  <span className="text-red-400 font-semibold">+{r.lunchLateMin}min</span>
                                )}
                              </span>
                            ) : <span className="text-[var(--text-muted)] opacity-40">—</span>}
                          </td>
                          <td className="px-5 py-3.5">
                            {r.lateMinutes > 0
                              ? <span className="text-amber-400 font-medium">{formatMinutes(r.lateMinutes)}</span>
                              : <span className="text-[var(--text-muted)]">—</span>}
                          </td>
                          <td className="px-5 py-3.5">
                            {(r.netWorkMin ?? 0) > 0
                              ? <span className="flex items-center gap-1 text-[var(--text-primary)]">
                                  <Clock className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                  {formatMinutes(r.netWorkMin)}
                                </span>
                              : <span className="text-[var(--text-muted)]">—</span>}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={st.cls}>{st.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-[var(--border)]">
                {records.map((r: any) => {
                  const st   = STATUS_MAP[r.status] ?? { label: r.status, cls: "badge-gray", icon: Clock };
                  const date = dayjs(r.workDate);
                  const isToday = date.format("YYYY-MM-DD") === now.format("YYYY-MM-DD");
                  return (
                    <div key={r.id} className={cn("px-4 py-3.5", isToday && "bg-indigo-500/5")}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {isToday && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5" />}
                          <div>
                            <p className="font-medium text-sm text-[var(--text-primary)]">{date.format("DD MMMM, dddd")}</p>
                          </div>
                        </div>
                        <span className={cn(st.cls, "flex-shrink-0")}>{st.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                        <span className="font-mono">
                          ↑ {r.checkIn ? dayjs(r.checkIn).format("HH:mm") : "—"}
                        </span>
                        <span className="font-mono">
                          ↓ {r.checkOut ? dayjs(r.checkOut).format("HH:mm") : "—"}
                        </span>
                        {r.lateMinutes > 0 && (
                          <span className="text-amber-400">⏱ +{formatMinutes(r.lateMinutes)}</span>
                        )}
                        {(r.netWorkMin ?? 0) > 0 && (
                          <span className="text-indigo-400">🕐 {formatMinutes(r.netWorkMin)}</span>
                        )}
                        {r.lunchOut && (
                          <span className="text-orange-400">
                            🍽 {dayjs(r.lunchOut).format("HH:mm")}
                            {r.lunchIn && `–${dayjs(r.lunchIn).format("HH:mm")}`}
                            {(r.lunchLateMin ?? 0) > 0 && ` +${r.lunchLateMin}min`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
