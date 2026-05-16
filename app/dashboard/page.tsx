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
import dynamic from "next/dynamic";
import dayjs from "dayjs";
import { useAuthStore } from "@/stores/auth";

// recharts faqat dashboard sahifasida yuklanadi (SSR o'chirilgan) — ~200KB bundle tejash
const DashboardCharts = dynamic(
  () => import("@/components/dashboard/DashboardCharts"),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        <div className="lg:col-span-2 card p-5 h-64 animate-pulse bg-[var(--bg-hover)]" />
        <div className="card p-5 h-64 animate-pulse bg-[var(--bg-hover)]" />
      </div>
    ),
  }
);
const DashboardDeptChart = dynamic(
  () => import("@/components/dashboard/DashboardDeptChart"),
  { ssr: false, loading: () => <div className="card p-5 h-80 animate-pulse bg-[var(--bg-hover)]" /> }
);

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

        {/* ── Charts row (lazy-loaded) ── */}
        <DashboardCharts trend={trend} topLate={topLate} />

        {/* ── Department comparison bar chart (lazy-loaded) ── */}
        {departments && departments.length > 0 && (
          <DashboardDeptChart departments={departments} />
        )}

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
