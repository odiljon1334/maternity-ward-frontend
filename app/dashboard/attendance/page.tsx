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
  Moon
} from "lucide-react";
import dayjs from "dayjs";

type StatusFilter = "ALL" | "PRESENT" | "LATE" | "ABSENT" | "EARLY_LEAVE";
type ShiftFilter = "ALL" | "DAY" | "NIGHT";

const STATUS_CONFIG: Record<string, { label: string; badgeCls: string }> = {
  PRESENT:     { label: "Keldi",      badgeCls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  LATE:        { label: "Kechikdi",   badgeCls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  ABSENT:      { label: "Kelmadi",    badgeCls: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
  EARLY_LEAVE: { label: "Erta ketdi", badgeCls: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20" },
  LATE_EARLY:  { label: "Kech+Erta",  badgeCls: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
};

export default function AttendancePage() {
  const router = useRouter();
  const { user, selectedHospital } = useAuthStore();
  const targetHospitalId = isSuperLike(user?.role) ? (selectedHospital?.id || undefined) : undefined;
  const params = targetHospitalId ? { targetHospitalId } : undefined;

  // States
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("ALL");

  // API Queries
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["attendance-daily", date, deptFilter, targetHospitalId],
    queryFn: () => attendanceApi.daily({ date, departmentId: deptFilter || undefined, targetHospitalId }),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", targetHospitalId],
    queryFn: () => departmentsApi.list(params),
    staleTime: 10 * 60_000,
  });

  // Handlers
  const handlePrevDay = () => setDate(dayjs(date).subtract(1, "day").format("YYYY-MM-DD"));
  const handleNextDay = () => setDate(dayjs(date).add(1, "day").format("YYYY-MM-DD"));
  const handleResetFilters = () => {
    setSearchQuery("");
    setDeptFilter("");
    setStatusFilter("ALL");
    setShiftFilter("ALL");
  };

  // Aggregation & Metrics
  const summary = useMemo(() => {
    const total = records.length;
    const present = records.filter((r: any) => ["PRESENT", "LATE", "EARLY_LEAVE", "LATE_EARLY"].includes(r.status)).length;
    const absent = records.filter((r: any) => r.status === "ABSENT").length;
    const late = records.filter((r: any) => r.status === "LATE" || r.status === "LATE_EARLY").length;
    const lunchLate = records.filter((r: any) => (r.lunchLateMin ?? 0) > 0).length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, late, lunchLate, rate };
  }, [records]);

  // Client-side Filtering
  const filteredRecords = useMemo(() => {
    return (records as any[]).filter((r: any) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = r.employee?.fullName?.toLowerCase().includes(query);
        const posMatch = r.employee?.position?.name?.toLowerCase().includes(query);
        if (!nameMatch && !posMatch) return false;
      }

      // Status
      if (statusFilter === "PRESENT" && !["PRESENT", "EARLY_LEAVE", "LATE", "LATE_EARLY"].includes(r.status)) return false;
      if (statusFilter === "LATE" && !(r.status === "LATE" || r.status === "LATE_EARLY")) return false;
      if (statusFilter === "ABSENT" && r.status !== "ABSENT") return false;
      if (statusFilter === "EARLY_LEAVE" && !(r.status === "EARLY_LEAVE" || r.status === "LATE_EARLY")) return false;

      // Shift
      if (shiftFilter !== "ALL") {
        const shiftHour = r.expectedCheckIn ? dayjs(r.expectedCheckIn).hour() : null;
        if (shiftHour === null) return false;
        if (shiftFilter === "DAY" && shiftHour >= 14) return false;
        if (shiftFilter === "NIGHT" && shiftHour < 14) return false;
      }

      return true;
    });
  }, [records, searchQuery, statusFilter, shiftFilter]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090a0f] text-slate-800 dark:text-slate-100 p-4 lg:p-6 space-y-5 font-sans transition-colors duration-200">
      <Topbar title="Davomat Monitoringi" subtitle="Xodimlarning kunlik davomat va smena hisoboti" />

      {/* KPI & Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Jami xodimlar</span>
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">{summary.total}</p>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Kelganlar</span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{summary.present}</p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">{summary.rate}%</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Kelmadi</span>
            <UserX className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
          </div>
          <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">{summary.absent}</p>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Kechikkanlar</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          </div>
          <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">{summary.late}</p>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Tushlikdan kech.</span>
            <Coffee className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
          </div>
          <p className="text-xl font-bold font-mono text-orange-600 dark:text-orange-400">{summary.lunchLate}</p>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl backdrop-blur-md shadow-sm flex flex-col justify-between">
          <span className="text-slate-500 dark:text-slate-400 text-xs">Davomat ko'rsatkichi</span>
          <div className="space-y-1">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${summary.rate}%` }}
              />
            </div>
            <p className="text-right text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">{summary.rate}%</p>
          </div>
        </div>
      </div>

      {/* Control Toolbar & Filters */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 rounded-xl backdrop-blur-md shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Date Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1">
              <button 
                onClick={handlePrevDay} 
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition"
                title="Oldingi kun"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 px-3">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                />
              </div>
              <button 
                onClick={handleNextDay} 
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition"
                title="Keyingi kun"
              >
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

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Xodim ismi yoki lavozimi bo'yicha qidiruv..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-slate-800 dark:text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 outline-none transition"
            />
          </div>

          {/* Reset Filters */}
          {(searchQuery || deptFilter || statusFilter !== "ALL" || shiftFilter !== "ALL") && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-2 rounded-lg border border-rose-500/20 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Filtrni tozash
            </button>
          )}
        </div>

        {/* Secondary Filter Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-800/60 text-xs">
          
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 dark:text-slate-500 px-2 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Holat:
            </span>
            {(["ALL", "PRESENT", "LATE", "ABSENT", "EARLY_LEAVE"] as StatusFilter[]).map((st) => (
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
            <button
              onClick={() => setShiftFilter("ALL")}
              className={cn("px-2.5 py-1 rounded transition", shiftFilter === "ALL" ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200")}
            >
              Barcha smenalar
            </button>
            <button
              onClick={() => setShiftFilter("DAY")}
              className={cn("px-2.5 py-1 rounded flex items-center gap-1 transition", shiftFilter === "DAY" ? "bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200")}
            >
              <Sun className="w-3 h-3 text-sky-500 dark:text-sky-400" /> Kunduzgi
            </button>
            <button
              onClick={() => setShiftFilter("NIGHT")}
              className={cn("px-2.5 py-1 rounded flex items-center gap-1 transition", shiftFilter === "NIGHT" ? "bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200")}
            >
              <Moon className="w-3 h-3 text-purple-500 dark:text-purple-400" /> Kechki
            </button>
          </div>

          {/* Department Filter */}
          <div className="ml-auto w-full sm:w-48">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 transition"
            >
              <option value="">Barcha bo'limlar</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden backdrop-blur-md shadow-sm dark:shadow-2xl">
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
              {isLoading && [...Array(8)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(9)].map((_, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                    </td>
                  ))}
                </tr>
              ))}

              {!isLoading && filteredRecords.map((r: any) => {
                const st = STATUS_CONFIG[r.status] || { label: r.status, badgeCls: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700" };
                const shiftHour = r.expectedCheckIn ? dayjs(r.expectedCheckIn).hour() : null;

                return (
                  <tr
                    key={r.id}
                    onClick={() => r.employee?.id && router.push(`/dashboard/employees/${r.employee.id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Employee Profile */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                          {r.employee?.photoUrl ? (
                            <img
                              src={buildPhotoUrl(r.employee.photoUrl)}
                              alt={r.employee.fullName}
                              className="w-full h-full object-cover"
                            />
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
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">ID: {r.employee?.id?.slice(-6) || "—"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Department & Position */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-slate-700 dark:text-slate-300 font-medium">{r.employee?.department?.name || "—"}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{r.employee?.position?.name || "—"}</p>
                    </td>

                    {/* Shift Type */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {shiftHour !== null ? (
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border",
                          shiftHour < 14 
                            ? "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20" 
                            : "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"
                        )}>
                          {shiftHour < 14 ? <Sun className="w-2.5 h-2.5" /> : <Moon className="w-2.5 h-2.5" />}
                          {shiftHour < 14 ? "Kunduzgi" : "Kechki"}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 font-mono">—</span>
                      )}
                    </td>

                    {/* Check In */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-800 dark:text-slate-200 font-semibold">
                      {r.checkIn ? dayjs(r.checkIn).format("HH:mm") : <span className="text-slate-400 dark:text-slate-600 font-normal">—</span>}
                    </td>

                    {/* Check Out */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                      {r.checkOut ? dayjs(r.checkOut).format("HH:mm") : <span className="text-slate-400 dark:text-slate-600 font-normal">—</span>}
                    </td>

                    {/* Lunch Break */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono">
                      {r.lunchOut ? (
                        <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                          <Coffee className="w-3 h-3 flex-shrink-0" />
                          <span>
                            {dayjs(r.lunchOut).format("HH:mm")}–{r.lunchIn ? dayjs(r.lunchIn).format("HH:mm") : "…"}
                          </span>
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
                    </td>

                    {/* Late Minutes */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono">
                      {r.lateMinutes > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">+{formatMinutes(r.lateMinutes)}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">—</span>
                      )}
                    </td>

                    {/* Overtime Minutes */}
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

              {!isLoading && filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                    Kiritilgan filtrlar bo'yicha hech qanday davomat ma'lumoti topilmadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-500">
          <span>Ko'rsatilmoqda: {filteredRecords.length} / {records.length} xodim</span>
          <span>Avtomatik yangilanish: Har 1 daqiqada</span>
        </div>
      </div>
    </div>
  );
}