"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { attendanceApi, departmentsApi, photoUrl as buildPhotoUrl } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { useAuthStore } from "@/stores/auth";
import { getInitials, getAvatarColor, formatMinutes, cn, isSuperLike } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Coffee,
  Search,
  Filter,
  RotateCcw,
  Clock,
  UserCheck,
  UserX,
  AlertTriangle,
  Sun,
  Moon,
  CalendarOff,
  Palmtree,
} from "lucide-react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

// ─── TYPES ────────────────────────────────────────────────────────────────────

type StatusFilter = "ALL" | "PRESENT" | "LATE" | "ABSENT" | "EARLY_LEAVE" | "NO_SCHEDULE";
type ShiftFilter  = "ALL" | "DAY" | "NIGHT";

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; badgeCls: string }> = {
  PRESENT:     { label: "Keldi",        badgeCls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  LATE:        { label: "Kechikdi",     badgeCls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  ABSENT:      { label: "Kelmadi",      badgeCls: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
  EARLY_LEAVE: { label: "Erta ketdi",   badgeCls: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20" },
  LATE_EARLY:  { label: "Kech+Erta",    badgeCls: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  // Backend dan keladi — DB ga yozilmaydi, virtual object
  NO_SCHEDULE: { label: "Grafik yo'q",  badgeCls: "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-400/20" },
};

// Keldi deb hisoblanadigan statuslar
const PRESENT_STATUSES = new Set(["PRESENT", "LATE", "EARLY_LEAVE", "LATE_EARLY"]);

// ─── WEEKEND HELPER ───────────────────────────────────────────────────────────

function isWeekend(dateStr: string): boolean {
  const day = dayjs(dateStr).day(); // 0=Yakshanba, 6=Shanba
  return day === 0 || day === 6;
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const router = useRouter();
  const { user, selectedHospital } = useAuthStore();
  const targetHospitalId = isSuperLike(user?.role) ? (selectedHospital?.id || undefined) : undefined;
  const params = targetHospitalId ? { targetHospitalId } : undefined;

  const [date, setDate]               = useState(dayjs().format("YYYY-MM-DD"));
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [shiftFilter, setShiftFilter]   = useState<ShiftFilter>("ALL");

  const weekend = isWeekend(date);

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["attendance-daily", date, deptFilter, targetHospitalId],
    queryFn:  () => attendanceApi.daily({ date, departmentId: deptFilter || undefined, targetHospitalId }),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", targetHospitalId],
    queryFn:  () => departmentsApi.list(params),
    staleTime: 10 * 60_000,
  });

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handlePrevDay = () => setDate(dayjs(date).subtract(1, "day").format("YYYY-MM-DD"));
  const handleNextDay = () => setDate(dayjs(date).add(1, "day").format("YYYY-MM-DD"));
  const handleResetFilters = () => {
    setSearchQuery("");
    setDeptFilter("");
    setStatusFilter("ALL");
    setShiftFilter("ALL");
  };

  // ── Summary ───────────────────────────────────────────────────────────────────

  const summary = useMemo(() => {
    const all        = records as any[];
    const total      = all.length;
    const present    = all.filter(r => PRESENT_STATUSES.has(r.status)).length;
    const absent     = all.filter(r => r.status === "ABSENT").length;
    const late       = all.filter(r => r.status === "LATE" || r.status === "LATE_EARLY").length;
    const lunchLate  = all.filter(r => (r.lunchLateMin ?? 0) > 0).length;
    const noSchedule = all.filter(r => r.status === "NO_SCHEDULE").length;

    // Rate: grafik yo'q xodimlarni denominator dan olib tashlaymiz
    const scheduledTotal = total - noSchedule;
    const rate = scheduledTotal > 0 ? Math.round((present / scheduledTotal) * 100) : 0;

    return { total, present, absent, late, lunchLate, noSchedule, rate };
  }, [records]);

  // ── Client-side Filtering ─────────────────────────────────────────────────────

  const filteredRecords = useMemo(() => {
    return (records as any[]).filter(r => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !r.employee?.fullName?.toLowerCase().includes(q) &&
          !r.employee?.position?.name?.toLowerCase().includes(q)
        ) return false;
      }

      // Status filter
      switch (statusFilter) {
        case "PRESENT":     if (!PRESENT_STATUSES.has(r.status)) return false; break;
        case "LATE":        if (r.status !== "LATE" && r.status !== "LATE_EARLY") return false; break;
        case "ABSENT":      if (r.status !== "ABSENT") return false; break;
        case "EARLY_LEAVE": if (r.status !== "EARLY_LEAVE" && r.status !== "LATE_EARLY") return false; break;
        case "NO_SCHEDULE": if (r.status !== "NO_SCHEDULE") return false; break;
      }

      // Shift filter — NO_SCHEDULE xodimlarga smena yo'q, DAY/NIGHT filtrdan o'tkazmaymiz
      if (shiftFilter !== "ALL") {
        if (r.status === "NO_SCHEDULE") return false;
        const isNight = r.schedule?.shift?.type === "NIGHTTIME" ||
          (r.expectedCheckIn ? dayjs(r.expectedCheckIn).hour() >= 14 : false);
        if (shiftFilter === "DAY"   &&  isNight) return false;
        if (shiftFilter === "NIGHT" && !isNight) return false;
      }

      return true;
    });
  }, [records, searchQuery, statusFilter, shiftFilter]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090a0f] text-slate-800 dark:text-slate-100 p-4 lg:p-6 space-y-5 font-sans transition-colors duration-200">
      <Topbar title="Davomat Monitoringi" subtitle="Xodimlarning kunlik davomat va smena hisoboti" />

      {/* Weekend Banner */}
      {weekend && (
        <div className="flex items-center gap-3 bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 rounded-xl px-4 py-3 text-sm font-medium">
          <Palmtree className="w-4 h-4 flex-shrink-0" />
          <span>
            {dayjs(date).day() === 6 ? "Shanba" : "Yakshanba"} — dam olish kuni.
            Xodimlar ABSENT hisoblanmaydi.
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Jami */}
        <KpiCard
          label="Jami xodimlar"
          value={summary.total}
          icon={<Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />}
          valueClass="text-slate-900 dark:text-slate-100"
        />
        {/* Kelganlar */}
        <KpiCard
          label="Kelganlar"
          value={summary.present}
          icon={<UserCheck className="w-3.5 h-3.5 text-emerald-500" />}
          valueClass="text-emerald-600 dark:text-emerald-400"
          suffix={`${summary.rate}%`}
        />
        {/* Kelmadi */}
        <KpiCard
          label="Kelmadi"
          value={summary.absent}
          icon={<UserX className="w-3.5 h-3.5 text-rose-500" />}
          valueClass="text-rose-600 dark:text-rose-400"
        />
        {/* Kechikkan */}
        <KpiCard
          label="Kechikkanlar"
          value={summary.late}
          icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
          valueClass="text-amber-600 dark:text-amber-400"
        />
        {/* Tushlikdan kech */}
        <KpiCard
          label="Tushlikdan kech."
          value={summary.lunchLate}
          icon={<Coffee className="w-3.5 h-3.5 text-orange-500" />}
          valueClass="text-orange-600 dark:text-orange-400"
        />
        {/* Grafik yo'q */}
        <KpiCard
          label="Grafik yo'q"
          value={summary.noSchedule}
          icon={<CalendarOff className="w-3.5 h-3.5 text-slate-400" />}
          valueClass="text-slate-500 dark:text-slate-400"
        />
      </div>

      {/* Davomat ko'rsatkichi — alohida full-width card */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-sm flex items-center gap-4">
        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Davomat ko'rsatkichi</span>
        <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${summary.rate}%` }}
          />
        </div>
        <span className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400 w-10 text-right">
          {summary.rate}%
        </span>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">

          {/* Date Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1">
              <button onClick={handlePrevDay} className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 px-3">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="bg-transparent text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                />
              </div>
              <button onClick={handleNextDay} className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {date !== dayjs().format("YYYY-MM-DD") && (
              <button
                onClick={() => setDate(dayjs().format("YYYY-MM-DD"))}
                className="text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg transition"
              >
                Bugun
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Xodim ismi yoki lavozimi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-slate-800 dark:text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 outline-none transition"
            />
          </div>

          {/* Reset */}
          {(searchQuery || deptFilter || statusFilter !== "ALL" || shiftFilter !== "ALL") && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-2 rounded-lg border border-rose-500/20 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Filtrni tozash
            </button>
          )}
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-800/60 text-xs">

          {/* Status Filter — NO_SCHEDULE ham qo'shildi */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 px-2 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Holat:
            </span>
            {(["ALL", "PRESENT", "LATE", "ABSENT", "EARLY_LEAVE", "NO_SCHEDULE"] as StatusFilter[]).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-2.5 py-1 rounded font-medium transition",
                  statusFilter === st
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
                )}
              >
                {st === "ALL" ? "Barchasi" : STATUS_CONFIG[st]?.label || st}
              </button>
            ))}
          </div>

          {/* Shift Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            {(["ALL", "DAY", "NIGHT"] as ShiftFilter[]).map(sf => (
              <button
                key={sf}
                onClick={() => setShiftFilter(sf)}
                className={cn(
                  "px-2.5 py-1 rounded flex items-center gap-1 transition",
                  shiftFilter === sf
                    ? sf === "DAY"
                      ? "bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30"
                      : sf === "NIGHT"
                        ? "bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                {sf === "DAY"   && <Sun  className="w-3 h-3 text-sky-500" />}
                {sf === "NIGHT" && <Moon className="w-3 h-3 text-purple-500" />}
                {sf === "ALL" ? "Barcha smenalar" : sf === "DAY" ? "Kunduzgi" : "Kechki"}
              </button>
            ))}
          </div>

          {/* Department Filter */}
          <div className="ml-auto w-full sm:w-48">
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 transition"
            >
              <option value="">Barcha bo'limlar</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id} className="bg-white dark:bg-slate-900">
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-380px)]">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-100/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider z-20">
              <tr>
                <th className="px-4 py-3">Xodim</th>
                <th className="px-4 py-3">Bo'lim / Lavozim</th>
                <th className="px-4 py-3">Smena</th>
                <th className="px-4 py-3">Kelish</th>
                <th className="px-4 py-3">Ketish</th>
                <th className="px-4 py-3">Tushlik</th>
                <th className="px-4 py-3">Holat</th>
                <th className="px-4 py-3">Kechikish</th>
                <th className="px-4 py-3">Overtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">

              {/* Skeleton */}
              {isLoading && [...Array(8)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(9)].map((_, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                    </td>
                  ))}
                </tr>
              ))}

              {/* Rows */}
              {!isLoading && filteredRecords.map((r: any) => {
                const isNoSchedule = r.status === "NO_SCHEDULE";
                const st = STATUS_CONFIG[r.status] ?? {
                  label: r.status,
                  badgeCls: "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300",
                };
                const hasSchedule = !!r.schedule || !!r.expectedCheckIn;
                const isNight = r.schedule?.shift?.type === "NIGHTTIME" ||
                  (r.expectedCheckIn ? dayjs(r.expectedCheckIn).hour() >= 14 : false);

                return (
                  <tr
                    key={r.id}
                    onClick={() => r.employee?.id && router.push(`/dashboard/employees/${r.employee.id}`)}
                    className={cn(
                      "transition-colors cursor-pointer group",
                      // NO_SCHEDULE — biroz xira ko'rinish
                      isNoSchedule
                        ? "bg-slate-50/60 dark:bg-slate-900/30 hover:bg-slate-100/80 dark:hover:bg-slate-800/30 opacity-70"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    )}
                  >
                    {/* Employee */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                          {r.employee?.photoUrl ? (
                            <img src={buildPhotoUrl(r.employee.photoUrl)} alt={r.employee.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <div className={cn("w-full h-full flex items-center justify-center font-bold text-[10px] text-white", getAvatarColor(r.employee?.fullName || ""))}>
                              {getInitials(r.employee?.fullName || "?")}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {r.employee?.fullName || "—"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            ID: {r.employee?.id?.slice(-6) || "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Department & Position */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-slate-700 dark:text-slate-300 font-medium">{r.employee?.department?.name || "—"}</p>
                      <p className="text-[10px] text-slate-400">{r.employee?.position?.name || "—"}</p>
                    </td>

                    {/* Shift — NO_SCHEDULE da CalendarOff icon */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isNoSchedule ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                          <CalendarOff className="w-3 h-3" /> Grafik yo'q
                        </span>
                      ) : hasSchedule ? (
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border",
                          !isNight
                            ? "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20"
                            : "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"
                        )}>
                          {!isNight ? <Sun className="w-2.5 h-2.5" /> : <Moon className="w-2.5 h-2.5" />}
                          {!isNight ? "Kunduzgi" : "Kechki"}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 font-mono">—</span>
                      )}
                    </td>

                    {/* Check In */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {r.checkIn ? dayjs(r.checkIn).format("HH:mm") : <span className="text-slate-400 dark:text-slate-600 font-normal">—</span>}
                    </td>

                    {/* Check Out */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                      {r.checkOut ? dayjs(r.checkOut).format("HH:mm") : <span className="text-slate-400 dark:text-slate-600 font-normal">—</span>}
                    </td>

                    {/* Lunch */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono">
                      {r.lunchOut ? (
                        <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                          <Coffee className="w-3 h-3 flex-shrink-0" />
                          <span>{dayjs(r.lunchOut).format("HH:mm")}–{r.lunchIn ? dayjs(r.lunchIn).format("HH:mm") : "…"}</span>
                          {(r.lunchLateMin ?? 0) > 0 && (
                            <span className="text-rose-600 dark:text-rose-400 font-bold ml-1">+{r.lunchLateMin}m</span>
                          )}
                        </div>
                      ) : r.checkIn && r.schedule?.shift?.lunchStart ? (
                        <span className="text-slate-400 dark:text-slate-600 text-[11px]">
                          {r.schedule.shift.lunchStart}–{r.schedule.shift.lunchEnd}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">—</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border inline-block", st.badgeCls)}>
                        {st.label}
                      </span>
                      {/* Note (dam olish kuni yoki grafik yo'q) */}
                      {r.note && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{r.note}</p>
                      )}
                    </td>

                    {/* Late */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono">
                      {r.lateMinutes > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">+{formatMinutes(r.lateMinutes)}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">—</span>
                      )}
                    </td>

                    {/* Overtime */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono">
                      {r.overtimeMinutes > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{formatMinutes(r.overtimeMinutes)}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Empty */}
              {!isLoading && filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                    Kiritilgan filtrlar bo'yicha hech qanday ma'lumot topilmadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Ko'rsatilmoqda: {filteredRecords.length} / {records.length} xodim</span>
          <span>Avtomatik yangilanish: Har 1 daqiqada</span>
        </div>
      </div>
    </div>
  );
}

// ─── KPI CARD (sub-component) ─────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon,
  valueClass,
  suffix,
}: {
  label:      string;
  value:      number;
  icon:       React.ReactNode;
  valueClass: string;
  suffix?:    string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-sm">
      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
        <span>{label}</span>
        {icon}
      </div>
      <div className="flex items-baseline justify-between">
        <p className={cn("text-xl font-bold font-mono", valueClass)}>{value}</p>
        {suffix && <span className="text-[10px] text-slate-400 dark:text-slate-500">{suffix}</span>}
      </div>
    </div>
  );
}