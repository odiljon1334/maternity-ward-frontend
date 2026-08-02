"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { employeesApi, attendanceApi, payrollApi, photoUrl as buildPhotoUrl } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { getInitials, getAvatarColor, formatMoney, formatMinutes, cn } from "@/lib/utils";
import {
  ArrowLeft, Phone, Hash, Briefcase, Building2, Calendar,
  Clock, TrendingUp, DollarSign, AlertTriangle, XCircle, Coffee, 
  ChevronLeft, ChevronRight, UserCheck, Zap
} from "lucide-react";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface AttendanceRecord {
  id: string;
  workDate?: string;
  date?: string;
  checkIn?: string | null;
  checkOut?: string | null;
  lunchOut?: string | null;
  lunchIn?: string | null;
  lateMinutes?: number;
  lunchLateMin?: number;
  netWorkMin?: number;
  status: "PRESENT" | "LATE" | "LATE_EARLY" | "ABSENT" | "EARLY_LEAVE";
  schedule?: {
    shift?: {
      startTime?: string;
      endTime?: string;
      lunchStart?: string;
      lunchEnd?: string;
    };
  };
  shift?: {
    startTime?: string;
    endTime?: string;
    lunchStart?: string;
    lunchEnd?: string;
  };
  expectedCheckOut?: string;
}

interface AttendanceResponse {
  records?: AttendanceRecord[];
  stats?: {
    totalDays?: number;
    present?: number;
    late?: number;
    absent?: number;
    totalLateMin?: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}

function fmtTimeVal(val: string | null | undefined): string | null {
  if (!val) return null;
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(val.trim())) return val.trim().slice(0, 5);
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit" });
}

