"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, photoUrl as buildPhotoUrl } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { formatMoney, formatMinutes, isSuperLike, getInitials, getAvatarColor, cn } from "@/lib/utils";
import {
  Users, Clock, DollarSign, CheckCircle2,
  Sparkles, Monitor, ArrowRight, RefreshCw, Coffee
} from "lucide-react";
import dynamic from "next/dynamic";
import dayjs from "dayjs";
import { useAuthStore } from "@/stores/auth";

// Lazy-loaded chartlar
const DashboardCharts = dynamic(
  () => import("@/components/dashboard/DashboardCharts"),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-6 h-72 animate-pulse bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
        <div className="card p-6 h-72 animate-pulse bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
      </div>
    ),
  }
);

const DashboardDeptChart = dynamic(
  () => import("@/components/dashboard/DashboardDeptChart"),
  { 
    ssr: false, 
    loading: () => <div className="card p-6 h-80 animate-pulse bg-slate-100 dark:bg-slate-800/50 rounded-2xl" /> 
  }
);

export default function DashboardPage() {
  const today = dayjs().format("YYYY-MM-DD");
  const { user, selectedHospital } = useAuthStore();
  const router = useRouter();
  const targetHospitalId = isSuperLike(user?.role) ? (selectedHospital?.id || undefined) : undefined;

  useEffect(() => {
    if (user?.role === "MINISTRY") router.replace("/dashboard/ministry");
    if (user?.role === "EMPLOYEE") router.replace("/dashboard/my-attendance");
  }, [user?.role, router]);

  const FAST_REFRESH = 2 * 60 * 1000;
  const SLOW_REFRESH = 10 * 60 * 1000;

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
      <div className="p-4 sm:p-6 space-y-4">
        <div className="card p-8 h-40 animate-pulse bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6 h-36 animate-pulse bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const attendanceRate = overview?.attendanceRate ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d17] text-slate-900 dark:text-slate-100 font-sans">
      <Topbar
        title="Boshqaruv Paneli"
        subtitle={
          dataUpdatedAt
            ? `${dayjs().format("DD MMMM YYYY")} · yangilandi: ${dayjs(dataUpdatedAt).format("HH:mm:ss")}`
            : dayjs().format("DD MMMM YYYY, dddd")
        }
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
        
        {/* ── 1. Header Banner ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-50 via-slate-50 to-purple-50 dark:from-slate-900 dark:via-indigo-950/80 dark:to-slate-900 border border-indigo-200 dark:border-indigo-500/20 p-6 sm:p-8 shadow-sm dark:shadow-xl backdrop-blur-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-semibold">
                <Monitor className="w-3.5 h-3.5" />
                <span>Korxona Boshqaruv Markazi</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Xayrli kun! Korxona holati
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm max-w-xl">
                Bugun <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{overview?.todayPresent ?? 0} nafar xodim</span> ish joyida. Intizom va oylik maoshlar hisobi nazorat ostida.
              </p>
            </div>

            {/* Quick Actions / Stats */}
            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={() => router.push("/dashboard/attendance")}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-500/10 hover:bg-teal-100 dark:hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 text-xs font-semibold transition-all shadow-sm"
              >
                <Monitor className="w-4 h-4" />
                <span>PIN Kiosk Terminali</span>
              </button>
              <button 
                onClick={() => router.push("/agent")}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md hover:shadow-lg shadow-purple-600/20 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Yordamchiga o'tish</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Bugungi Davomat */}
          <div className="card p-5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between hover:border-indigo-500/40 transition-all shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Bugungi Davomat</span>
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {overview?.todayPresent ?? 0}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  / {overview?.totalEmployees ?? 0} nafar
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(attendanceRate, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{attendanceRate}%</span>
              </div>
            </div>
          </div>

          {/* Card 2: Kechikkanlar */}
          <div className="card p-5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between hover:border-amber-500/40 transition-all shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kechikkanlar (Bugun)</span>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {overview?.todayLate ?? 0}
                  </span>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">nafar</span>
                </div>
                <a href="/dashboard/attendance" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-medium">
                  Ko'rish <ArrowRight className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {overview?.todayLunchLate ? `${overview.todayLunchLate} kishi tushlikdan kech` : "Intizom nazoratda"}
              </p>
            </div>
          </div>

          {/* Card 3: Oy Oylik Fondi */}
          <div className="card p-5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {dayjs().format("MMMM")} Oylik Fondi
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {overview?.monthlyPayrollTotal ? formatMoney(overview.monthlyPayrollTotal) : "—"}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Sof hisoblangan</span>
                <a href="/dashboard/payroll" className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-medium">
                  Vedomost <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Card 4: Intizom / Status */}
          <div className="card p-5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between hover:border-purple-500/40 transition-all shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kelmaganlar</span>
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {overview?.todayAbsent ?? 0}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">/ {overview?.totalEmployees ?? 0} kishi</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sababli va sababsiz kelmaganlar</p>
            </div>
          </div>

        </div>

        {/* ── 3. AI Banner Card ── */}
        <div className="card p-5 sm:p-6 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-purple-50 dark:from-purple-950/40 dark:via-slate-900/60 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-500/30 rounded-2xl relative overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 mt-0.5 sm:mt-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                  AI - Korxona Boshqaruv Xulosasi
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Tugmani bosing — AI avtotahlili xodimlarning davomat intizomi, maosh xarajatlari hamda kechikish sabablarini tezda jamlab beradi.
                </p>
              </div>
            </div>
            <button 
              onClick={() => router.push("/agent")}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-600 dark:bg-purple-600/30 hover:bg-purple-700 dark:hover:bg-purple-600/50 text-white dark:text-purple-200 border border-purple-600 dark:border-purple-500/40 text-xs font-semibold whitespace-nowrap transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Hozir tahlil qilish</span>
            </button>
          </div>
        </div>

        {/* ── 4. Dynamic Charts Row ── */}
        <DashboardCharts trend={trend} topLate={topLate} />

        {/* ── 5. Department Bar Chart ── */}
        {departments && departments.length > 0 && (
          <DashboardDeptChart departments={departments} />
        )}

        {/* ── 6. Today Attendance Table ── */}
        <div className="card bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                Bugungi Keldi-Ketdi Aktsiyalari
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {dayjs().format("DD-MMMM, YYYY")} yildagi so'nggi ma'lumotlar
              </p>
            </div>
            <a 
              href="/dashboard/attendance" 
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              <span>Barchasini ko'rish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Xodim</th>
                  <th className="px-5 py-3.5">Bo'lim</th>
                  <th className="px-5 py-3.5">Kelish</th>
                  <th className="px-5 py-3.5">Ketish</th>
                  <th className="px-5 py-3.5">Tushlik</th>
                  <th className="px-5 py-3.5">Holat</th>
                  <th className="px-5 py-3.5">Kechikish</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {(overview?.todayAttendances || []).slice(0, 8).map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {a.photoUrl ? (
                          <img 
                            src={buildPhotoUrl(a.photoUrl)} 
                            alt={a.employeeName}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700" 
                          />
                        ) : (
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white",
                            getAvatarColor(a.employeeName || "")
                          )}>
                            {getInitials(a.employeeName || "?")}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100 leading-none">{a.employeeName}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{a.department || "Xodim"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">{a.department || "—"}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-900 dark:text-slate-100 font-semibold whitespace-nowrap">
                      {a.checkIn ? dayjs(a.checkIn).format("HH:mm") : "—"}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {a.checkOut ? dayjs(a.checkOut).format("HH:mm") : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap">
                      {a.lunchOut ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400">
                          <Coffee className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span className="font-mono font-medium">
                            {dayjs(a.lunchOut).format("HH:mm")}–{a.lunchIn ? dayjs(a.lunchIn).format("HH:mm") : "…"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {a.status === "PRESENT" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                          O'z vaqtida
                        </span>
                      )}
                      {a.status === "LATE" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                          Kechikdi
                        </span>
                      )}
                      {a.status === "ABSENT" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                          Kelmadi
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono whitespace-nowrap">
                      {a.lateMinutes > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">{formatMinutes(a.lateMinutes)}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}