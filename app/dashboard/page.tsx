"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, photoUrl as buildPhotoUrl } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { formatMoney, formatMinutes, isSuperLike, getInitials, getAvatarColor, cn } from "@/lib/utils";
import {
  Users, UserCheck, TrendingUp, TrendingDown,
  DollarSign, AlertTriangle, Coffee,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";
import dayjs from "dayjs";
import { useAuthStore } from "@/stores/auth";

// ── Stat Card (screenshot stilida) ──────────────
function StatCard({
  label, value, sub, icon: Icon, iconBg, trend, trendLabel,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: any;
  iconBg: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
}) {
  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)] mb-1">{label}</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
          {sub && <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${iconBg}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {trendLabel && (
        <div className="flex items-center gap-1.5 text-xs">
          {trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
          {trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
          <span className={
            trend === "up" ? "text-emerald-400" :
            trend === "down" ? "text-red-400" : "text-[var(--text-muted)]"
          }>
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Custom Tooltip ───────────────────────────────
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

export default function DashboardPage() {
  const today = dayjs().format("YYYY-MM-DD");
  const { user, selectedHospital } = useAuthStore();
  const router = useRouter();
  const targetHospitalId = isSuperLike(user?.role) ? (selectedHospital?.id || undefined) : undefined;

  // MINISTRY role faqat o'z paneliga kirishi kerak
  useEffect(() => {
    if (user?.role === "MINISTRY") {
      router.replace("/dashboard/ministry");
    }
  }, [user?.role, router]);

  // Tez-tez o'zgaradigan ma'lumotlar: 2 daqiqada bir yangilanadi
  const FAST_REFRESH  = 2 * 60 * 1000;
  // Kamroq o'zgaradigan ma'lumotlar: 10 daqiqada bir
  const SLOW_REFRESH  = 10 * 60 * 1000;

  const { data: overview, isLoading } = useQuery({
    queryKey: ["dashboard-overview", today, targetHospitalId],
    queryFn: () => dashboardApi.overview({ date: today, targetHospitalId }),
    refetchInterval: FAST_REFRESH,
  });

  const { data: trend } = useQuery({
    queryKey: ["dashboard-trend", targetHospitalId],
    queryFn: () => dashboardApi.trend({ days: 14, targetHospitalId }),
    refetchInterval: SLOW_REFRESH,
  });

  const { data: topLate } = useQuery({
    queryKey: ["dashboard-top-late", targetHospitalId],
    queryFn: () => dashboardApi.topLate({ limit: 5, targetHospitalId }),
    refetchInterval: SLOW_REFRESH,
  });

  const { data: departments, dataUpdatedAt } = useQuery({
    queryKey: ["dashboard-departments", targetHospitalId],
    queryFn: () => dashboardApi.departments({ targetHospitalId }),
    refetchInterval: SLOW_REFRESH,
  });

  if (isLoading) {
    return (
      <div>
        <Topbar title="Dashboard" subtitle={dayjs().format("DD MMMM YYYY, dddd")} />
        <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-28 animate-pulse bg-[var(--bg-hover)]" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Jami xodimlar",
      value: overview?.totalEmployees ?? 0,
      icon: Users,
      iconBg: "bg-indigo-600",
      sub: "Aktiv xodimlar",
    },
    {
      label: "Bugun kelganlar",
      value: overview?.todayPresent ?? 0,
      icon: UserCheck,
      iconBg: "bg-emerald-600",
      trendLabel: `${overview?.attendanceRate ?? 0}% davomat`,
      trend: "up" as const,
    },
    {
      label: "Kelmagan / Kechikkan",
      value: `${overview?.todayAbsent ?? 0} / ${overview?.todayLate ?? 0}`,
      icon: AlertTriangle,
      iconBg: "bg-amber-600",
      sub: "Bugun",
    },
    {
      label: "Tushlikdan kech",
      value: overview?.todayLunchLate ?? 0,
      icon: Coffee,
      iconBg: "bg-orange-600",
      sub: "Bugun",
    },
    {
      label: "Bu oy maosh fond",
      value: overview?.monthlyPayrollTotal
        ? formatMoney(overview.monthlyPayrollTotal)
        : "—",
      icon: DollarSign,
      iconBg: "bg-violet-600",
      sub: dayjs().format("MMMM YYYY"),
    },
  ];

  return (
    <div>
      <Topbar
        title="Dashboard"
        subtitle={
          dataUpdatedAt
            ? `${dayjs().format("DD MMMM YYYY")} · yangilandi: ${dayjs(dataUpdatedAt).format("HH:mm:ss")}`
            : dayjs().format("DD MMMM YYYY, dddd")
        }
      />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* ── Stats Cards (5 column grid) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
          {/* Attendance trend (2/3 width) */}
          <div className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">Davomat trendi</h3>
                <p className="text-xs text-[var(--text-muted)]">So'nggi 14 kun</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trend || []}>
                <defs>
                  <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => dayjs(v).format("DD/MM")}
                />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }} />
                <Area type="monotone" dataKey="present" name="Keldi" stroke="#6366f1" fill="url(#presentGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="absent" name="Kelmadi" stroke="#f87171" fill="url(#absentGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="late" name="Kechikdi" stroke="#fbbf24" strokeWidth={2} fill="none" strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Top late employees (1/3 width) */}
          <div className="card p-5">
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">Ko'p kechikkanlar</h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">Bu oy</p>
            <div className="space-y-3">
              {(topLate || []).slice(0, 5).map((emp: any, i: number) => (
                <div key={emp.employeeId} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--text-muted)] w-4">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-xs font-semibold text-indigo-400">
                    {emp.name?.[0] ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{emp.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{emp.lateCount} marta kechikdi</p>
                  </div>
                  <span className="badge-yellow">{formatMinutes(emp.totalLateMin)}</span>
                </div>
              ))}
              {(!topLate || topLate.length === 0) && (
                <p className="text-sm text-[var(--text-muted)] text-center py-6">Ma'lumot yo'q</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Department comparison bar chart ── */}
        {departments && departments.length > 0 && (() => {
          // Backend { department: { name }, present, absent, late } → grafik uchun flat qilish
          const deptData = departments.map((d: any) => ({
            name: d.department?.name ?? d.name ?? "—",
            present: d.present ?? 0,
            late:    d.late    ?? 0,
            absent:  d.absent  ?? 0,
          }));
          return (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">Bo'limlar bo'yicha davomat</h3>
                <p className="text-xs text-[var(--text-muted)]">Bu oylik holat</p>
              </div>
            </div>
            {/* Horizontal scroll when many departments */}
            <div className="overflow-x-auto">
              <div style={{ minWidth: Math.max(560, deptData.length * 32) }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={deptData} barCategoryGap="30%" margin={{ bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={-40}
                      textAnchor="end"
                      height={90}
                      tickFormatter={(v: string) => v.length > 16 ? v.slice(0, 16) + "…" : v}
                    />
                    <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }} />
                    <Bar dataKey="present" name="Keldi"    fill="#6366f1" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="late"    name="Kechikdi" fill="#fbbf24" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="absent"  name="Kelmadi"  fill="#f87171" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          );
        })()}

        {/* ── Today's attendance table ── */}
        <div className="card">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-[var(--border)]">
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">Bugungi davomat</h3>
              <p className="text-xs text-[var(--text-muted)]">{today}</p>
            </div>
            <a href="/dashboard/attendance" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              Barchasini ko'rish →
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Xodim", "Bo'lim", "Kelish", "Ketish", "Tushlik", "Holat", "Kechikish"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(overview?.todayAttendances || []).slice(0, 8).map((a: any) => (
                  <tr key={a.id} className="border-b border-[var(--border)] table-row-hover">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-shrink-0">
                          {a.photoUrl
                            ? <img src={buildPhotoUrl(a.photoUrl)} alt={a.employeeName}
                                className="w-7 h-7 rounded-full object-cover ring-1 ring-[var(--border)]" />
                            : <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white",
                                getAvatarColor(a.employeeName || ""))}>
                                {getInitials(a.employeeName || "?")}
                              </div>
                          }
                        </div>
                        <span className="font-medium text-[var(--text-primary)]">{a.employeeName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[var(--text-muted)]">{a.department}</td>
                    <td className="px-5 py-3 font-mono text-[var(--text-primary)]">
                      {a.checkIn ? dayjs(a.checkIn).format("HH:mm") : "—"}
                    </td>
                    <td className="px-5 py-3 font-mono text-[var(--text-muted)]">
                      {a.checkOut ? dayjs(a.checkOut).format("HH:mm") : "—"}
                    </td>
                    {/* Tushlik */}
                    <td className="px-5 py-3 text-xs whitespace-nowrap">
                      {a.lunchOut ? (
                        <div className="flex items-center gap-1">
                          <Coffee className="w-3 h-3 text-orange-400 flex-shrink-0" />
                          <span className="text-orange-400 font-mono">
                            {dayjs(a.lunchOut).format("HH:mm")}–{a.lunchIn ? dayjs(a.lunchIn).format("HH:mm") : "…"}
                          </span>
                          {(a.lunchLateMin ?? 0) > 0 && (
                            <span className="text-red-400 font-semibold ml-0.5">+{a.lunchLateMin}min</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)] opacity-40">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {a.status === "PRESENT"    && <span className="badge-green">Keldi</span>}
                      {a.status === "LATE"        && <span className="badge-yellow">Kechikdi</span>}
                      {a.status === "ABSENT"      && <span className="badge-red">Kelmadi</span>}
                      {a.status === "EARLY_LEAVE" && <span className="badge-blue">Erta ketdi</span>}
                      {a.status === "LATE_EARLY"  && <span className="badge-purple">Kech+Erta</span>}
                    </td>
                    <td className="px-5 py-3 text-[var(--text-muted)]">
                      {a.lateMinutes > 0 ? <span className="text-yellow-400">{formatMinutes(a.lateMinutes)}</span> : "—"}
                    </td>
                  </tr>
                ))}
                {(!overview?.todayAttendances || overview.todayAttendances.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-[var(--text-muted)] text-sm">
                      Bugun uchun ma'lumot yo'q
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
