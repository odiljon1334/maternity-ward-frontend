"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { employeesApi, attendanceApi, payrollApi, photoUrl as buildPhotoUrl } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { getInitials, getAvatarColor, formatMoney, cn } from "@/lib/utils";
import {
  ArrowLeft, Phone, Hash, Briefcase, Building2, Calendar,
  Clock, TrendingUp, DollarSign, AlertTriangle, CheckCircle2,
  XCircle, Coffee, ChevronLeft, ChevronRight,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}

/** Handles both full ISO datetimes AND time-only strings like "08:00" or "08:00:00" */
function fmtTimeVal(val: string | null | undefined): string | null {
  if (!val) return null;
  // Time-only string: "08:00" or "08:00:00"
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(val.trim())) return val.trim().slice(0, 5);
  // Full ISO or datetime string
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit" });
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PRESENT:     { label: "Keldi",      color: "text-emerald-400", bg: "bg-emerald-500/10" },
  LATE:        { label: "Kech keldi", color: "text-yellow-400",  bg: "bg-yellow-500/10"  },
  LATE_EARLY:  { label: "Kech+Erta",  color: "text-orange-400",  bg: "bg-orange-500/10"  },
  ABSENT:      { label: "Kelmadi",    color: "text-red-400",     bg: "bg-red-500/10"     },
  EARLY_LEAVE: { label: "Erta ketdi", color: "text-blue-400",    bg: "bg-blue-500/10"    },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <p className="font-bold text-[var(--text-primary)]">{value}</p>
        {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Attendance Tab ───────────────────────────────────────────────────────────
function AttendanceTab({ employeeId }: { employeeId: string }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: rawData, isLoading } = useQuery({
    queryKey: ["attendance-employee", employeeId, month, year],
    queryFn: () => attendanceApi.employee(employeeId, { month, year }),
  });

  // API returns { records: [...], stats: {...} } or legacy array
  const arr: any[] = Array.isArray(rawData) ? rawData : (rawData?.records ?? []);
  const serverStats = Array.isArray(rawData) ? null : (rawData as any)?.stats;

  const total        = serverStats?.totalDays   ?? arr.length;
  const present      = serverStats?.present     ?? arr.filter((r: any) => r.status === "PRESENT").length;
  const late         = serverStats?.late        ?? arr.filter((r: any) => ["LATE","LATE_EARLY"].includes(r.status)).length;
  const absent       = serverStats?.absent      ?? arr.filter((r: any) => r.status === "ABSENT").length;
  const totalLateMin = serverStats?.totalLateMin ?? arr.reduce((s: number, r: any) => s + (r.lateMinutes ?? 0), 0);
  const totalLunchLate = arr.reduce((s: number, r: any) => s + (r.lunchLateMin ?? 0), 0);

  const UZ_MONTHS = ["","Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentyabr","Oktyabr","Noyabr","Dekabr"];
  const monthName = `${UZ_MONTHS[month]} ${year}`;
  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div className="space-y-4">
      {/* Month navigator */}
      <div className="flex items-center gap-2">
        <button onClick={prevMonth} className="btn-ghost p-1.5"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-sm font-semibold text-[var(--text-primary)] capitalize min-w-40 text-center">{monthName}</span>
        <button onClick={nextMonth} className="btn-ghost p-1.5"><ChevronRight className="w-4 h-4" /></button>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Jami kun"    value={total}   icon={<Calendar    className="w-4 h-4 text-indigo-400" />}  color="bg-indigo-500/15" />
        <StatCard label="O'z vaqtida" value={present} icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} color="bg-emerald-500/15" />
        <StatCard label="Kech keldi"  value={late}    sub={totalLateMin > 0 ? `${totalLateMin} daqiqa jami` : undefined}
          icon={<Clock className="w-4 h-4 text-yellow-400" />} color="bg-yellow-500/15" />
        <StatCard label="Kelmadi"     value={absent}  icon={<XCircle     className="w-4 h-4 text-red-400" />}     color="bg-red-500/15" />
      </div>

      {totalLunchLate > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400">
          <Coffee className="w-3.5 h-3.5 flex-shrink-0" />
          Tushlikdan kech qaytish: jami <b className="ml-1">{totalLunchLate} daqiqa</b>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {["Sana", "Kelishi kerak", "Keldi", "Ketdi", "Tushlik", "Kechikish", "Holat"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && [...Array(8)].map((_, i) => (
              <tr key={i} className="border-b border-[var(--border)]">
                {[...Array(7)].map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-[var(--bg-hover)] animate-pulse" /></td>
                ))}
              </tr>
            ))}
            {!isLoading && arr.map((r: any) => {
              const s = STATUS_LABELS[r.status] ?? { label: r.status, color: "text-[var(--text-muted)]", bg: "" };
              // Shift start: from API or computed = checkIn - lateMinutes
              const shiftStartApi = fmtTimeVal(r.schedule?.shift?.startTime ?? r.shift?.startTime);
              const shiftStartComputed = (r.checkIn && (r.lateMinutes ?? 0) > 0)
                ? fmt(new Date(new Date(r.checkIn).getTime() - (r.lateMinutes * 60 * 1000)))
                : null;
              const shiftStart = shiftStartApi ?? shiftStartComputed;
              const isLate = (r.lateMinutes ?? 0) > 0;
              return (
                <tr key={r.id} className="border-b border-[var(--border)] table-row-hover">
                  {/* Date */}
                  <td className="px-4 py-3 text-[var(--text-muted)] font-mono text-xs whitespace-nowrap">
                    {fmtDate(r.workDate ?? r.date)}
                  </td>
                  {/* Shift start */}
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {shiftStart
                      ? <span className="text-[var(--text-muted)]">{shiftStart}</span>
                      : <span className="opacity-30 text-[var(--text-muted)]">—</span>
                    }
                  </td>
                  {/* Check-in */}
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {r.checkIn
                      ? <span className={isLate ? "text-yellow-400 font-medium" : "text-[var(--text-primary)]"}>{fmt(r.checkIn)}</span>
                      : <span className="opacity-30 text-[var(--text-muted)]">—</span>
                    }
                  </td>
                  {/* Check-out */}
                  <td className="px-4 py-3 text-[var(--text-primary)] text-xs whitespace-nowrap">
                    {fmt(r.checkOut)}
                  </td>
                  {/* Lunch */}
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {r.lunchOut ? (
                      <span className="text-orange-400">
                        {fmt(r.lunchOut)}–{fmt(r.lunchIn)}
                        {(r.lunchLateMin ?? 0) > 0 && <span className="ml-1 text-red-400">+{r.lunchLateMin}min</span>}
                      </span>
                    ) : (
                      <span className="opacity-30 text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                  {/* Late — kerak vaqt → kelgan vaqt + minutlar */}
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {isLate ? (
                      <div>
                        <p className="text-yellow-400 font-semibold font-mono">
                          {shiftStart ?? "?"} → {fmt(r.checkIn)}
                        </p>
                        <p className="text-yellow-500/60 text-[11px] mt-0.5">{r.lateMinutes} min kech</p>
                      </div>
                    ) : (
                      <span className="opacity-30 text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", s.color, s.bg)}>
                      {s.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {!isLoading && arr.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">Bu oy uchun ma&apos;lumot yo&apos;q</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Salary Tab ───────────────────────────────────────────────────────────────
function SalaryTab({ employeeId, baseSalary }: { employeeId: string; baseSalary: number }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  // Saved payroll
  const { data: payroll, isLoading } = useQuery({
    queryKey: ["payroll-employee", employeeId, month, year],
    queryFn: () => payrollApi.employee(employeeId, { month, year }).catch(() => null),
  });

  // Preview (live calculation) — shown when no saved payroll
  const { data: preview, isLoading: previewLoading } = useQuery({
    queryKey: ["payroll-preview", employeeId, month, year],
    queryFn: () => payrollApi.preview(employeeId, { month, year }).catch(() => null),
    enabled: !isLoading && !payroll,
  });

  // Use saved payroll if exists, otherwise preview
  // preview API returns { preview: {...} } — flatten it
  const rawData = payroll ?? preview;
  const data = (rawData as any)?.preview ?? rawData;
  const isSaved = !!payroll;

  // Last 6 months payroll history
  const { data: history = [] } = useQuery({
    queryKey: ["payroll-history", employeeId],
    queryFn: async () => {
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        return { month: d.getMonth() + 1, year: d.getFullYear() };
      });
      const results = await Promise.all(
        months.map(({ month: m, year: y }) =>
          payrollApi.employee(employeeId, { month: m, year: y })
            .then((r: any) => r ? { month: m, year: y, ...r } : null)
            .catch(() => null)
        )
      );
      return results.filter(Boolean);
    },
  });

  const UZ_MONTHS = ["","Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentyabr","Oktyabr","Noyabr","Dekabr"];
  const monthName = `${UZ_MONTHS[month]} ${year}`;
  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const monthNames = ["","Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentyabr","Oktyabr","Noyabr","Dekabr"];

  const loading = isLoading || (previewLoading && !payroll);

  return (
    <div className="space-y-4">
      {/* Month navigator */}
      <div className="flex items-center gap-2">
        <button onClick={prevMonth} className="btn-ghost p-1.5"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-sm font-semibold text-[var(--text-primary)] capitalize min-w-40 text-center">{monthName}</span>
        <button onClick={nextMonth} className="btn-ghost p-1.5"><ChevronRight className="w-4 h-4" /></button>
      </div>

      {loading && (
        <div className="card p-6 space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-5 rounded bg-[var(--bg-hover)] animate-pulse" />)}
        </div>
      )}

      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Main payroll breakdown */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text-primary)] text-sm capitalize">{monthName}</h3>
              {isSaved ? (
                <span className={cn(
                  "text-xs font-medium px-2.5 py-0.5 rounded-full",
                  data.status === "APPROVED" ? "bg-emerald-500/15 text-emerald-400" : "bg-yellow-500/15 text-yellow-400"
                )}>
                  {data.status === "APPROVED" ? "✓ Tasdiqlangan" : "⏳ Kutilmoqda"}
                </span>
              ) : (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400">
                  ⚡ Oldindan hisob
                </span>
              )}
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm py-1">
                <span className="text-[var(--text-muted)]">Asosiy maosh</span>
                <span className="text-[var(--text-primary)] font-medium">{formatMoney(data.baseSalary ?? baseSalary)}</span>
              </div>

              {Number(data.lateDeduction ?? 0) > 0 && (
                <div className="flex justify-between text-sm py-1">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" /> Kechikish kesimi
                  </span>
                  <span className="text-red-400 font-medium">−{formatMoney(data.lateDeduction)}</span>
                </div>
              )}
              {Number(data.absenceDeduction ?? 0) > 0 && (
                <div className="flex justify-between text-sm py-1">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-red-400" /> Yo&apos;qlik kesimi
                  </span>
                  <span className="text-red-400 font-medium">−{formatMoney(data.absenceDeduction)}</span>
                </div>
              )}
              {Number(data.earlyLeaveDeduction ?? 0) > 0 && (
                <div className="flex justify-between text-sm py-1">
                  <span className="text-[var(--text-muted)]">Erta ketish kesimi</span>
                  <span className="text-red-400 font-medium">−{formatMoney(data.earlyLeaveDeduction)}</span>
                </div>
              )}
              {Number(data.overtimeBonus ?? 0) > 0 && (
                <div className="flex justify-between text-sm py-1">
                  <span className="text-[var(--text-muted)]">Ortiqcha vaqt bonusi</span>
                  <span className="text-emerald-400 font-medium">+{formatMoney(data.overtimeBonus)}</span>
                </div>
              )}
              {Number(data.manualBonus ?? 0) > 0 && (
                <div className="flex justify-between text-sm py-1">
                  <span className="text-[var(--text-muted)]">Qo&apos;l bonus</span>
                  <span className="text-emerald-400 font-medium">+{formatMoney(data.manualBonus)}</span>
                </div>
              )}

              <div className="border-t border-[var(--border)] pt-3 flex justify-between items-baseline">
                <span className="font-semibold text-[var(--text-primary)]">Net maosh</span>
                <span className="font-bold text-emerald-400 text-xl">{formatMoney(data.netSalary)}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4 text-center">
                <p className="text-xs text-[var(--text-muted)] mb-1">Ish kunlari</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{data.totalWorkDays ?? data.workDays ?? "—"}</p>
                <p className="text-xs text-[var(--text-muted)]">kun</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-[var(--text-muted)] mb-1">Yo&apos;qlik</p>
                <p className="text-2xl font-bold text-red-400">{data.totalAbsences ?? 0}</p>
                <p className="text-xs text-[var(--text-muted)]">kun</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-[var(--text-muted)] mb-1">Kechikish</p>
                <p className="text-2xl font-bold text-yellow-400">{data.totalLateMinutes ?? data.totalLateMin ?? 0}</p>
                <p className="text-xs text-[var(--text-muted)]">daqiqa</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-[var(--text-muted)] mb-1">Overtime</p>
                <p className="text-2xl font-bold text-indigo-400">{data.totalOvertimeMinutes ?? data.totalOvertimeMin ?? 0}</p>
                <p className="text-xs text-[var(--text-muted)]">daqiqa</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !data && (
        <div className="card p-10 text-center">
          <DollarSign className="w-10 h-10 text-[var(--text-muted)] opacity-30 mx-auto mb-3" />
          <p className="text-[var(--text-muted)] text-sm">Bu oy uchun maosh ma&apos;lumoti yo&apos;q</p>
          <p className="text-xs text-[var(--text-muted)] opacity-60 mt-1">Jadval generatsiya qilinmagan bo&apos;lishi mumkin</p>
        </div>
      )}

      {/* 6-month history */}
      {(history as any[]).length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">6 oylik maosh tarixi</h3>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {(history as any[]).map((h: any) => {
              const totalDed = Number(h.lateDeduction ?? 0) + Number(h.absenceDeduction ?? 0) + Number(h.earlyLeaveDeduction ?? 0);
              return (
                <div key={`${h.year}-${h.month}`} className="flex items-center justify-between px-5 py-3 table-row-hover">
                  <div>
                    <p className="text-sm text-[var(--text-primary)] font-medium">{monthNames[h.month]} {h.year}</p>
                    {totalDed > 0 && <p className="text-xs text-red-400 mt-0.5">−{formatMoney(totalDed)} kesim</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">{formatMoney(h.netSalary)}</p>
                    {h.status === "APPROVED" && <p className="text-xs text-emerald-400/60">Tasdiqlangan</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<"attendance" | "salary">("attendance");

  const { data: employee, isLoading: empLoading } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => employeesApi.get(id),
    enabled: !!id,
  });

  // Attendance trend: last 3 months
  const now = new Date();
  const trendMonths = [2, 1, 0].map(offset => {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  });

  const { data: trendRaw } = useQuery({
    queryKey: ["attendance-trend-3m", id],
    queryFn: async () => {
      return Promise.all(
        trendMonths.map(({ month, year }) =>
          attendanceApi.employee(id, { month, year }).catch(() => [])
        )
      );
    },
    enabled: !!id,
  });

  const trendData = trendMonths.map(({ month, year }, i) => {
    const raw = trendRaw?.[i] as any;
    const arr: any[] = Array.isArray(raw) ? raw : (raw?.records ?? []);
    const lateMin = raw?.stats?.totalLateMin ?? arr.reduce((s: number, r: any) => s + (r.lateMinutes ?? 0), 0);
    return { month, year, lateMin };
  });
  const maxLate = Math.max(...trendData.map(d => d.lateMin), 1);
  const monthLabels = ["","Yan","Fev","Mar","Apr","May","Iyun","Iyul","Avg","Sen","Okt","Noy","Dek"];

  if (empLoading) {
    return (
      <div>
        <Topbar title="Xodim profili" />
        <div className="p-4 lg:p-6 space-y-4">
          <div className="card p-6 h-32 animate-pulse bg-[var(--bg-hover)]" />
          <div className="card p-6 h-20 animate-pulse bg-[var(--bg-hover)]" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div>
        <Topbar title="Xodim topilmadi" />
        <div className="p-6 text-center text-[var(--text-muted)] py-20">Xodim topilmadi</div>
      </div>
    );
  }

  const avatarColor = getAvatarColor(employee.fullName);
  const initials = getInitials(employee.fullName);

  return (
    <div>
      <Topbar
        title={employee.fullName}
        subtitle={`${employee.department?.name ?? ""}${employee.position?.name ? " · " + employee.position.name : ""}`}
      />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-5">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Orqaga
        </button>

        {/* ── Top: Header + Trend Chart side by side ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 lg:gap-5">

          {/* Employee Header Card */}
          <div className="card p-5">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {employee.photoUrl ? (
                  <img src={buildPhotoUrl(employee.photoUrl)} alt={employee.fullName}
                    className="w-20 h-20 rounded-2xl object-cover ring-2 ring-[var(--border)]" />
                ) : (
                  <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white", avatarColor)}>
                    {initials}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">{employee.fullName}</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-0.5">
                      {[employee.position?.name, employee.department?.name].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "text-xs font-medium px-2.5 py-1 rounded-full",
                      employee.firedAt ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"
                    )}>
                      {employee.firedAt ? "Ishdan ketgan" : "● Aktiv"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm text-[var(--text-muted)]">
                  {employee.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-indigo-400" /> {employee.phone}
                    </span>
                  )}
                  {employee.employeeNo && (
                    <span className="flex items-center gap-1.5 font-mono text-xs">
                      <Hash className="w-3.5 h-3.5 text-violet-400" /> Terminal: {employee.employeeNo}
                    </span>
                  )}
                  {employee.department?.name && (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" /> {employee.department.name}
                    </span>
                  )}
                  {employee.position?.name && (
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-400" /> {employee.position.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Salary highlight */}
            <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-sm text-[var(--text-muted)]">Asosiy maosh</span>
              <span className="text-xl font-bold text-emerald-400">{formatMoney(employee.baseSalary)}</span>
            </div>
          </div>

          {/* Kechikish trendi */}
          <div className="card p-5 flex flex-col">
            <p className="text-xs font-semibold text-[var(--text-muted)] mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> 3 oylik kechikish trendi
            </p>
            <div className="flex items-end justify-around flex-1 gap-4">
              {trendData.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                  <span className={cn("text-xs font-bold", d.lateMin > 0 ? "text-yellow-400" : "text-[var(--text-muted)] opacity-40")}>
                    {d.lateMin > 0 ? `${d.lateMin}min` : "—"}
                  </span>
                  <div className="w-full bg-[var(--bg-hover)] rounded-lg" style={{ height: "60px", display: "flex", alignItems: "flex-end" }}>
                    <div
                      className={cn("w-full rounded-lg transition-all", d.lateMin > 0 ? "bg-yellow-500/60" : "opacity-0")}
                      style={{ height: `${d.lateMin > 0 ? Math.max((d.lateMin / maxLate) * 100, 8) : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">{monthLabels[d.month]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 border-b border-[var(--border)]">
          {([
            { key: "attendance", label: "Davomat",    icon: <Calendar    className="w-4 h-4" /> },
            { key: "salary",     label: "Maosh",      icon: <DollarSign  className="w-4 h-4" /> },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === t.key
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        {tab === "attendance" && <AttendanceTab employeeId={id} />}
        {tab === "salary"     && <SalaryTab employeeId={id} baseSalary={Number(employee.baseSalary) || 0} />}
      </div>
    </div>
  );
}