const UZ_MONTHS = ["", "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
const MONTH_LABELS_SHORT = ["", "Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PRESENT:     { label: "Keldi",      color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20" },
  LATE:        { label: "Kech keldi", color: "text-amber-700 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-500/10",   border: "border-amber-200 dark:border-amber-500/20" },
  LATE_EARLY:  { label: "Kech+Erta",  color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10", border: "border-orange-200 dark:border-orange-500/20" },
  ABSENT:      { label: "Kelmadi",    color: "text-rose-700 dark:text-rose-400",     bg: "bg-rose-50 dark:bg-rose-500/10",    border: "border-rose-200 dark:border-rose-500/20" },
  EARLY_LEAVE: { label: "Erta ketdi", color: "text-sky-700 dark:text-sky-400",      bg: "bg-sky-50 dark:bg-sky-500/10",     border: "border-sky-200 dark:border-sky-500/20" },
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, iconBg, progressColor, percent = 100 }: {
  label: string; 
  value: string | number; 
  sub?: string; 
  icon: React.ReactNode; 
  iconBg: string;
  progressColor: string;
  percent?: number;
}) {
  const safePercent = Math.min(Math.max(percent, 0), 100);

  return (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 p-4 rounded-xl transition-all shadow-sm dark:shadow-md backdrop-blur-md flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</span>
        <div className={cn("p-2 rounded-xl border flex items-center justify-center shadow-inner", iconBg)}>
          {icon}
        </div>
      </div>
      
      <div className="mt-3">
        <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
        {sub ? (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{sub}</p>
        ) : (
          <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className={cn("h-full rounded-full transition-all duration-500", progressColor)} 
              style={{ width: `${safePercent}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Attendance Tab ───────────────────────────────────────────────────────────
function AttendanceTab({ employeeId }: { employeeId: string }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: rawData, isLoading } = useQuery<AttendanceResponse | AttendanceRecord[]>({
    queryKey: ["attendance-employee", employeeId, month, year],
    queryFn: () => attendanceApi.employee(employeeId, { month, year }),
  });

  const arr: AttendanceRecord[] = useMemo(() => {
    if (Array.isArray(rawData)) return rawData;
    return rawData?.records ?? [];
  }, [rawData]);

  const serverStats = Array.isArray(rawData) ? null : rawData?.stats;

  const total          = serverStats?.totalDays   ?? arr.length;
  const present        = serverStats?.present     ?? arr.filter((r) => r.status === "PRESENT").length;
  const late           = serverStats?.late        ?? arr.filter((r) => ["LATE", "LATE_EARLY"].includes(r.status)).length;
  const absent         = serverStats?.absent      ?? arr.filter((r) => r.status === "ABSENT").length;
  const totalLateMin   = serverStats?.totalLateMin ?? arr.reduce((s, r) => s + (r.lateMinutes ?? 0), 0);
  const totalLunchLate = arr.reduce((s, r) => s + (r.lunchLateMin ?? 0), 0);
  const totalNetWorkMin = arr.reduce((s, r) => s + (r.netWorkMin ?? 0), 0);

  const monthName = `${UZ_MONTHS[month]} ${year}`;
  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div className="space-y-5">
      {/* Control Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 px-4 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 capitalize min-w-[120px] text-center tracking-wide">
            {monthName}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {totalLunchLate > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
            <Coffee className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Tushlik kechikishi: <strong className="text-amber-800 dark:text-amber-300">{totalLunchLate} daqiqa</strong></span>
          </div>
        )}
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <StatCard 
          label="Jami kun" 
          value={total} 
          percent={100}
          icon={<Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />} 
          iconBg="bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20" 
          progressColor="bg-indigo-600 dark:bg-indigo-500"
        />
        <StatCard 
          label="O'z vaqtida" 
          value={present} 
          percent={total > 0 ? (present / total) * 100 : 0}
          icon={<UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />} 
          iconBg="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" 
          progressColor="bg-emerald-600 dark:bg-emerald-500"
        />
        <StatCard 
          label="Kechikish" 
          value={late} 
          sub={totalLateMin > 0 ? `${totalLateMin} daqiqa` : undefined}
          icon={<Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />} 
          iconBg="bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20" 
          progressColor="bg-amber-600 dark:bg-amber-500"
        />
        <StatCard 
          label="Kelmadi" 
          value={absent} 
          percent={total > 0 ? (absent / total) * 100 : 0}
          icon={<XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />} 
          iconBg="bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20" 
          progressColor="bg-rose-600 dark:bg-rose-500"
        />
        <StatCard 
          label="Sof ish vaqti" 
          value={totalNetWorkMin > 0 ? formatMinutes(totalNetWorkMin) : "—"} 
          sub={totalNetWorkMin > 0 ? `${(totalNetWorkMin / 60).toFixed(1)} soat` : undefined}
          icon={<Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />} 
          iconBg="bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20" 
          progressColor="bg-purple-600 dark:bg-purple-500"
        />
      </div>

      {/* Data Grid Table */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-sm dark:shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-950/60 uppercase tracking-wider text-[11px]">
                {["Sana", "Kelishi kerak", "Ketishi kerak", "Keldi", "Ketdi", "Tushlik", "Ish vaqti", "Kechikish", "Holat"].map((h, idx) => (
                  <th key={h} className={cn("px-4 py-3.5", idx === 8 && "text-right")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {isLoading && [...Array(6)].map((_, i) => (
                <tr key={i}>
                  {[...Array(9)].map((_, j) => (
                    <td key={j} className="px-4 py-3.5"><div className="h-4 rounded bg-slate-200 dark:bg-slate-800/60 animate-pulse" /></td>
                  ))}
                </tr>
              ))}

              {!isLoading && arr.map((r) => {
                const s = STATUS_LABELS[r.status] ?? { label: r.status, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800", border: "border-slate-200 dark:border-slate-700" };
                const shiftStartApi = fmtTimeVal(r.schedule?.shift?.startTime ?? r.shift?.startTime);
                const shiftStartComputed = (r.checkIn && (r.lateMinutes ?? 0) > 0)
                  ? fmt(new Date(new Date(r.checkIn).getTime() - (r.lateMinutes! * 60 * 1000)))
                  : null;
                const shiftStart = shiftStartApi ?? shiftStartComputed;
                const shiftEnd = fmtTimeVal(r.schedule?.shift?.endTime ?? r.shift?.endTime)
                  ?? (r.expectedCheckOut ? fmt(r.expectedCheckOut) : null);
                const isLate = (r.lateMinutes ?? 0) > 0;

                return (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-slate-200 font-mono text-xs whitespace-nowrap">
                      {fmtDate(r.workDate ?? r.date)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{shiftStart ?? "—"}</td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{shiftEnd ?? "—"}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono font-medium">
                      {r.checkIn ? (
                        <span className={isLate ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}>{fmt(r.checkIn)}</span>
                      ) : <span className="text-slate-400 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                      {r.checkOut ? fmt(r.checkOut) : <span className="text-slate-400 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                      {r.lunchOut ? (
                        <span className="text-amber-600 dark:text-amber-400/90 font-mono">
                          {fmt(r.lunchOut)}–{fmt(r.lunchIn)}
                          {(r.lunchLateMin ?? 0) > 0 && <span className="ml-1 text-rose-600 dark:text-rose-400">+{r.lunchLateMin}m</span>}
                        </span>
                      ) : r.checkIn && (r.schedule?.shift?.lunchStart ?? r.shift?.lunchStart) ? (
                        <span className="text-slate-400 dark:text-slate-500 font-mono">
                          {r.schedule?.shift?.lunchStart ?? r.shift?.lunchStart}–{r.schedule?.shift?.lunchEnd ?? r.shift?.lunchEnd}
                        </span>
                      ) : <span className="text-slate-400 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-medium">
                      {(r.netWorkMin ?? 0) > 0 ? (
                        <span className="text-purple-600 dark:text-purple-300">{formatMinutes(r.netWorkMin!)}</span>
                      ) : <span className="text-slate-400 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {isLate ? (
                        <div>
                          <p className="text-amber-600 dark:text-amber-400 font-mono text-xs font-semibold">{shiftStart} → {fmt(r.checkIn)}</p>
                          <p className="text-amber-600/80 dark:text-amber-500/70 text-[10px]">{r.lateMinutes} daqiqa kech</p>
                        </div>
                      ) : <span className="text-slate-400 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <span className={cn("px-2.5 py-1 rounded-md border text-[11px] font-semibold inline-block", s.color, s.bg, s.border)}>
                        {s.label}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {!isLoading && arr.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                    Bu oy uchun davomat ma'lumoti topilmadi
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

// ─── Salary Tab ───────────────────────────────────────────────────────────────
function SalaryTab({ employeeId, baseSalary }: { employeeId: string; baseSalary: number }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: payroll, isLoading: payrollLoading } = useQuery({
    queryKey: ["payroll-employee", employeeId, month, year],
    queryFn: () => payrollApi.employee(employeeId, { month, year }).catch(() => null),
  });

  const { data: preview, isLoading: previewLoading } = useQuery({
    queryKey: ["payroll-preview", employeeId, month, year],
    queryFn: () => payrollApi.preview(employeeId, { month, year }).catch(() => null),
    enabled: !payrollLoading && !payroll,
  });

  const rawData = payroll ?? preview;
  const data = rawData?.preview ?? rawData;
  const isSaved = !!payroll;

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
    staleTime: 5 * 60 * 1000,
  });

  const monthName = `${UZ_MONTHS[month]} ${year}`;
  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const loading = payrollLoading || (previewLoading && !payroll);

  return (
    <div className="space-y-5">
      {/* Month Navigator */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 px-4 backdrop-blur-md shadow-sm w-fit">
        <button onClick={prevMonth} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 capitalize min-w-[120px] text-center tracking-wide">
          {monthName}
        </span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {loading && (
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-6 rounded-lg bg-slate-200 dark:bg-slate-800/60 animate-pulse" />)}
        </div>
      )}

      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Payroll Breakdown Card */}
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-sm dark:shadow-xl flex flex-col justify-between">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm capitalize">{monthName} Hisob-kitobi</h3>
              {isSaved ? (
                <span className={cn(
                  "text-xs font-semibold px-3 py-1 rounded-full border",
                  data.status === "APPROVED" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                )}>
                  {data.status === "APPROVED" ? "✓ Tasdiqlangan" : "⏳ Kutilmoqda"}
                </span>
              ) : (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                  ⚡ Oldindan hisob
                </span>
              )}
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 text-slate-700 dark:text-slate-300">
                <span className="text-slate-500 dark:text-slate-400">Asosiy maosh</span>
                <span className="font-semibold">{formatMoney(data.baseSalary ?? baseSalary)}</span>
              </div>

              {Number(data.lateDeduction ?? 0) > 0 && (
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Kechikish kesimi
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 font-medium">−{formatMoney(data.lateDeduction)}</span>
                </div>
              )}
              {Number(data.absenceDeduction ?? 0) > 0 && (
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Yo'qlik kesimi
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 font-medium">−{formatMoney(data.absenceDeduction)}</span>
                </div>
              )}
              {Number(data.earlyLeaveDeduction ?? 0) > 0 && (
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Erta ketish kesimi</span>
                  <span className="text-rose-600 dark:text-rose-400 font-medium">−{formatMoney(data.earlyLeaveDeduction)}</span>
                </div>
              )}
              {Number(data.overtimeBonus ?? 0) > 0 && (
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Ortiqcha vaqt bonusi</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">+{formatMoney(data.overtimeBonus)}</span>
                </div>
              )}
              {Number(data.manualBonus ?? 0) > 0 && (
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Qo'shimcha bonus</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">+{formatMoney(data.manualBonus)}</span>
                </div>
              )}

              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-2 flex justify-between items-baseline">
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Net Maosh (Qo'lga)</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-2xl tracking-tight">
                  {formatMoney(data.netSalary)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl text-center backdrop-blur-md flex flex-col justify-center shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Ish kunlari</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{data.totalWorkDays ?? data.workDays ?? "—"}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">kun</p>
            </div>
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl text-center backdrop-blur-md flex flex-col justify-center shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Yo'qliklar</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{data.totalAbsences ?? 0}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">kun</p>
            </div>
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl text-center backdrop-blur-md flex flex-col justify-center shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Jami kechikish</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{data.totalLateMinutes ?? data.totalLateMin ?? 0}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">daqiqa</p>
            </div>
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl text-center backdrop-blur-md flex flex-col justify-center shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Overtime</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{data.totalOvertimeMinutes ?? data.totalOvertimeMin ?? 0}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">daqiqa</p>
            </div>
          </div>
        </div>
      )}

      {/* History Section */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-sm dark:shadow-xl">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
            <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">6 oylik maosh tarixi</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {history.map((h: any) => {
              const totalDed = Number(h.lateDeduction ?? 0) + Number(h.absenceDeduction ?? 0) + Number(h.earlyLeaveDeduction ?? 0);
              return (
                <div key={`${h.year}-${h.month}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div>
                    <p className="text-slate-800 dark:text-slate-200 font-semibold">{UZ_MONTHS[h.month]} {h.year}</p>
                    {totalDed > 0 && <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">−{formatMoney(totalDed)} kesim</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{formatMoney(h.netSalary)}</p>
                    {h.status === "APPROVED" && <p className="text-[10px] text-emerald-600/80 dark:text-emerald-500/80">Tasdiqlangan</p>}
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

  const now = new Date();
  const trendMonths = useMemo(() => {
    return [2, 1, 0].map(offset => {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      return { month: d.getMonth() + 1, year: d.getFullYear() };
    });
  }, []);

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
    staleTime: 5 * 60 * 1000,
  });

  const trendData = useMemo(() => {
    return trendMonths.map(({ month, year }, i) => {
      const raw = trendRaw?.[i];
      const arr: AttendanceRecord[] = Array.isArray(raw) ? raw : (raw?.records ?? []);
      const lateMin = raw?.stats?.totalLateMin ?? arr.reduce((s: number, r: AttendanceRecord) => s + (r.lateMinutes ?? 0), 0);
      return { month, year, lateMin };
    });
  }, [trendMonths, trendRaw]);

  const maxLate = useMemo(() => Math.max(...trendData.map(d => d.lateMin), 1), [trendData]);

  if (empLoading) {
    return (
      <div className="p-6 space-y-4">
        <Topbar title="Xodim profili" />
        <div className="space-y-4">
          <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-900/60 animate-pulse border border-slate-300 dark:border-slate-800" />
          <div className="h-20 rounded-2xl bg-slate-200 dark:bg-slate-900/60 animate-pulse border border-slate-300 dark:border-slate-800" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6">
        <Topbar title="Xodim topilmadi" />
        <div className="p-6 text-center text-slate-500 py-20">Xodim topilmadi</div>
      </div>
    );
  }

  const avatarColor = getAvatarColor(employee.fullName);
  const initials = getInitials(employee.fullName);

  return (
    <div className="p-6 space-y-6 font-sans">
      <Topbar
        title={employee.fullName}
        subtitle={`${employee.department?.name ?? ""}${employee.position?.name ? " · " + employee.position.name : ""}`}
      />

      {/* Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Orqaga qaytish
        </button>

        <div className="flex items-center gap-3">
          <span className={cn(
            "text-xs font-semibold px-3 py-1 rounded-full border flex items-center gap-1.5",
            employee.firedAt ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20" : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
          )}>
            <span className={cn("w-2 h-2 rounded-full animate-pulse", employee.firedAt ? "bg-rose-500" : "bg-emerald-500")} />
            {employee.firedAt ? "Ishdan ketgan" : "Aktiv xodim"}
          </span>
        </div>
      </div>

      {/* Hero Header & Trend Section */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">

        {/* Hero Glass Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-r dark:from-slate-900/90 dark:via-indigo-950/40 dark:to-slate-900/90 border border-slate-200 dark:border-indigo-500/15 p-6 backdrop-blur-xl shadow-sm dark:shadow-2xl flex flex-col justify-between">
          <div className="absolute top-0 right-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Photo / Avatar */}
              <div className="relative flex-shrink-0">
                {employee.photoUrl ? (
                  <img 
                    src={buildPhotoUrl(employee.photoUrl)} 
                    alt={employee.fullName}
                    className="w-20 h-20 rounded-2xl object-cover ring-2 ring-indigo-500/30 shadow-xl" 
                  />
                ) : (
                  <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-xl ring-2 ring-indigo-500/30", avatarColor)}>
                    {initials}
                  </div>
                )}
              </div>

              {/* Information */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{employee.fullName}</h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  {employee.position?.name && (
                    <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> {employee.position.name}
                    </span>
                  )}
                  {employee.department?.name && (
                    <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50">
                      <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> {employee.department.name}
                    </span>
                  )}
                  {employee.phone && (
                    <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {employee.phone}
                    </span>
                  )}
                  {employee.employeeNo && (
                    <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50 font-mono">
                      <Hash className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Terminal ID: {employee.employeeNo}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Base Salary Box */}
            <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4 w-full md:w-auto min-w-[220px] flex justify-between items-center shadow-inner">
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Asosiy maosh</p>
                <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wide mt-0.5">
                  {formatMoney(employee.baseSalary)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* 3-Month Late Trend Chart */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-md shadow-sm">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> 3 oylik kechikish trendi
          </p>
          <div className="flex items-end justify-around flex-1 gap-3">
            {trendData.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <span className={cn("text-[11px] font-bold font-mono", d.lateMin > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400 dark:text-slate-600")}>
                  {d.lateMin > 0 ? `${d.lateMin}m` : "—"}
                </span>
                <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-lg h-[64px] flex items-end p-0.5">
                  <div
                    className={cn("w-full rounded-md transition-all duration-300", d.lateMin > 0 ? "bg-amber-500/80 shadow-md shadow-amber-500/20" : "bg-transparent")}
                    style={{ height: `${d.lateMin > 0 ? Math.max((d.lateMin / maxLate) * 100, 12) : 0}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{MONTH_LABELS_SHORT[d.month]}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Tab Controls */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 w-fit">
          <button 
            onClick={() => setTab("attendance")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all",
              tab === "attendance" 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" 
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <Calendar className="w-4 h-4" /> Davomat Tarixi
          </button>
          <button 
            onClick={() => setTab("salary")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all",
              tab === "salary" 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" 
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <DollarSign className="w-4 h-4" /> Maosh Hisobi
          </button>
        </div>

        {/* Tab Views */}
        {tab === "attendance" && <AttendanceTab employeeId={id} />}
        {tab === "salary"     && <SalaryTab employeeId={id} baseSalary={Number(employee.baseSalary) || 0} />}
      </div>
    </div>
  );
}