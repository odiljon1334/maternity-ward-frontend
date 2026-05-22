"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { dashboardApi, hospitalsApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { formatMoney, formatMinutes, isSuperLike, getInitials, getAvatarColor, cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import dayjs from "dayjs";
import "dayjs/locale/uz";
import {
  BarChart2, TrendingUp, Users, DollarSign,
  Palmtree, Clock, ChevronDown, Loader2,
} from "lucide-react";

// ── Lazy recharts (SSR off) ──────────────────────────────────────────────────
const AnalyticsCharts = dynamic(
  () => import("@/components/dashboard/AnalyticsCharts"),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card p-5 h-72 animate-pulse bg-[var(--bg-hover)]" />
        ))}
      </div>
    ),
  }
);

// ── LEAVE type labels ────────────────────────────────────────────────────────
const LEAVE_TYPE_LABELS: Record<string, string> = {
  VACATION:  "Ta'til",
  SICK:      "Kasal",
  PERSONAL:  "Shaxsiy",
  MATERNITY: "Tuğruq ta'tili",
  UNPAID:    "Haqsiz",
};

const LEAVE_TYPE_COLORS: Record<string, string> = {
  VACATION:  "bg-blue-500/20 text-blue-400",
  SICK:      "bg-red-500/20 text-red-400",
  PERSONAL:  "bg-purple-500/20 text-purple-400",
  MATERNITY: "bg-pink-500/20 text-pink-400",
  UNPAID:    "bg-gray-500/20 text-gray-400",
};

// ── Performance tab ──────────────────────────────────────────────────────────
type PerfTab = "topPerformers" | "mostAbsent" | "mostLate";

