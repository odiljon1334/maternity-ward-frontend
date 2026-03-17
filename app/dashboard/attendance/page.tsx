"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { attendanceApi, departmentsApi, photoUrl as buildPhotoUrl } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { useAuthStore } from "@/stores/auth";
import { getInitials, getAvatarColor, formatMinutes, cn, isSuperLike } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar, Coffee } from "lucide-react";
import dayjs from "dayjs";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PRESENT:     { label: "Keldi",      cls: "badge-green" },
  LATE:        { label: "Kechikdi",   cls: "badge-yellow" },
  ABSENT:      { label: "Kelmadi",    cls: "badge-red" },
  EARLY_LEAVE: { label: "Erta ketdi", cls: "badge-blue" },
  LATE_EARLY:  { label: "Kech+Erta",  cls: "badge-purple" },
};

export default function AttendancePage() {
  const { user, selectedHospital } = useAuthStore();
  const targetHospitalId = isSuperLike(user?.role) ? (selectedHospital?.id || undefined) : undefined;
  const params = targetHospitalId ? { targetHospitalId } : undefined;

  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [deptFilter, setDeptFilter] = useState("");

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["attendance-daily", date, deptFilter, targetHospitalId],
    queryFn: () => attendanceApi.daily({ date, departmentId: deptFilter || undefined, targetHospitalId }),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", targetHospitalId],
    queryFn: () => departmentsApi.list(params),
  });

  const prevDay = () => setDate(dayjs(date).subtract(1, "day").format("YYYY-MM-DD"));
  const nextDay = () => setDate(dayjs(date).add(1, "day").format("YYYY-MM-DD"));

  const summary = {
    present: records.filter((r: any) => r.status === "PRESENT" || r.status === "LATE" || r.status === "EARLY_LEAVE" || r.status === "LATE_EARLY").length,
    absent: records.filter((r: any) => r.status === "ABSENT").length,
    late: records.filter((r: any) => r.status === "LATE" || r.status === "LATE_EARLY").length,
    lunchLate: records.filter((r: any) => (r.lunchLateMin ?? 0) > 0).length,
    total: records.length,
  };

  return (
    <div>
      <Topbar title="Davomat" subtitle="Kunlik davomat holati" />

      <div className="p-6 space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 card px-2 py-1">
            <button onClick={prevDay} className="btn-ghost p-1.5"><ChevronLeft className="w-4 h-4" /></button>
            <div className="flex items-center gap-2 px-2">
              <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-sm text-[var(--text-primary)] outline-none"
              />
            </div>
            <button onClick={nextDay} className="btn-ghost p-1.5"><ChevronRight className="w-4 h-4" /></button>
          </div>

          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="input-field w-44">
            <option value="">Barcha bo'limlar</option>
            {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: "Jami", value: summary.total, cls: "text-[var(--text-primary)]" },
            { label: "Keldi", value: summary.present, cls: "text-emerald-400" },
            { label: "Kelmadi", value: summary.absent, cls: "text-red-400" },
            { label: "Kechikdi", value: summary.late, cls: "text-yellow-400" },
            { label: "Tushlikdan kech", value: summary.lunchLate, cls: "text-orange-400" },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {["Xodim", "Bo'lim", "Smen", "Keldi", "Ketdi", "Tushlik", "Holat", "Kechikish", "Overtime"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-[var(--border)]">
                  {[...Array(9)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 rounded bg-[var(--bg-hover)] animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
              {!isLoading && records.map((r: any) => {
                const st = STATUS_MAP[r.status] || { label: r.status, cls: "badge-gray" };
                const shiftHour = r.expectedCheckIn ? dayjs(r.expectedCheckIn).hour() : 0;
                return (
                  <tr key={r.id} className="border-b border-[var(--border)] table-row-hover">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {r.employee?.photoUrl
                            ? <img src={buildPhotoUrl(r.employee.photoUrl)} alt={r.employee.fullName}
                                className="w-8 h-8 rounded-full object-cover ring-1 ring-[var(--border)]" />
                            : <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white",
                                getAvatarColor(r.employee?.fullName || ""))}>
                                {getInitials(r.employee?.fullName || "?")}
                              </div>
                          }
                        </div>
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{r.employee?.fullName}</p>
                          <p className="text-xs text-[var(--text-muted)]">{r.employee?.position?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--text-muted)]">{r.employee?.department?.name}</td>
                    <td className="px-5 py-3.5">
                      {r.expectedCheckIn ? (
                        <span className={shiftHour < 14 ? "badge-blue" : "badge-purple"}>
                          {shiftHour < 14 ? "Kunduzgi" : "Kechki"}
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)] text-xs">Grafik yo'q</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[var(--text-primary)]">
                      {r.checkIn ? dayjs(r.checkIn).format("HH:mm") : "—"}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[var(--text-muted)]">
                      {r.checkOut ? dayjs(r.checkOut).format("HH:mm") : "—"}
                    </td>
                    {/* Tushlik */}
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap">
                      {r.lunchOut ? (
                        <div className="flex items-center gap-1">
                          <Coffee className="w-3 h-3 text-orange-400 flex-shrink-0" />
                          <span className="text-orange-400 font-mono">
                            {dayjs(r.lunchOut).format("HH:mm")}–{r.lunchIn ? dayjs(r.lunchIn).format("HH:mm") : "…"}
                          </span>
                          {(r.lunchLateMin ?? 0) > 0 && (
                            <span className="text-red-400 font-semibold ml-0.5">+{r.lunchLateMin}min</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)] opacity-40">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={st.cls}>{st.label}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {r.lateMinutes > 0
                        ? <span className="text-yellow-400 text-xs">{formatMinutes(r.lateMinutes)}</span>
                        : <span className="text-[var(--text-muted)]">—</span>
                      }
                    </td>
                    <td className="px-5 py-3.5">
                      {r.overtimeMinutes > 0
                        ? <span className="text-emerald-400 text-xs">+{formatMinutes(r.overtimeMinutes)}</span>
                        : <span className="text-[var(--text-muted)]">—</span>
                      }
                    </td>
                  </tr>
                );
              })}
              {!isLoading && records.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-[var(--text-muted)] text-sm">
                    {date} kuni uchun davomat ma'lumoti yo'q
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
