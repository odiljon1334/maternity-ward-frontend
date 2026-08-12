"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { schedulesApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight,
  Sun, Moon, Star,
  CalendarDays, Sparkles, Briefcase, Coffee
} from "lucide-react";
import dayjs from "dayjs";
import { useAuthStore } from "@/stores/auth";

const FULL_UZ_WEEKDAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

// ─── Premium Grafik Kalendari ────────────────────────────────────────────────

function CompactScheduleCalendar({ schedules, year, month }: { schedules: any[]; year: number; month: number }) {
  const startOfMonth = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
  const daysInMonth = startOfMonth.daysInMonth();
  
  let startDayOfWeek = startOfMonth.day() - 1; 
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  const scheduleMap = new Map(schedules.map((s) => [dayjs(s.date).format("YYYY-MM-DD"), s]));
  const todayStr = dayjs().format("YYYY-MM-DD");

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] p-5 shadow-xl backdrop-blur-xl space-y-4">
      {/* Orqa fon uchun yorug' nur effekti */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Sarlavha */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-500 dark:text-indigo-400">
            <CalendarDays className="w-4 h-4" />
          </div>
          <h3 className="font-extrabold text-sm text-[var(--text-primary)] tracking-wide">Oylik ish grafiki taqvimi</h3>
        </div>
      </div>

      {/* Haftasikunlari */}
      <div className="grid grid-cols-7 gap-1 text-center relative z-10">
        {FULL_UZ_WEEKDAYS.map((d, i) => (
          <span key={d} className={cn("text-xs font-extrabold uppercase tracking-wider py-1", i >= 5 ? "text-rose-500 dark:text-rose-400" : "text-[var(--text-muted)]")}>
            {d}
          </span>
        ))}
      </div>

      {/* Katakchalar panjarasi */}
      <div className="grid grid-cols-7 gap-1.5 relative z-10">
        {[...Array(startDayOfWeek)].map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square rounded-2xl opacity-0" />
        ))}

        {[...Array(daysInMonth)].map((_, i) => {
          const dayNum = i + 1;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const schedule = scheduleMap.get(dateStr);
          const isToday = dateStr === todayStr;

          const isNight = schedule?.shift?.type === "NIGHTTIME";
          const isWorkDay = schedule ? schedule.status === "WORKING" : (dayjs(dateStr).day() !== 0 && dayjs(dateStr).day() !== 6);
          
          const ShiftIcon = isNight ? Moon : (isWorkDay ? Sun : Star);

          return (
            <div
              key={dateStr}
              className={cn(
                "aspect-square rounded-2xl p-1.5 flex flex-col justify-between transition-all relative border",
                isToday 
                  ? "bg-indigo-500/20 border-indigo-500/60 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/40 text-indigo-600 dark:text-indigo-300" 
                  : isWorkDay 
                    ? "bg-[var(--bg-hover)]/50 border-[var(--border)] hover:border-indigo-500/40" 
                    : "bg-[var(--bg-main)] border-[var(--border)] opacity-60",
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("text-xs font-bold", isToday ? "text-indigo-600 dark:text-indigo-300" : "text-[var(--text-primary)]")}>
                  {dayNum}
                </span>
                <ShiftIcon className={cn("w-3 h-3", isWorkDay && !isNight ? "text-amber-500 dark:text-amber-400" : (isNight ? "text-indigo-500 dark:text-indigo-400" : "text-[var(--text-muted)]"))} />
              </div>

              <div className="text-center pb-0.5">
                <span className="text-[9px] font-mono font-medium text-[var(--text-muted)]">
                  {isWorkDay && schedule?.shift?.startTime ? schedule.shift.startTime.slice(0, 5) : (isWorkDay ? "08:00" : "—")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Asosiy Sahifa ────────────────────────────────────────────────────────────

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
    const maxDate = now.add(2, "month");
    const current = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
    if (current.isBefore(maxDate, "month")) {
      if (month === 12) { setMonth(1); setYear((y) => y + 1); }
      else              { setMonth((m) => m + 1); }
    }
  };

  const { data: schedules = [] } = useQuery<any[]>({
    queryKey: ["my-schedule", month, year],
    queryFn:  () => schedulesApi.my({ month, year }),
    staleTime: 5 * 60_000,
  });

  const totalWorkDays  = schedules.filter((s) => s.status === "WORKING").length;
  const totalDayOff    = schedules.filter((s) => s.status === "DAY_OFF").length;

  return (
    <div className="pb-16 bg-[var(--bg-main)] min-h-screen text-[var(--text-primary)]">
      <Topbar
        title="Mening grafigim"
        subtitle={`${empName} · Ish jadvali va smenalar`}
      />

      <div className="max-w-4xl mx-auto px-4 lg:px-6 pt-6 space-y-5">
        
        {/* Yuqori Gradient Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600/90 via-purple-600/70 to-indigo-700/90 border border-indigo-500/30 p-6 shadow-2xl backdrop-blur-xl text-white">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none text-white">
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
                className="px-4 py-2 text-xs font-bold bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all shadow-sm border border-white/20 cursor-pointer"
              >
                Joriy oy
              </button>
              <div className="flex items-center gap-1 bg-black/20 border border-white/20 p-1.5 rounded-2xl">
                <button onClick={goPrev} className="p-2 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={goNext} className="p-2 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistika Kartalari */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { 
              label: "Ish kunlari", 
              value: totalWorkDays || 21, 
              icon: Briefcase, 
              color: "text-indigo-500 dark:text-indigo-400", 
              bg: "bg-indigo-500/10 border-indigo-500/20",
            },
            { 
              label: "Dam olish kunlari", 
              value: totalDayOff || 10, 
              icon: Coffee, 
              color: "text-amber-500 dark:text-amber-400", 
              bg: "bg-amber-500/10 border-amber-500/20",
            },
          ].map((s) => (
            <div key={s.label} className="relative overflow-hidden rounded-3xl p-5 border border-[var(--border)] shadow-xl bg-[var(--bg-card)]">
              <div className="flex items-center gap-4 relative z-10">
                <div className={cn("p-3 rounded-2xl border", s.bg, s.color)}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[var(--text-muted)]">{s.label}</span>
                  <p className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Kompakt Grafik Kalendari */}
        <CompactScheduleCalendar schedules={schedules} year={year} month={month} />
      </div>
    </div>
  );
}