function PerformanceTable({
  data, tab, loading,
}: {
  data?: { topPerformers: any[]; mostAbsent: any[]; mostLate: any[] };
  tab: PerfTab;
  loading: boolean;
}) {
  const rows = data?.[tab] ?? [];

  const cols: Record<PerfTab, { label: string; value: (r: any) => string; badge: (r: any) => string }> = {
    topPerformers: {
      label: "Davomat %",
      value: (r) => `${r.attendanceRate}%`,
      badge: (r) =>
        r.attendanceRate >= 90 ? "badge-green" :
        r.attendanceRate >= 75 ? "badge-yellow" : "badge-red",
    },
    mostAbsent: {
      label: "Kelmagan kun",
      value: (r) => `${r.absent} kun`,
      badge: () => "badge-red",
    },
    mostLate: {
      label: "Kechikish",
      value: (r) => formatMinutes(r.totalLateMin),
      badge: () => "badge-yellow",
    },
  };

  if (loading) {
    return (
      <div className="space-y-3 py-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 rounded-lg animate-pulse bg-[var(--bg-hover)]" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return <p className="text-sm text-[var(--text-muted)] text-center py-8">Ma'lumot yo'q</p>;
  }

  return (
    <div className="space-y-2">
      {rows.map((emp: any, i: number) => (
        <div key={emp.employeeId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
          <span className="text-xs text-[var(--text-muted)] w-5 text-center font-medium">{i + 1}</span>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: getAvatarColor(emp.name) }}
          >
            {getInitials(emp.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{emp.name}</p>
            <p className="text-xs text-[var(--text-muted)] truncate">{emp.department}</p>
          </div>
          <span className={cn("badge text-xs px-2 py-0.5 rounded-full font-semibold", cols[tab].badge(emp))}>
            {cols[tab].value(emp)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Leave Stats Card ─────────────────────────────────────────────────────────
function LeaveTypeCard({ data }: { data?: any[] }) {
  if (!data?.length) return <p className="text-sm text-[var(--text-muted)] text-center py-8">Ma'lumot yo'q</p>;

  return (
    <div className="space-y-3">
      {data.map((item: any) => (
        <div key={item.type} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("px-2 py-0.5 rounded text-xs font-medium", LEAVE_TYPE_COLORS[item.type] ?? "bg-gray-500/20 text-gray-400")}>
              {LEAVE_TYPE_LABELS[item.type] ?? item.type}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-400 font-medium">{item.approved} tasdiqlandi</span>
            <span className="text-yellow-400">{item.pending} kutilmoqda</span>
            <span className="text-red-400">{item.rejected} rad etildi</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const superLike = isSuperLike(user?.role);

  const [targetHospitalId, setTargetHospitalId] = useState<string | undefined>();
  const [perfTab, setPerfTab] = useState<PerfTab>("topPerformers");
  const [monthlyRange, setMonthlyRange] = useState(6);

  const tHid = superLike ? targetHospitalId : undefined;

  // ── Hospitals (super admin) ──
  const { data: hospitals } = useQuery({
    queryKey: ["hospitals"],
    queryFn: () => hospitalsApi.list(),
    enabled: superLike,
  });

  // ── Analytics queries ────────────────────────────────────────────────────
  const { data: monthly, isLoading: loadingMonthly } = useQuery({
    queryKey: ["analytics-monthly", monthlyRange, tHid],
    queryFn: () => dashboardApi.analyticsMonthly({ months: monthlyRange, targetHospitalId: tHid }),
  });

  const { data: performance, isLoading: loadingPerf } = useQuery({
    queryKey: ["analytics-performance", tHid],
    queryFn: () =>
      dashboardApi.analyticsPerformance({
        month: dayjs().month() + 1,
        year: dayjs().year(),
        limit: 10,
        targetHospitalId: tHid,
      }),
  });

  const { data: payrollTrend, isLoading: loadingPayroll } = useQuery({
    queryKey: ["analytics-payroll", monthlyRange, tHid],
    queryFn: () => dashboardApi.analyticsPayrollTrend({ months: monthlyRange, targetHospitalId: tHid }),
  });

  const { data: leaves, isLoading: loadingLeaves } = useQuery({
    queryKey: ["analytics-leaves", tHid],
    queryFn: () => dashboardApi.analyticsLeaves({ year: dayjs().year(), targetHospitalId: tHid }),
  });

  const { data: heatmap, isLoading: loadingHeatmap } = useQuery({
    queryKey: ["analytics-heatmap", tHid],
    queryFn: () => dashboardApi.analyticsCheckinHeatmap({ days: 30, targetHospitalId: tHid }),
  });

  // ── Summary stats from monthly data ──────────────────────────────────────
  const totals = (monthly ?? []).reduce(
    (acc: any, m: any) => ({
      present: acc.present + m.present,
      absent: acc.absent + m.absent,
      late: acc.late + m.late,
    }),
    { present: 0, absent: 0, late: 0 }
  );
  const overallRate =
    totals.present + totals.absent > 0
      ? Math.round((totals.present / (totals.present + totals.absent)) * 100)
      : 0;

  const totalPayroll = (payrollTrend ?? []).reduce((s: number, m: any) => s + m.netSalary, 0);

  const loading = loadingMonthly || loadingPerf || loadingPayroll || loadingLeaves || loadingHeatmap;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Topbar title="Chuqur tahlil" />

      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">

        {/* Header controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-400" />
              Tahlil paneli
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              Davomat, maosh va ta'til bo'yicha chuqur statistika
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Months range selector */}
            <div className="relative">
              <select
                value={monthlyRange}
                onChange={(e) => setMonthlyRange(Number(e.target.value))}
                className="input-field pr-8 text-sm appearance-none cursor-pointer"
              >
                <option value={3}>3 oy</option>
                <option value={6}>6 oy</option>
                <option value={12}>12 oy</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
            </div>

            {/* Hospital selector (super admin only) */}
            {superLike && (
              <div className="relative">
                <select
                  value={targetHospitalId ?? ""}
                  onChange={(e) => setTargetHospitalId(e.target.value || undefined)}
                  className="input-field pr-8 text-sm appearance-none cursor-pointer min-w-[160px]"
                >
                  <option value="">Barcha kasalxonalar</option>
                  {(hospitals ?? []).map((h: any) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
              </div>
            )}

            {loading && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
          </div>
        </div>

        {/* ── KPI Summary Cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            iconBg="bg-indigo-600"
            label="Davomat darajasi"
            value={`${overallRate}%`}
            sub={`So'nggi ${monthlyRange} oy`}
            valueColor={overallRate >= 90 ? "text-emerald-400" : overallRate >= 75 ? "text-yellow-400" : "text-red-400"}
          />
          <KpiCard
            icon={<Users className="w-5 h-5 text-white" />}
            iconBg="bg-emerald-600"
            label="Jami keldi"
            value={totals.present.toLocaleString()}
            sub={`${totals.absent} kelmadi`}
          />
          <KpiCard
            icon={<Clock className="w-5 h-5 text-white" />}
            iconBg="bg-amber-600"
            label="Kechikishlar"
            value={totals.late.toLocaleString()}
            sub={`So'nggi ${monthlyRange} oy`}
          />
          <KpiCard
            icon={<DollarSign className="w-5 h-5 text-white" />}
            iconBg="bg-blue-600"
            label="Jami maosh"
            value={formatMoney(totalPayroll)}
            sub={`So'nggi ${monthlyRange} oy`}
          />
        </div>

        {/* ── Charts Row 1: Monthly Attendance + Payroll Trend ──────────────── */}
        <AnalyticsCharts
          monthly={monthly ?? []}
          payrollTrend={payrollTrend ?? []}
          heatmap={heatmap ?? []}
          leaveMonthly={leaves?.monthlyApproved ?? []}
        />

        {/* ── Row 2: Performance + Leave Stats ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Employee Performance Ranking */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  Xodim reytingi
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {dayjs().format("MMMM YYYY")} oyi bo'yicha
                </p>
              </div>
            </div>

            {/* Tab selector */}
            <div className="flex gap-1 mb-4 p-1 bg-[var(--bg-hover)] rounded-lg">
              {(
                [
                  { key: "topPerformers", label: "Top" },
                  { key: "mostAbsent",    label: "Ko'p kelmagan" },
                  { key: "mostLate",      label: "Ko'p kechikkan" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setPerfTab(key)}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                    perfTab === key
                      ? "bg-indigo-600 text-white shadow"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <PerformanceTable data={performance} tab={perfTab} loading={loadingPerf} />
          </div>

          {/* Leave Statistics */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Palmtree className="w-4 h-4 text-emerald-400" />
                  Ta'til statistikasi
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {dayjs().year()} yil bo'yicha
                </p>
              </div>
            </div>

            {loadingLeaves ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 rounded-lg animate-pulse bg-[var(--bg-hover)]" />
                ))}
              </div>
            ) : (
              <>
                <LeaveTypeCard data={leaves?.byType} />
                {/* Summary */}
                {(leaves?.byType ?? []).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-3 gap-3">
                    {[
                      {
                        label: "Tasdiqlangan",
                        count: (leaves?.byType ?? []).reduce((s: number, t: any) => s + t.approved, 0),
                        color: "text-emerald-400",
                      },
                      {
                        label: "Kutilmoqda",
                        count: (leaves?.byType ?? []).reduce((s: number, t: any) => s + t.pending, 0),
                        color: "text-yellow-400",
                      },
                      {
                        label: "Rad etildi",
                        count: (leaves?.byType ?? []).reduce((s: number, t: any) => s + t.rejected, 0),
                        color: "text-red-400",
                      },
                    ].map(({ label, count, color }) => (
                      <div key={label} className="text-center p-2 bg-[var(--bg-hover)] rounded-lg">
                        <p className={cn("text-xl font-bold", color)}>{count}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon, iconBg, label, value, sub, valueColor,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <div className={cn("p-2 rounded-lg", iconBg)}>{icon}</div>
      </div>
      <div>
        <p className={cn("text-2xl font-bold", valueColor ?? "text-[var(--text-primary)]")}>{value}</p>
        {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
