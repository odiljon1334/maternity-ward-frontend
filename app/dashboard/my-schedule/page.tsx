"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { schedulesApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { formatMinutes, cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight,
  Sun, Moon, Coffee, Clock,
  CheckCircle2, XCircle, AlertTriangle,
  CalendarDays, Umbrella, HeartPulse, Star,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/uz";
import { useAuthStore } from "@/stores/auth";

// ─── Konstantalar ────────────────────────────────────────────────────────────

const SCHEDULE_STATUS_MAP: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  WORKING:  { label: "Ish kuni",    cls: "text-indigo-400",  icon: Sun       },
  DAY_OFF:  { label: "Dam olish",   cls: "text-slate-400",   icon: Star      },
  SICK:     { label: "Kasal",       cls: "text-red-400",     icon: HeartPulse},
  VACATION: { label: "Ta'til",      cls: "text-emerald-400", icon: Umbrella  },
  HOLIDAY:  { label: "Bayram",      cls: "text-amber-400",   icon: Star      },
};

const ATTENDANCE_STATUS_MAP: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  PRESENT:     { label: "Keldi",      cls: "badge-green",  icon: CheckCircle2  },
  LATE:        { label: "Kechikdi",   cls: "badge-yellow", icon: AlertTriangle },
  ABSENT:      { label: "Kelmadi",    cls: "badge-red",    icon: XCircle       },
  EARLY_LEAVE: { label: "Erta ketdi", cls: "badge-blue",   icon: Clock         },
  LATE_EARLY:  { label: "Kech+Erta",  cls: "badge-purple", icon: AlertTriangle },
};

// ─── Yordamchi funksiyalar ────────────────────────────────────────────────────

function formatShiftTime(shift: any): string {
  if (!shift) return "—";
  return `${shift.startTime}–${shift.endTime}`;
}

function getShiftIcon(shift: any) {
  if (!shift) return Sun;
  return shift.type === "NIGHTTIME" ? Moon : Sun;
}

// Oyda nechta ish kuni bor (WORKING status)
function countWorkingDays(schedules: any[]): number {
  return schedules.filter((s) => s.status === "WORKING").length;
}

// Keldi + kechikdi (haqiqatda kelganlar)
function countPresent(schedules: any[]): number {
  return schedules.filter(
    (s) => s.attendance && ["PRESENT", "LATE", "EARLY_LEAVE", "LATE_EARLY"].includes(s.attendance.status),
  ).length;
}

// ─── Komponentlar ─────────────────────────────────────────────────────────────

