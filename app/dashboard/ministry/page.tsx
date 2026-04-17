"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ministryApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { formatMoney, cn } from "@/lib/utils";
import { HospitalVideoModal } from "@/components/video/HospitalVideoModal";
import {
  Building2, Users, UserCheck, UserX,
  DollarSign, ChevronRight,
  Phone, BarChart3, Calendar, X, Video,
} from "lucide-react";
import dayjs from "dayjs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "absent" | "payroll";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function AttendanceBadge({ rate }: { rate: number }) {
  const color =
    rate >= 90 ? "text-emerald-400 bg-emerald-400/10" :
    rate >= 70 ? "text-yellow-400 bg-yellow-400/10" :
                 "text-red-400 bg-red-400/10";
  return (
    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", color)}>
      {rate}%
    </span>
  );
}

function ProgressBar({ value, color = "bg-indigo-500" }: { value: number; color?: string }) {
  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all", color)}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

function StatCard({
  label, value, sub, icon: Icon, iconBg,
}: {
  label: string; value: string | number; sub?: string;
  icon: any; iconBg: string;
}) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)] mb-1">{label}</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
          {sub && <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>}
        </div>
        <div className={cn("p-3 rounded-xl", iconBg)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e2638] border border-[#2d3748] rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Hospital Detail Modal ─────────────────────────────────────────────────────

function HospitalDetailModal({
  hospitalId,
  hospitalName,
  date,
  onClose,
}: {
  hospitalId: string;
  hospitalName: string;
  date: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["ministry-hospital-detail", hospitalId, date],
    queryFn: () => ministryApi.hospitalDetail(hospitalId, { date }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20">
              <Building2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">{hospitalName}</h2>
              <p className="text-xs text-[var(--text-muted)]">{date} — batafsil ko'rinish</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Jami xodim", value: data?.summary?.totalEmployees ?? 0, color: "text-indigo-400" },
                { label: "Keldi", value: data?.summary?.todayPresent ?? 0, color: "text-emerald-400" },
                { label: "Kelmadi", value: data?.summary?.todayAbsent ?? 0, color: "text-red-400" },
                { label: "Kechikdi", value: data?.summary?.todayLate ?? 0, color: "text-yellow-400" },
              ].map((s) => (
                <div key={s.label} className="card p-4 text-center">
                  <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Department breakdown */}
            {data?.departmentStats && data.departmentStats.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">Bo'limlar bo'yicha</h3>
                <div className="space-y-3">
                  {data.departmentStats.map((dept: any) => (
                    <div key={dept.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-primary)] font-medium">{dept.name}</span>
                        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                          <span className="text-emerald-400">{dept.present} keldi</span>
                          <span className="text-red-400">{dept.absent} kelmadi</span>
                          <AttendanceBadge rate={dept.attendanceRate} />
                        </div>
                      </div>
                      <ProgressBar
                        value={dept.attendanceRate}
                        color={dept.attendanceRate >= 90 ? "bg-emerald-500" : dept.attendanceRate >= 70 ? "bg-yellow-500" : "bg-red-500"}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top late employees */}
            {data?.topLate && data.topLate.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  Bu oy ko'p kechikkanlar (top {data.topLate.length})
                </h3>
                <div className="space-y-2">
                  {data.topLate.map((emp: any, i: number) => (
                    <div key={emp.employeeId} className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-0">
                      <span className="w-6 text-center text-xs text-[var(--text-muted)] font-mono">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{emp.fullName}</p>
                        <p className="text-xs text-[var(--text-muted)]">{emp.department}</p>
                      </div>
                      <span className="text-xs text-yellow-400 font-semibold">{emp.lateCount} marta</span>
                      <span className="text-xs text-[var(--text-muted)]">{emp.totalLateMin} min</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Absent today */}
            {data?.absentList && data.absentList.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                  Bugun kelmagan xodimlar ({data.absentList.length} kishi)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        {["Xodim", "Bo'lim", "Lavozim", "Telefon", "Ish boshlanishi"].map((h) => (
                          <th key={h} className="text-left pb-2 pr-4 text-xs text-[var(--text-muted)] font-medium uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.absentList.map((emp: any) => (
                        <tr key={emp.employeeId} className="border-b border-[var(--border)] last:border-0">
                          <td className="py-2.5 pr-4 font-medium text-[var(--text-primary)]">{emp.fullName}</td>
                          <td className="py-2.5 pr-4 text-[var(--text-muted)]">{emp.department}</td>
                          <td className="py-2.5 pr-4 text-[var(--text-muted)]">{emp.position}</td>
                          <td className="py-2.5 pr-4">
                            {emp.phone
                              ? <span className="flex items-center gap-1 text-[var(--text-muted)]"><Phone className="w-3 h-3" />{emp.phone}</span>
                              : <span className="text-[var(--text-muted)] opacity-40">—</span>}
                          </td>
                          <td className="py-2.5 text-[var(--text-muted)]">
                            {emp.expectedCheckIn ? dayjs(emp.expectedCheckIn).format("HH:mm") : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MinistryDashboardPage() {
  const today = dayjs().format("YYYY-MM-DD");
  const currentMonth = dayjs().month() + 1;
  const currentYear = dayjs().year();

  const [tab, setTab] = useState<Tab>("overview");
  const [date, setDate] = useState(today);
  const [payrollMonth, setPayrollMonth] = useState(currentMonth);
  const [payrollYear, setPayrollYear] = useState(currentYear);
  const [selectedHospital, setSelectedHospital] = useState<{ id: string; name: string } | null>(null);
  const [videoHospital, setVideoHospital] = useState<{ id: string; name: string } | null>(null);

  // ─── Queries ────────────────────────────────────
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["ministry-overview", date],
    queryFn: () => ministryApi.overview({ date }),
  });

  const { data: absentList, isLoading: absentLoading } = useQuery({
    queryKey: ["ministry-absent", date],
    queryFn: () => ministryApi.absentToday({ date }),
    enabled: tab === "absent",
  });

  const { data: payroll, isLoading: payrollLoading } = useQuery({
    queryKey: ["ministry-payroll", payrollMonth, payrollYear],
    queryFn: () => ministryApi.payrollSummary({ month: payrollMonth, year: payrollYear }),
    enabled: tab === "payroll",
  });

  // ─── Loading skeleton ────────────────────────────
  if (overviewLoading) {
    return (
      <div>
        <Topbar title="Vazirlik Paneli" subtitle="Barcha kasalxonalar monitoring" />
        <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-28 animate-pulse bg-[var(--bg-hover)]" />
          ))}
        </div>
      </div>
    );
  }

  // ─── Prepare bar chart data ──────────────────────
  const chartData = (overview?.hospitals ?? []).map((h: any) => ({
    name: h.name.length > 14 ? h.name.slice(0, 14) + "…" : h.name,
    Keldi: h.todayPresent,
    Kelmadi: h.todayAbsent,
    Kechikdi: h.todayLate,
  }));

  return (
    <div>
      <Topbar
        title="Vazirlik Paneli"
        subtitle={`Barcha kasalxonalar — ${dayjs(date).format("DD MMMM YYYY")}`}
      />

      <div className="p-6 space-y-6">

        {/* ── Top summary stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Jami kasalxonalar"
            value={overview?.totalHospitals ?? 0}
            sub={`${overview?.activeHospitals ?? 0} ta aktiv`}
            icon={Building2}
            iconBg="bg-indigo-600"
          />
          <StatCard
            label="Jami xodimlar"
            value={(overview?.totalEmployees ?? 0).toLocaleString()}
            sub="Barcha kasalxonalar"
            icon={Users}
            iconBg="bg-violet-600"
          />
          <StatCard
            label="Bugun keldi / kelmadi"
            value={`${overview?.todayPresent ?? 0} / ${overview?.todayAbsent ?? 0}`}
            sub={`${overview?.attendanceRate ?? 0}% davomat`}
            icon={UserCheck}
            iconBg="bg-emerald-600"
          />
          <StatCard
            label="Kutilgan oylik fond"
            value={overview?.expectedMonthlySalary ? formatMoney(overview.expectedMonthlySalary) : "—"}
            sub={dayjs().format("MMMM YYYY")}
            icon={DollarSign}
            iconBg="bg-amber-600"
          />
        </div>

        {/* ── Date picker + Tab navigation ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex gap-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-1">
            {[
              { key: "overview", label: "Ko'rinish",    icon: BarChart3 },
              { key: "absent",   label: "Kelmagan",     icon: UserX },
              { key: "payroll",  label: "Maosh xulosasi", icon: DollarSign },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key as Tab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  tab === key
                    ? "bg-indigo-600 text-white"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {(tab === "overview" || tab === "absent") && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                className="input-field text-sm py-1.5 px-3 w-auto"
              />
            </div>
          )}

          {tab === "payroll" && (
            <div className="flex items-center gap-2">
              <select
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(Number(e.target.value))}
                className="input-field text-sm py-1.5 px-3 w-auto"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {dayjs().month(m - 1).format("MMMM")}
                  </option>
                ))}
              </select>
              <select
                value={payrollYear}
                onChange={(e) => setPayrollYear(Number(e.target.value))}
                className="input-field text-sm py-1.5 px-3 w-auto"
              >
                {[currentYear - 1, currentYear].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ══════════════════ OVERVIEW TAB ══════════════════ */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Bar chart */}
            {chartData.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Kasalxonalar bo'yicha davomat</h3>
                <p className="text-xs text-[var(--text-muted)] mb-4">{dayjs(date).format("DD MMMM YYYY")}</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                    />
                    <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }} />
                    <Bar dataKey="Keldi"    fill="#6366f1" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Kelmadi"  fill="#f87171" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Kechikdi" fill="#fbbf24" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Hospital cards grid */}
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">
                Kasalxonalar ro'yxati
                <span className="text-[var(--text-muted)] font-normal text-sm ml-2">
                  (batafsil ko'rish uchun bosing)
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {(overview?.hospitals ?? []).map((h: any) => (
                  <div
                    key={h.id}
                    className="card p-5 flex flex-col hover:border-indigo-500/30 transition-all"
                  >
                    {/* Hospital name + status */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            h.isBlocked ? "bg-red-500" : h.isActive ? "bg-emerald-500" : "bg-gray-500"
                          )} />
                          <p className="font-semibold text-[var(--text-primary)] truncate">{h.name}</p>
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">{h.code}</p>
                        {h.address && (
                          <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{h.address}</p>
                        )}
                      </div>
                      <AttendanceBadge rate={h.attendanceRate} />
                    </div>

                    {/* Progress bar */}
                    <ProgressBar
                      value={h.attendanceRate}
                      color={
                        h.attendanceRate >= 90 ? "bg-emerald-500" :
                        h.attendanceRate >= 70 ? "bg-yellow-500" : "bg-red-500"
                      }
                    />

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="text-center">
                        <p className="text-lg font-bold text-emerald-400">{h.todayPresent}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">Keldi</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-red-400">{h.todayAbsent}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">Kelmadi</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-yellow-400">{h.todayLate}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">Kechikdi</p>
                      </div>
                    </div>

                    {/* Salary */}
                    {h.expectedMonthlySalary > 0 && (
                      <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
                        <span className="text-[var(--text-muted)]">Oylik fond</span>
                        <span className="text-[var(--text-primary)] font-medium">
                          {formatMoney(h.expectedMonthlySalary)}
                        </span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                      <button
                        onClick={() => setSelectedHospital({ id: h.id, name: h.name })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                        Batafsil
                      </button>
                      <button
                        onClick={() => setVideoHospital({ id: h.id, name: h.name })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Video
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ ABSENT TAB ══════════════════ */}
        {tab === "absent" && (
          <div className="card">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">
                  Bugun kelmagan xodimlar
                </h3>
                <p className="text-xs text-[var(--text-muted)]">{dayjs(date).format("DD MMMM YYYY")}</p>
              </div>
              {!absentLoading && absentList && (
                <span className="badge-red">{absentList.length} kishi</span>
              )}
            </div>

            {absentLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !absentList || absentList.length === 0 ? (
              <div className="py-16 text-center">
                <UserCheck className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" />
                <p className="text-[var(--text-muted)]">Barcha xodimlar kelgan!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      {["Kasalxona", "Xodim", "Bo'lim", "Lavozim", "Telefon", "Ish boshlanishi"].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {absentList.map((emp: any) => (
                      <tr key={emp.employeeId} className="border-b border-[var(--border)] table-row-hover">
                        <td className="px-5 py-3 text-[var(--text-muted)] text-xs">{emp.hospitalName}</td>
                        <td className="px-5 py-3 font-medium text-[var(--text-primary)]">{emp.fullName}</td>
                        <td className="px-5 py-3 text-[var(--text-muted)]">{emp.department}</td>
                        <td className="px-5 py-3 text-[var(--text-muted)]">{emp.position}</td>
                        <td className="px-5 py-3 text-[var(--text-muted)]">
                          {emp.phone
                            ? <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{emp.phone}</span>
                            : "—"}
                        </td>
                        <td className="px-5 py-3 text-[var(--text-muted)]">
                          {emp.expectedCheckIn ? dayjs(emp.expectedCheckIn).format("HH:mm") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════ PAYROLL TAB ══════════════════ */}
        {tab === "payroll" && (
          <div className="space-y-4">
            {payrollLoading ? (
              <div className="card flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Totals */}
                {payroll?.totals && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Umumiy base maosh", value: formatMoney(payroll.totals.totalBaseSalary), color: "text-indigo-400" },
                      { label: "Umumiy net maosh", value: formatMoney(payroll.totals.totalNetSalary), color: "text-emerald-400" },
                      { label: "Umumiy jarimalar", value: formatMoney(payroll.totals.totalDeductions), color: "text-red-400" },
                      { label: "Umumiy bonuslar", value: formatMoney(payroll.totals.totalBonuses), color: "text-yellow-400" },
                    ].map((s) => (
                      <div key={s.label} className="card p-4">
                        <p className="text-xs text-[var(--text-muted)] mb-1">{s.label}</p>
                        <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Per-hospital table */}
                <div className="card">
                  <div className="px-5 py-4 border-b border-[var(--border)]">
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      Kasalxonalar bo'yicha maosh xulosasi
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {dayjs().month(payrollMonth - 1).format("MMMM")} {payrollYear}
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)]">
                          {["Kasalxona", "Xodimlar", "Base maosh", "Net maosh", "Jarimalar", "Bonuslar", "Holat"].map((h) => (
                            <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(payroll?.hospitals ?? []).map((h: any) => (
                          <tr key={h.hospitalId} className="border-b border-[var(--border)] table-row-hover">
                            <td className="px-5 py-3 font-medium text-[var(--text-primary)]">{h.hospitalName}</td>
                            <td className="px-5 py-3 text-[var(--text-muted)] text-center">{h.employeeCount}</td>
                            <td className="px-5 py-3 text-[var(--text-muted)]">{formatMoney(h.totalBaseSalary)}</td>
                            <td className="px-5 py-3 text-emerald-400 font-medium">{formatMoney(h.totalNetSalary)}</td>
                            <td className="px-5 py-3 text-red-400">{formatMoney(h.totalDeductions)}</td>
                            <td className="px-5 py-3 text-yellow-400">{formatMoney(h.totalBonuses)}</td>
                            <td className="px-5 py-3">
                              <div className="flex gap-1.5 flex-wrap">
                                {h.paidCount > 0 && (
                                  <span className="badge-green text-[10px]">{h.paidCount} to'landi</span>
                                )}
                                {h.approvedCount > 0 && (
                                  <span className="badge-blue text-[10px]">{h.approvedCount} tasdiqlandi</span>
                                )}
                                {h.draftCount > 0 && (
                                  <span className="badge-yellow text-[10px]">{h.draftCount} draft</span>
                                )}
                                {h.paidCount === 0 && h.approvedCount === 0 && h.draftCount === 0 && (
                                  <span className="text-[var(--text-muted)] text-xs">—</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {(!payroll?.hospitals || payroll.hospitals.length === 0) && (
                          <tr>
                            <td colSpan={7} className="px-5 py-10 text-center text-[var(--text-muted)] text-sm">
                              Ma'lumot yo'q
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Hospital Detail Modal ── */}
      {selectedHospital && (
        <HospitalDetailModal
          hospitalId={selectedHospital.id}
          hospitalName={selectedHospital.name}
          date={date}
          onClose={() => setSelectedHospital(null)}
        />
      )}

      {/* ── Hospital Video Modal ── */}
      {videoHospital && (
        <HospitalVideoModal
          hospitalId={videoHospital.id}
          hospitalName={videoHospital.name}
          onClose={() => setVideoHospital(null)}
        />
      )}
    </div>
  );
}
