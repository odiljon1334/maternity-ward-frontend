"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { schedulesApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight,
  Sun, Moon, Star,
  CalendarDays, Sparkles, Briefcase, Coffee,
} from "lucide-react";
import dayjs from "dayjs";
import { useAuthStore } from "@/stores/auth";

const WEEKDAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

// ─── CALENDAR ─────────────────────────────────────────────────────────────────

function CompactScheduleCalendar({
  schedules,
  year,
  month,
  isLoading,
}: {
  schedules: any[];
  year:      number;
  month:     number;
  isLoading: boolean;
}) {
  const startOfMonth   = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
  const daysInMonth    = startOfMonth.daysInMonth();
  const startDayOfWeek = (startOfMonth.day() + 6) % 7; // Du=0 … Ya=6
  const todayStr       = dayjs().format("YYYY-MM-DD");

  const scheduleMap = new Map(
    schedules.map(s => [dayjs(s.date).format("YYYY-MM-DD"), s])
  );

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] p-5 shadow-xl backdrop-blur-xl space-y-4">
      {/* Bg glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border)] relative z-10">
        <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-500 dark:text-indigo-400">
          <CalendarDays className="w-4 h-4" />
        </div>
        <h3 className="font-extrabold text-sm text-[var(--text-primary)] tracking-wide">
          Oylik ish grafiki taqvimi
        </h3>

        {/* Legend */}
        <div className="ml-auto flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <Sun  className="w-3 h-3 text-amber-400" /> Kunduzgi
          </span>
          <span className="flex items-center gap-1">
            <Moon className="w-3 h-3 text-indigo-400" /> Kechki
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-slate-400" /> Dam olish
          </span>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center relative z-10">
        {WEEKDAYS.map((d, i) => (
          <span
            key={d}
            className={cn(
              "text-xs font-extrabold uppercase tracking-wider py-1",
              i >= 5
                ? "text-rose-500 dark:text-rose-400"
                : "text-[var(--text-muted)]"
            )}
          >
            {d}
          </span>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1.5 relative z-10">
        {/* Empty cells */}
        {[...Array(startDayOfWeek)].map((_, i) => (
          <div key={`e-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {[...Array(daysInMonth)].map((_, i) => {
          const dayNum  = i + 1;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const schedule   = scheduleMap.get(dateStr);
          const isToday    = dateStr === todayStr;
          const hasData    = !!schedule;
          const isWorkDay  = hasData && schedule.status === "WORKING";
          const isDayOff   = hasData && schedule.status === "DAY_OFF";
          const isNight    = isWorkDay && schedule?.shift?.type === "NIGHTTIME";

          // Skeleton
          if (isLoading) {
            return (
              <div
                key={dateStr}
                className="aspect-square rounded-2xl bg-[var(--bg-hover)] animate-pulse"
              />
            );
          }

          return (
            <div
              key={dateStr}
              title={
                !hasData    ? "Grafik belgilanmagan"
                : isDayOff  ? "Dam olish kuni"
                : isNight   ? `Kechki smena: ${schedule.shift?.startTime ?? ""}–${schedule.shift?.endTime ?? ""}`
                :             `Kunduzgi smena: ${schedule.shift?.startTime ?? ""}–${schedule.shift?.endTime ?? ""}`
              }
              className={cn(
                "aspect-square rounded-2xl p-1.5 flex flex-col justify-between transition-all border",
                isToday
                  ? "bg-indigo-500/20 border-indigo-500/60 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/20"
                  : isWorkDay && isNight
                    ? "bg-indigo-500/10 border-indigo-500/20"
                    : isWorkDay
                      ? "bg-amber-500/10 border-amber-500/20"
                      : isDayOff
                        ? "bg-[var(--bg-main)] border-[var(--border)] opacity-50"
                        : "border-dashed border-[var(--border)] opacity-30",
              )}
            >
              {/* Kun raqami + icon */}
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-xs font-bold leading-none",
                  isToday
                    ? "text-indigo-600 dark:text-indigo-300"
                    : "text-[var(--text-primary)]"
                )}>
                  {dayNum}
                </span>

                {!hasData ? (
                  <span className="text-[9px] text-[var(--text-muted)] opacity-50">—</span>
                ) : isDayOff ? (
                  <Star className="w-3 h-3 text-slate-400" />
                ) : isNight ? (
                  <Moon className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                ) : (
                  <Sun className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                )}
              </div>

              {/* Shift startTime */}
              <div className="text-center">
                <span className={cn(
                  "text-[9px] font-mono font-medium",
                  isToday
                    ? "text-indigo-500 dark:text-indigo-300"
                    : "text-[var(--text-muted)]"
                )}>
                  {isWorkDay && schedule?.shift?.startTime
                    ? schedule.shift.startTime.slice(0, 5)
                    : isDayOff
                      ? "🌴"
                      : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function MySchedulePage() {
  const { user } = useAuthStore();
  const now = dayjs();

  const [month, setMonth] = useState(now.month() + 1);
  const [year,  setYear]  = useState(now.year());

  const monthLabel = dayjs(`${year}-${String(month).padStart(2, "0")}-01`).format("MMMM YYYY");
  const empName    = user?.employee?.fullName ?? user?.username ?? "Xodim";

  const maxDate = now.add(2, "month");

  const goPrev = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const goNext = () => {
    const current = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
    if (current.isBefore(maxDate, "month")) {
      if (month === 12) { setMonth(1); setYear(y => y + 1); }
      else setMonth(m => m + 1);
    }
  };

  const { data: schedules = [], isLoading } = useQuery<any[]>({
    queryKey: ["my-schedule", month, year],
    queryFn:  () => schedulesApi.my({ month, year }),
    staleTime: 5 * 60_000,
  });

  // Stats — faqat real ma'lumotdan
  const totalWorkDays = schedules.filter(s => s.status === "WORKING").length;
  const totalDayOff   = schedules.filter(s => s.status === "DAY_OFF").length;
  const totalNight    = schedules.filter(
    s => s.status === "WORKING" && s.shift?.type === "NIGHTTIME"
  ).length;
  const totalDay      = totalWorkDays - totalNight;

  return (
    <div className="pb-16 bg-[var(--bg-main)] min-h-screen text-[var(--text-primary)]">
      <Topbar
        title="Mening grafigim"
        subtitle={`${empName} · Ish jadvali va smenalar`}
      />

      <div className="max-w-4xl mx-auto px-4 lg:px-6 pt-6 space-y-5">

        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600/90 via-purple-600/70 to-indigo-700/90 border border-indigo-500/30 p-6 shadow-2xl text-white">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Sparkles className="w-32 h-32" />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-indigo-100 text-xs font-extrabold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Shaxsiy Ish Rejasi
              </div>
              <h2 className="text-2xl font-black text-white capitalize tracking-tight">
                {monthLabel}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => { setMonth(now.month() + 1); setYear(now.year()); }}
                className="px-4 py-2 text-xs font-bold bg-white/20 hover:bg-white/30 text-white rounded-xl transition border border-white/20"
              >
                Joriy oy
              </button>
              <div className="flex items-center gap-1 bg-black/20 border border-white/20 p-1.5 rounded-2xl">
                <button onClick={goPrev} className="p-2 rounded-xl hover:bg-white/20 transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={goNext} className="p-2 rounded-xl hover:bg-white/20 transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Ish kunlari",    value: totalWorkDays, icon: Briefcase, color: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/20" },
            { label: "Dam olish",      value: totalDayOff,   icon: Coffee,    color: "text-amber-500",  bg: "bg-amber-500/10 border-amber-500/20"   },
            { label: "Kunduzgi",       value: totalDay,      icon: Sun,       color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" },
            { label: "Kechki smena",   value: totalNight,    icon: Moon,      color: "text-violet-500", bg: "bg-violet-500/10 border-violet-500/20" },
          ].map(s => (
            <div key={s.label} className="rounded-3xl p-4 border border-[var(--border)] shadow-xl bg-[var(--bg-card)]">
              <div className="flex items-center gap-3">
                <div className={cn("p-2.5 rounded-2xl border", s.bg, s.color)}>
                  <s.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
                  {isLoading ? (
                    <div className="h-6 w-8 bg-[var(--bg-hover)] rounded animate-pulse mt-0.5" />
                  ) : (
                    <p className="text-xl font-black text-[var(--text-primary)]">{s.value}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <CompactScheduleCalendar
          schedules={schedules}
          year={year}
          month={month}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}