/** Bir kun kartasi — mobil va desktop uchun umumiy */
function DayCard({ schedule, isToday }: { schedule: any; isToday: boolean }) {
  const date       = dayjs(schedule.date);
  const sched      = SCHEDULE_STATUS_MAP[schedule.status] ?? SCHEDULE_STATUS_MAP.WORKING;
  const att        = schedule.attendance ? ATTENDANCE_STATUS_MAP[schedule.attendance.status] : null;
  const ShiftIcon  = getShiftIcon(schedule.shift);
  const isWorkDay  = schedule.status === "WORKING";
  const isDayOff   = !isWorkDay;

  return (
    <div
      className={cn(
        "flex items-center gap-3 sm:gap-4 px-4 py-3 border-b border-[var(--border)] transition-colors",
        isToday && "bg-indigo-500/5",
        isDayOff && "opacity-60",
      )}
    >
      {/* Kun raqami */}
      <div className={cn(
        "w-10 h-10 flex-shrink-0 rounded-xl flex flex-col items-center justify-center text-center",
        isToday ? "bg-indigo-600 text-white" : "bg-[var(--bg-hover)] text-[var(--text-muted)]",
      )}>
        <span className="text-xs leading-none font-medium">
          {date.format("ddd").toUpperCase()}
        </span>
        <span className={cn("text-base font-bold leading-none mt-0.5", isToday && "text-white")}>
          {date.format("DD")}
        </span>
      </div>

      {/* Asosiy ma'lumot */}
      <div className="flex-1 min-w-0">
        {isWorkDay ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <ShiftIcon className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {schedule.shift?.name ?? "Ish kuni"}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              {formatShiftTime(schedule.shift)}
            </span>
            {schedule.shift?.type === "NIGHTTIME" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-300 font-medium">
                Tunda
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <sched.icon className={cn("w-3.5 h-3.5 flex-shrink-0", sched.cls)} />
            <span className={cn("text-sm font-medium", sched.cls)}>{sched.label}</span>
          </div>
        )}

        {/* Haqiqiy kelish/ketish (attendance overlay) */}
        {schedule.attendance && isWorkDay && (
          <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
            {schedule.attendance.checkIn && (
              <span className="font-mono">
                ↑ {dayjs(schedule.attendance.checkIn).format("HH:mm")}
              </span>
            )}
            {schedule.attendance.checkOut && (
              <span className="font-mono">
                ↓ {dayjs(schedule.attendance.checkOut).format("HH:mm")}
              </span>
            )}
            {(schedule.attendance.lateMinutes ?? 0) > 0 && (
              <span className="text-amber-400">
                ⏱ +{formatMinutes(schedule.attendance.lateMinutes)}
              </span>
            )}
            {schedule.attendance.lunchOut && (
              <span className="text-orange-400 flex items-center gap-0.5">
                <Coffee className="w-3 h-3" />
                {dayjs(schedule.attendance.lunchOut).format("HH:mm")}
                {schedule.attendance.lunchIn &&
                  `–${dayjs(schedule.attendance.lunchIn).format("HH:mm")}`}
                {(schedule.attendance.lunchLateMin ?? 0) > 0 &&
                  ` +${schedule.attendance.lunchLateMin}min`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* O'ng tomonda: attendance holati (faqat ish kuni) */}
      {isWorkDay && (
        <div className="flex-shrink-0">
          {att ? (
            <span className={att.cls}>{att.label}</span>
          ) : (
            <span className="text-xs text-[var(--text-muted)]">—</span>
          )}
        </div>
      )}
    </div>
  );
}

/** Yuklanish skeleti */
function SkeletonList() {
  return (
    <div className="divide-y divide-[var(--border)]">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-hover)] animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 rounded bg-[var(--bg-hover)] animate-pulse w-2/3" />
            <div className="h-3 rounded bg-[var(--bg-hover)] animate-pulse w-1/3" />
          </div>
          <div className="w-16 h-5 rounded-full bg-[var(--bg-hover)] animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ─── Asosiy sahifa ────────────────────────────────────────────────────────────

export default function MySchedulePage() {
  const { user } = useAuthStore();
  const now   = dayjs();
  const [month, setMonth] = useState(now.month() + 1);
  const [year,  setYear]  = useState(now.year());

  const isCurrentMonth = month === now.month() + 1 && year === now.year();
  const monthLabel     = dayjs(`${year}-${String(month).padStart(2, "0")}-01`).format("MMMM YYYY");
  const empName        = user?.employee?.fullName ?? user?.username ?? "Xodim";

  const goPrev = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else             { setMonth((m) => m - 1); }
  };

  const goNext = () => {
    // Faqat joriy oydan keyingi 2 oy ruxsat
    const maxDate = now.add(2, "month");
    const current = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
    if (current.isBefore(maxDate, "month")) {
      if (month === 12) { setMonth(1); setYear((y) => y + 1); }
      else              { setMonth((m) => m + 1); }
    }
  };

  const { data: schedules = [], isLoading } = useQuery<any[]>({
    queryKey: ["my-schedule", month, year],
    queryFn:  () => schedulesApi.my({ month, year }),
    staleTime: 5 * 60_000, // 5 daqiqa — grafik tez-tez o'zgarmaydi
  });

  // ── Statistika hisoblash ──────────────────────────────
  const totalWorkDays  = countWorkingDays(schedules);
  const totalPresent   = countPresent(schedules);
  const totalDayOff    = schedules.filter((s) => s.status === "DAY_OFF").length;
  const totalLateMin   = schedules.reduce(
    (sum, s) => sum + (s.attendance?.lateMinutes ?? 0), 0,
  );
  const attendancePct  = totalWorkDays > 0
    ? Math.round((totalPresent / totalWorkDays) * 100)
    : 0;

  // ── Kunlarni guruhlaymiz: o'tgan | bugun | kelgusi ────
  const todayStr = now.format("YYYY-MM-DD");

  const past    = schedules.filter((s) => dayjs(s.date).format("YYYY-MM-DD") <  todayStr);
  const todaySc = schedules.filter((s) => dayjs(s.date).format("YYYY-MM-DD") === todayStr);
  const future  = schedules.filter((s) => dayjs(s.date).format("YYYY-MM-DD") >  todayStr);

  return (
    <div>
      <Topbar
        title="Mening grafigim"
        subtitle={`${empName} · ${monthLabel}`}
      />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-5">

        {/* ── Oy navigatsiyasi ──────────────────────────── */}
        <div className="flex items-center justify-between">
          <button onClick={goPrev} className="btn-ghost p-2" aria-label="Oldingi oy">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-base font-semibold text-[var(--text-primary)]">{monthLabel}</p>
            {isCurrentMonth && (
              <p className="text-xs text-indigo-400 font-medium">Joriy oy</p>
            )}
          </div>
          <button onClick={goNext} className="btn-ghost p-2" aria-label="Keyingi oy">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* ── Statistika kartalar ───────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-4 h-20 animate-pulse bg-[var(--bg-hover)]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Ish kunlari",
                value: totalWorkDays,
                icon: CalendarDays,
                color: "text-indigo-400",
                bg:    "bg-indigo-600/15",
              },
              {
                label: "Kelgan",
                value: totalPresent,
                icon: CheckCircle2,
                color: "text-emerald-400",
                bg:    "bg-emerald-600/15",
              },
              {
                label: "Dam olish",
                value: totalDayOff,
                icon: Star,
                color: "text-slate-400",
                bg:    "bg-slate-600/15",
              },
              {
                label: "Kechikish",
                value: formatMinutes(totalLateMin),
                icon: Clock,
                color: "text-amber-400",
                bg:    "bg-amber-600/15",
              },
            ].map((s) => (
              <div key={s.label} className="card p-4 flex items-center gap-3">
                <div className={cn("p-2 rounded-xl flex-shrink-0", s.bg)}>
                  <s.icon className={cn("w-5 h-5", s.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[var(--text-muted)] truncate">{s.label}</p>
                  <p className="text-base font-bold text-[var(--text-primary)]">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Davomat foizi ─────────────────────────────── */}
        {!isLoading && totalWorkDays > 0 && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Davomat darajasi
              </span>
              <span className="text-sm font-bold text-indigo-400">{attendancePct}%</span>
            </div>
            <div className="h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  attendancePct >= 90
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                    : attendancePct >= 70
                    ? "bg-gradient-to-r from-amber-600  to-amber-400"
                    : "bg-gradient-to-r from-red-600     to-red-400",
                )}
                style={{ width: `${attendancePct}%` }}
              />
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
              {totalPresent} ta kelgan / {totalWorkDays} ta ish kuni
            </p>
          </div>
        )}

        {/* ── Grafik ro'yxati ───────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
            <CalendarDays className="w-4 h-4 text-[var(--text-muted)]" />
            <h3 className="font-semibold text-sm text-[var(--text-primary)]">
              Kunlik grafik
            </h3>
            <span className="ml-auto text-xs text-[var(--text-muted)]">
              {schedules.length} ta kun
            </span>
          </div>

          {isLoading && <SkeletonList />}

          {!isLoading && schedules.length === 0 && (
            <div className="px-5 py-12 text-center text-[var(--text-muted)] text-sm">
              Bu oy uchun grafik tuzilmagan
            </div>
          )}

          {!isLoading && schedules.length > 0 && (
            <>
              {/* Bugun — alohida ajratilgan */}
              {todaySc.map((s) => (
                <DayCard key={s.id} schedule={s} isToday={true} />
              ))}

              {/* Kelgusi kunlar */}
              {future.length > 0 && (
                <>
                  {todaySc.length > 0 && (
                    <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-hover)]">
                      Kelgusi kunlar
                    </div>
                  )}
                  {future.map((s) => (
                    <DayCard key={s.id} schedule={s} isToday={false} />
                  ))}
                </>
              )}

              {/* O'tgan kunlar */}
              {past.length > 0 && (
                <>
                  <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-hover)]">
                    O'tgan kunlar
                  </div>
                  {[...past].reverse().map((s) => (
                    <DayCard key={s.id} schedule={s} isToday={false} />
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* ── Ranglar afsonasi ──────────────────────────── */}
        {!isLoading && schedules.length > 0 && (
          <div className="card p-4">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
              Belgilar
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {[
                { label: "Keldi",      cls: "badge-green"  },
                { label: "Kechikdi",   cls: "badge-yellow" },
                { label: "Kelmadi",    cls: "badge-red"    },
                { label: "Erta ketdi", cls: "badge-blue"   },
                { label: "Dam olish",  cls: "text-slate-400 text-xs" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span className={item.cls}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
