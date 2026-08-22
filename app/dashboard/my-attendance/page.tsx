/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { attendanceApi, schedulesApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { formatMinutes, cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight,
  Clock, CheckCircle2, XCircle, AlertTriangle,
  TrendingUp, Calendar as CalendarIcon,
  Sun, Moon, Star, Coffee, LogIn, LogOut,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/uz-latn";
import { useAuthStore } from "@/stores/auth";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface AttendanceRecord {
  id: string;
  workDate: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  lunchOut: string | null;
  lunchIn: string | null;
  lunchLateMin: number;
  lateMinutes: number;
  earlyLeaveMin: number;
  overtimeMinutes: number;
  expectedCheckIn: string | null;
  expectedCheckOut: string | null;
  note: string | null;
  schedule?: {
    shift?: {
      type?: string;
      startTime?: string;
      isOvernight?: boolean;
    };
  } | null;
}

interface ScheduleDay {
  id:         string;
  date:       string;           // ISO string
  status:     "WORKING" | "DAY_OFF";
  employeeId: string;
  shift: {
    type:        "DAYTIME" | "NIGHTTIME";
    startTime:   string;        // "08:00"
    endTime:     string;        // "20:00"
    isOvernight: boolean;
  } | null;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, {
  label: string;
  cls: string;
  dotCls: string;
  gradientCls: string;
  icon: any;
}> = {
  PRESENT:     { label: "Keldi",      cls: "bg-emerald-100 text-emerald-700 border-emerald-200", dotCls: "bg-emerald-500", gradientCls: "from-emerald-600 to-emerald-800", icon: CheckCircle2  },
  LATE:        { label: "Kechikdi",   cls: "bg-amber-100 text-amber-700 border-amber-200",       dotCls: "bg-amber-500",   gradientCls: "from-amber-600 to-amber-800",     icon: AlertTriangle },
  ABSENT:      { label: "Kelmadi",    cls: "bg-rose-100 text-rose-700 border-rose-200",          dotCls: "bg-rose-500",    gradientCls: "from-rose-600 to-rose-800",       icon: XCircle       },
  EARLY_LEAVE: { label: "Erta ketdi", cls: "bg-blue-100 text-blue-700 border-blue-200",          dotCls: "bg-blue-500",    gradientCls: "from-blue-600 to-blue-800",       icon: Clock         },
  LATE_EARLY:  { label: "Kech+Erta",  cls: "bg-purple-100 text-purple-700 border-purple-200",    dotCls: "bg-purple-500",  gradientCls: "from-purple-600 to-purple-800",   icon: AlertTriangle },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Schedule yoki attendance record dan smena turini aniqlaydi */
function resolveShiftType(
  scheduleDay: ScheduleDay | undefined,
  record:      AttendanceRecord | undefined,
): "DAY" | "NIGHT" | null {

  if (scheduleDay?.status === "WORKING" && scheduleDay.shift) {
    if (scheduleDay.shift.type === "NIGHTTIME" || scheduleDay.shift.isOvernight) {
      return "NIGHT";
    }
    return "DAY";
  }

  // 2. DAY_OFF — smena yo'q
  if (scheduleDay?.status === "DAY_OFF") return null;

  // 3. Fallback: attendance record dan (grafik yo'q xodim kelgan bo'lsa)
  const recShift = record?.schedule?.shift;
  if (recShift) {
    if (recShift.type === "NIGHTTIME" || recShift.isOvernight) return "NIGHT";
    if (recShift.startTime && parseInt(recShift.startTime) >= 14) return "NIGHT";
    return "DAY";
  }

  return null;
}

dayjs.locale("uz-latn");
/** Bugun, oy va yil uchun */
const NOW = dayjs();

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function MyAttendancePage() {
  const { user } = useAuthStore();
  const [month, setMonth] = useState(NOW.month() + 1);
  const [year, setYear]   = useState(NOW.year());
  const [selectedDate, setSelectedDate] = useState(NOW.format("YYYY-MM-DD"));

  const isCurrentMonth = month === NOW.month() + 1 && year === NOW.year();
  const monthLabel = dayjs(`${year}-${month}-01`).format("MMMM");

  // ── Nav ──────────────────────────────────────────────────────────────────────
  const goPrev = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const goNext = () => {
    if (isCurrentMonth) return;
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // ── Queries ───────────────────────────────────────────────────────────────────

  // Davomat records (oylik)
  const { data, isLoading: recLoading } = useQuery({
    queryKey: ["my-attendance", month, year],
    queryFn:  () => attendanceApi.my({ month, year }),
    staleTime: 2 * 60_000,
  });

  // Schedule (oylik) — smena turini to'g'ri ko'rsatish uchun
  const { data: scheduleData, isLoading: schLoading } = useQuery({
    queryKey: ["my-schedule", month, year],
    queryFn:  () => schedulesApi.my({ month, year }),
    staleTime: 5 * 60_000,
  });

  const isLoading = recLoading || schLoading;

  // ── Derived data ───────────────────────────────────────────────────────────────

  const records: AttendanceRecord[] = data?.records ?? [];
  const stats = data?.stats ?? {};

  // date → record map
  const recordsMap = useMemo(
    () => new Map(records.map(r => [dayjs(r.workDate).format("YYYY-MM-DD"), r])),
    [records],
  );

  // date → schedule map
  const scheduleMap = useMemo(() => {
    const days: ScheduleDay[] = Array.isArray(scheduleData) ? scheduleData : [];
    return new Map(
      days.map(s => [dayjs(s.date).format("YYYY-MM-DD"), s])
    );
  }, [scheduleData]);

  // ── Calendar grid ─────────────────────────────────────────────────────────────

  const calendarDays = useMemo(() => {
    const startOfMonth  = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
    const daysInMonth   = startOfMonth.daysInMonth();
    const startDow      = (startOfMonth.day() + 6) % 7; // Du=0 … Ya=6

    const days: any[] = [];

    // Oldingi oy bo'sh katakchalar
    for (let i = 0; i < startDow; i++) {
      days.push({ empty: true, key: `e-${i}` });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr   = dayjs(`${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`).format("YYYY-MM-DD");
      const dow       = dayjs(dateStr).day(); // 0=Ya, 6=Sh
      const isWeekend = dow === 0 || dow === 6;
      const record    = recordsMap.get(dateStr);
      const schedule  = scheduleMap.get(dateStr);
      const shiftType = resolveShiftType(schedule, record);
      const isFuture  = dayjs(dateStr).isAfter(NOW, "day");

      days.push({
        empty: false,
        key: dateStr,
        day: d,
        dateStr,
        isWeekend,
        isFuture,
        record,
        schedule,
        shiftType, // 'DAY' | 'NIGHT' | null
      });
    }

    return days;
  }, [year, month, recordsMap, scheduleMap]);

  // ── Selected day ────────────────────────────────────────────────────────────

  const selectedRecord   = recordsMap.get(selectedDate);
  const selectedSchedule = scheduleMap.get(selectedDate);
  const selectedDayJs    = dayjs(selectedDate);
  const isSelectedToday   = selectedDate === NOW.format("YYYY-MM-DD");
  const isSelectedWeekend = selectedDayJs.day() === 0 || selectedDayJs.day() === 6;
  const isSelectedFuture  = selectedDayJs.isAfter(NOW, "day");
  const selectedShiftType = resolveShiftType(selectedSchedule, selectedRecord);

  // "Ofisda" — faqat BUGUN va checkIn bor, checkOut yo'q
  const isInOfficeNow = isSelectedToday
    && !!selectedRecord?.checkIn
    && !selectedRecord?.checkOut;

  // ── Stats ───────────────────────────────────────────────────────────────────

  const workDaysPct = stats.totalDays > 0
    ? Math.round(((stats.present ?? 0) + (stats.late ?? 0)) / stats.totalDays * 100)
    : 0;

  const empName = user?.employee?.fullName ?? user?.username ?? "Xodim";

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--bg-page,#f8fafc)] dark:bg-[#090a0f]">
      <Topbar
        title="Mening davomatim"
        subtitle={`${empName} · ${year} yil, ${monthLabel}`}
      />

      <div className="p-4 lg:p-6 space-y-4 max-w-2xl mx-auto">

        {/* ── Oy navigatsiyasi ── */}
        <div className="flex items-center justify-between card p-3">
          <button onClick={goPrev} className="btn-ghost p-2 rounded-xl">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-bold text-[var(--text-primary)]">
            {monthLabel} {year}
          </span>
          <button
            onClick={goNext}
            disabled={isCurrentMonth}
            className="btn-ghost p-2 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* ── Statistika ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-4 h-20 animate-pulse bg-[var(--bg-hover)]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Keldi",     value: stats.present ?? 0,                         icon: CheckCircle2,  color: "text-emerald-400", bg: "bg-emerald-600/15" },
              { label: "Kechikdi",  value: stats.late ?? 0,                            icon: AlertTriangle, color: "text-amber-400",   bg: "bg-amber-600/15"   },
              { label: "Kelmadi",   value: stats.absent ?? 0,                          icon: XCircle,       color: "text-red-400",     bg: "bg-red-600/15"     },
              { label: "Kechikish", value: formatMinutes(stats.totalLateMin ?? 0),     icon: Clock,         color: "text-indigo-400",  bg: "bg-indigo-600/15"  },
            ].map(s => (
              <div key={s.label} className="card p-4 flex items-center gap-3">
                <div className={cn("p-2 rounded-xl flex-shrink-0", s.bg)}>
                  <s.icon className={cn("w-5 h-5", s.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Calendar ── */}
        <div className="card p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-400" />
              <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                Oylik davomat taqvimi
              </h3>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-2.5 text-[10px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />Keldi
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />Kechikdi
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />Kelmadi
              </span>
            </div>
          </div>

          {/* Kun sarlavhalari */}
          <div className="grid grid-cols-7 text-center text-[11px] font-bold text-[var(--text-muted)]">
            {["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"].map(d => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Kunlar */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(item => {
              if (item.empty) return <div key={item.key} className="h-12 sm:h-14" />;

              const rec  = item.record as AttendanceRecord | undefined;
              const st   = rec ? STATUS_MAP[rec.status] : null;
              const isSelected = selectedDate === item.dateStr;
              const isToday    = item.dateStr === NOW.format("YYYY-MM-DD");

              return (
                <button
                  key={item.key}
                  onClick={() => setSelectedDate(item.dateStr)}
                  className={cn(
                    "h-12 sm:h-14 rounded-2xl flex flex-col items-center justify-between p-1.5 border transition-all",
                    isSelected
                      ? "ring-2 ring-indigo-500 border-indigo-500 bg-indigo-500/10"
                      : st
                        ? cn(st.cls, "hover:opacity-80")
                        : item.isWeekend
                          ? "bg-[var(--bg-hover)] opacity-50 border-[var(--border)]"
                          : item.isFuture
                            ? "border-dashed border-[var(--border)] opacity-40"
                            : "border-[var(--border)] hover:bg-[var(--bg-hover)]",
                  )}
                >
                  {/* Tepa: kun + smena icon */}
                  <div className="w-full flex items-center justify-between">
                    <span className={cn(
                      "text-xs font-semibold leading-none",
                      isToday && "text-indigo-500 underline font-bold",
                    )}>
                      {item.day}
                    </span>

                    {/* ✅ Real schedule ga asoslangan smena icon */}
                    {item.isWeekend ? (
                      <Star className="w-3 h-3 text-amber-400/70 flex-shrink-0" />
                    ) : item.shiftType === "NIGHT" ? (
                      <Moon className="w-3 h-3 text-violet-400 flex-shrink-0" />
                    ) : item.shiftType === "DAY" ? (
                      <Sun className="w-3 h-3 text-orange-400 flex-shrink-0" />
                    ) : (
                      // Schedule ham, record ham yo'q — bo'sh
                      <span className="w-3 h-3 flex-shrink-0" />
                    )}
                  </div>

                  {/* Pastki: status dot */}
                  <div className="flex items-center justify-center">
                    {st ? (
                      <span className={cn("w-2 h-2 rounded-full", st.dotCls)} />
                    ) : (
                      <span className="text-[9px] text-[var(--text-muted)] opacity-40">—</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tanlangan kun detail card ── */}
        <SelectedDayCard
          dateStr={selectedDate}
          record={selectedRecord}
          schedule={selectedSchedule}
          shiftType={selectedShiftType}
          isToday={isSelectedToday}
          isWeekend={isSelectedWeekend}
          isFuture={isSelectedFuture}
          isInOfficeNow={isInOfficeNow}
        />

        {/* ── Davomat foizi ── */}
        {!isLoading && stats.totalDays > 0 && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Davomat foizi
                </span>
              </div>
              <span className="text-sm font-bold text-indigo-400">{workDaysPct}%</span>
            </div>
            <div className="h-2.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-700"
                style={{ width: `${workDaysPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1.5">
              <span>{stats.totalDays} ta kun qayd etilgan</span>
              {(stats.totalOvertimeMin ?? 0) > 0 && (
                <span className="text-emerald-400">
                  +{formatMinutes(stats.totalOvertimeMin)} ortiqcha
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SELECTED DAY CARD ────────────────────────────────────────────────────────

interface SelectedDayCardProps {
  dateStr:       string;
  record?:       AttendanceRecord;
  schedule?:     ScheduleDay;
  shiftType:     "DAY" | "NIGHT" | null;
  isToday:       boolean;
  isWeekend:     boolean;
  isFuture:      boolean;
  isInOfficeNow: boolean;
}

function SelectedDayCard({
  dateStr, record, schedule, shiftType,
  isToday, isWeekend, isFuture, isInOfficeNow,
}: SelectedDayCardProps) {
  const dayJs = dayjs(dateStr);
  const st    = record ? STATUS_MAP[record.status] : null;

  // Gradient
  const gradient = isWeekend
    ? "from-slate-600 to-slate-800"
    : isFuture
      ? "from-indigo-700 to-slate-800"
      : st
        ? st.gradientCls
        : "from-slate-700 to-slate-800";

  // Badge text
  const badgeText = isWeekend
    ? "🌴 Dam olish kuni"
    : isFuture
      ? "⏳ Kelajak"
      : isInOfficeNow
        ? "🟢 Ofisdasiz"
        : record
          ? st?.label ?? record.status
          : "📋 Davomat yo'q";

  // Sarlavha
  const title = isWeekend
    ? "Dam olish kuningiz xayrli o'tsin!"
    : isFuture
      ? "Bu kun hali kelmagan"
      : record
        ? `${st?.label ?? record.status} — davomat qayd etilgan`
        : isToday
          ? "Bugun davomat belgilanmagan"
          : "Bu kun uchun davomat yo'q";

  return (
    <div className={cn(
      "rounded-3xl text-white shadow-xl overflow-hidden transition-all duration-300",
      "bg-gradient-to-br", gradient,
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="text-[11px] font-bold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
          {dayJs.format("DD MMMM, dddd")}
        </span>
        <span className="text-[11px] font-semibold bg-white/15 px-3 py-1 rounded-full">
          {badgeText}
        </span>
      </div>

      {/* Title */}
      <div className="px-4 py-2">
        <h4 className="text-base font-bold">{title}</h4>
        {/* Smena turi */}
        {!isWeekend && !isFuture && shiftType && (
          <p className="text-xs text-white/70 mt-0.5 flex items-center gap-1">
            {shiftType === "NIGHT"
              ? <><Moon className="w-3 h-3" /> Kechki smena</>
              : <><Sun  className="w-3 h-3" /> Kunduzgi smena</>
            }
            {schedule?.shift?.startTime && schedule?.shift?.endTime && (
              <span className="ml-1 opacity-80">
                ({schedule.shift.startTime}–{schedule.shift.endTime})
              </span>
            )}
          </p>
        )}
      </div>

      {/* ── Davomat detail rows ── */}
      {record && !isWeekend && !isFuture && (
        <div className="mx-4 mb-4 mt-1 bg-white/10 backdrop-blur-sm rounded-2xl divide-y divide-white/10">

          {/* Kelish */}
          <DetailRow
            icon={<LogIn className="w-3.5 h-3.5" />}
            label="Kelish"
            value={record.checkIn ? dayjs(record.checkIn).format("HH:mm") : "—"}
            sub={record.expectedCheckIn
              ? `Reja: ${dayjs(record.expectedCheckIn).format("HH:mm")}`
              : undefined}
            highlight={record.lateMinutes > 0
              ? { text: `+${record.lateMinutes} daq kechikdi`, cls: "text-amber-300" }
              : record.checkIn
                ? { text: "O'z vaqtida", cls: "text-emerald-300" }
                : undefined}
          />

          {/* Ketish */}
          <DetailRow
            icon={<LogOut className="w-3.5 h-3.5" />}
            label="Ketish"
            value={record.checkOut
              ? dayjs(record.checkOut).format("HH:mm")
              : isInOfficeNow
                ? "Hali ketmagan"
                : "—"}
            sub={record.expectedCheckOut
              ? `Reja: ${dayjs(record.expectedCheckOut).format("HH:mm")}`
              : undefined}
            highlight={record.earlyLeaveMin > 0
              ? { text: `${record.earlyLeaveMin} daq erta ketdi`, cls: "text-rose-300" }
              : record.overtimeMinutes > 0
                ? { text: `+${formatMinutes(record.overtimeMinutes)} ortiqcha`, cls: "text-emerald-300" }
                : undefined}
          />

          {/* Tushlik — faqat bor bo'lsa */}
          {record.lunchOut && (
            <DetailRow
              icon={<Coffee className="w-3.5 h-3.5" />}
              label="Tushlik"
              value={`${dayjs(record.lunchOut).format("HH:mm")} – ${record.lunchIn ? dayjs(record.lunchIn).format("HH:mm") : "…"}`}
              highlight={record.lunchLateMin > 0
                ? { text: `+${record.lunchLateMin} daq kechikdi`, cls: "text-amber-300" }
                : { text: "O'z vaqtida", cls: "text-emerald-300" }}
            />
          )}

          {/* Ish vaqti jami */}
          {record.checkIn && record.checkOut && (
            <DetailRow
              icon={<Clock className="w-3.5 h-3.5" />}
              label="Jami ish vaqti"
              value={formatMinutes(
                dayjs(record.checkOut).diff(dayjs(record.checkIn), "minute")
                - (record.lunchOut && record.lunchIn
                  ? dayjs(record.lunchIn).diff(dayjs(record.lunchOut), "minute")
                  : 0)
              )}
            />
          )}
        </div>
      )}

      {/* Record yo'q, ish kuni, o'tgan kun */}
      {!record && !isWeekend && !isFuture && (
        <p className="px-4 pb-4 text-xs text-white/70">
          Bu sana uchun davomat yozuvi mavjud emas.
        </p>
      )}

      {/* Kelajak */}
      {isFuture && (
        <p className="px-4 pb-4 text-xs text-white/70">
          {schedule?.status === "WORKING"
            ? `Rejalashtirilgan ish kuni${shiftType ? ` (${shiftType === "NIGHT" ? "kechki" : "kunduzgi"} smena)` : ""}.`
            : "Bu kun hali rejalashtirilmagan."}
        </p>
      )}

      {/* Dam olish */}
      {isWeekend && (
        <p className="px-4 pb-4 text-xs text-white/70">
          Bugun dam olish kuni. Vaqtingizni maroqli o&apos;tkazing!
        </p>
      )}
    </div>
  );
}

// ─── DETAIL ROW ───────────────────────────────────────────────────────────────

function DetailRow({
  icon, label, value, sub, highlight,
}: {
  icon:       React.ReactNode;
  label:      string;
  value:      string;
  sub?:       string;
  highlight?: { text: string; cls: string };
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 gap-2">
      <div className="flex items-center gap-2 text-white/70 min-w-0">
        {icon}
        <div>
          <p className="text-[11px]">{label}</p>
          {sub && <p className="text-[10px] opacity-60">{sub}</p>}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold font-mono">{value}</p>
        {highlight && (
          <p className={cn("text-[10px] font-semibold", highlight.cls)}>{highlight.text}</p>
        )}
      </div>
    </div>
  );
}