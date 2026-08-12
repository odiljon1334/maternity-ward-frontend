"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { formatMinutes, cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight,
  Clock, CheckCircle2, XCircle, AlertTriangle, Coffee,
  TrendingUp, Calendar as CalendarIcon, Moon, Sun, Star,
} from "lucide-react";
import dayjs from "dayjs";
import { useAuthStore } from "@/stores/auth";

const STATUS_MAP: Record<string, { label: string; cls: string; dotCls: string; icon: any }> = {
  PRESENT:    { label: "Keldi",      cls: "bg-emerald-100 text-emerald-700 border-emerald-200", dotCls: "bg-emerald-500", icon: CheckCircle2  },
  LATE:       { label: "Kechikdi",   cls: "bg-amber-100 text-amber-700 border-amber-200", dotCls: "bg-amber-500", icon: AlertTriangle },
  ABSENT:     { label: "Kelmadi",    cls: "bg-rose-100 text-rose-700 border-rose-200", dotCls: "bg-rose-500", icon: XCircle       },
  EARLY_LEAVE:{ label: "Erta ketdi", cls: "bg-blue-100 text-blue-700 border-blue-200", dotCls: "bg-blue-500", icon: Clock         },
  LATE_EARLY: { label: "Kech+Erta",  cls: "bg-purple-100 text-purple-700 border-purple-200", dotCls: "bg-purple-500", icon: AlertTriangle },
};

export default function MyAttendancePage() {
  const { user } = useAuthStore();
  const now = dayjs();
  const [month, setMonth] = useState(now.month() + 1);
  const [year,  setYear]  = useState(now.year());
  const [selectedDate, setSelectedDate] = useState<string>(now.format("YYYY-MM-DD"));

  const goPrev = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const goNext = () => {
    const isCurrentMonth = month === now.month() + 1 && year === now.year();
    if (isCurrentMonth) return;
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["my-attendance", month, year],
    queryFn: () => attendanceApi.my({ month, year }),
    staleTime: 2 * 60_000,
  });

  const records: any[] = data?.records ?? [];
  const stats = data?.stats   ?? {};
  const monthLabel = dayjs().month(month - 1).format("MMMM");
  const isCurrentMonth = month === now.month() + 1 && year === now.year();

  const workDaysPct = stats.totalDays > 0
    ? Math.round((stats.present + (stats.late || 0)) / stats.totalDays * 100)
    : 0;

  const empName = user?.employee?.fullName || user?.username || "Xodim";

  const recordsMap = new Map(records.map(r => [dayjs(r.workDate).format("YYYY-MM-DD"), r]));
  
  const startOfMonth = dayjs(`${year}-${month}-01`);
  const daysInMonth = startOfMonth.daysInMonth();
  const startDayOfWeek = (startOfMonth.day() + 6) % 7;

  const calendarDays = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push({ empty: true, id: `empty-${i}` });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = dayjs(`${year}-${month}-${day}`).format("YYYY-MM-DD");
    const record = recordsMap.get(dateStr);
    const isWeekend = dayjs(dateStr).day() === 0 || dayjs(dateStr).day() === 6;
    calendarDays.push({
      day,
      dateStr,
      record,
      isWeekend,
      empty: false
    });
  }

  const selectedRecord = recordsMap.get(selectedDate);
  const selectedDayObj = dayjs(selectedDate);
  const isSelectedWeekend = selectedDayObj.day() === 0 || selectedDayObj.day() === 6;

  return (
    <div>
      <Topbar
        title="Mening davomatim"
        subtitle={`${empName} · ${year} yil, ${monthLabel}`}
      />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-5">
        {/* ── Oy navigatsiyasi ── */}
        <div className="flex items-center justify-between card p-3">
          <button onClick={goPrev} className="btn-ghost p-2 rounded-xl">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-bold text-[var(--text-primary)]">
            {monthLabel} {year}
          </span>
          <button onClick={goNext} disabled={isCurrentMonth} className="btn-ghost p-2 rounded-xl disabled:opacity-30">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* ── Statistika kartalar ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-4 h-20 animate-pulse bg-[var(--bg-hover)]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Keldi",     value: stats.present    ?? 0, icon: CheckCircle2,  color: "text-emerald-400", bg: "bg-emerald-600/15" },
              { label: "Kechikdi",  value: stats.late       ?? 0, icon: AlertTriangle, color: "text-amber-400",   bg: "bg-amber-600/15"   },
              { label: "Kelmadi",   value: stats.absent     ?? 0, icon: XCircle,       color: "text-red-400",     bg: "bg-red-600/15"     },
              { label: "Kechikish", value: formatMinutes(stats.totalLateMin ?? 0), icon: Clock, color: "text-indigo-400", bg: "bg-indigo-600/15" },
            ].map((s) => (
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

        {/* ── Oylik davomat taqvimi va Smena ikonkalari ── */}
        <div className="card p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-400" />
              <h3 className="font-semibold text-sm text-[var(--text-primary)]">Oylik davomat taqvimi</h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Keldi</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Kechikdi</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span>Kelmadi</span>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-bold text-[var(--text-muted)] py-1">
            <span>Du</span><span>Se</span><span>Ch</span><span>Pa</span><span>Ju</span><span>Sh</span><span>Ya</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {calendarDays.map((item) => {
              if (item.empty) {
                return <div key={item.id} className="h-12 sm:h-14" />;
              }

              const rec = item.record;
              const st = rec ? STATUS_MAP[rec.status] : null;
              const isSelected = selectedDate === item.dateStr;
              const isToday = item.dateStr === now.format("YYYY-MM-DD");

              return (
                <button
                  key={item.dateStr || item.id}
                  onClick={() => item.dateStr && setSelectedDate(item.dateStr)}
                  disabled={!item.dateStr}
                  className={cn(
                    "h-12 sm:h-14 rounded-2xl flex flex-col items-center justify-between p-1.5 relative transition-all border",
                    !item.dateStr && "opacity-0 pointer-events-none", // bo'sh kataklarni ko'rsatmaslik yoki bosilmaydigan qilish
                    isSelected 
                      ? "ring-2 ring-indigo-500 border-indigo-500 bg-indigo-500/10" 
                      : "border-[var(--border)] hover:bg-[var(--bg-hover)]",
                    st ? st.cls : (item.isWeekend ? "bg-[var(--bg-hover)] opacity-60" : "bg-transparent")
                  )}
                >
                  {/* Yuqori qism: Sana va bugun belgisi */}
                  <div className="w-full flex items-center justify-between">
                    <span className={cn("text-xs font-semibold", isToday && "text-indigo-500 font-bold underline")}>
                      {item.day}
                    </span>
                    {item.isWeekend ? (
                      <span title="Dam olish kuni">
                        <Star className="w-3 h-3 text-amber-400/70" />
                      </span>
                    ) : (
                      // Sana raqami bo'yicha 1 hafta kunduzi, 1 hafta kechasi navbati
                      Math.floor((item.day ?? 1) / 7) % 2 === 1 ? (
                        <span title="Kechki smena">
                          <Moon className="w-3 h-3 text-indigo-400" />
                        </span>
                      ) : (
                        <span title="Kunduzgi smena">
                          <Sun className="w-3 h-3 text-orange-400" />
                        </span>
                      )
                    )}
                  </div>

                  {/* Pastki qism: Status nuqtasi yoki ikonka */}
                  <div className="flex items-center justify-center pb-0.5">
                    {st ? (
                      <span className={cn("w-2 h-2 rounded-full shadow-sm", st.dotCls)} />
                    ) : (
                      <span className="text-[9px] text-[var(--text-muted)] opacity-50">—</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── KREATIV STATUS CARD (Rangli holatlar bilan) ── */}
          {(() => {
            const isLate = selectedRecord?.status === "LATE";
            const isPresent = selectedRecord?.status === "PRESENT";
            const statusLabel = selectedRecord ? (STATUS_MAP[selectedRecord.status]?.label || selectedRecord.status) : "";

            return (
              <div className={cn(
                "p-4 sm:p-5 rounded-3xl text-white shadow-xl space-y-2 mt-4 transition-all duration-300",
                isLate 
                  ? "bg-gradient-to-r from-amber-600 to-amber-800 shadow-amber-600/20" 
                  : isPresent 
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-800 shadow-emerald-600/20" 
                    : isSelectedWeekend 
                      ? "bg-gradient-to-r from-slate-700 to-slate-900 shadow-slate-700/20"
                      : "bg-gradient-to-r from-rose-600 to-rose-800 shadow-rose-600/20"
              )}>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                    {selectedDayObj.format("DD MMMM, dddd")}
                  </span>
                  <span className="text-xs font-semibold flex items-center gap-1.5 text-white">
                    {isSelectedWeekend ? (
                      <>🌴 Dam olish kuni</>
                    ) : selectedRecord ? (
                      <span className="flex items-center gap-1">
                        <span className={cn("w-2 h-2 rounded-full", isLate ? "bg-amber-300 animate-pulse" : "bg-emerald-300")} /> 
                        {isLate ? "Kechikib kelingan" : "Ofisdasiz"}
                      </span>
                    ) : (
                      <span className="text-rose-100 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Ishdan tashqarida
                      </span>
                    )}
                  </span>
                </div>
                
                <h4 className="text-base font-bold pt-1">
                  {isSelectedWeekend 
                    ? "Dam olish kuningiz xayrli o'tsin! 🌴" 
                    : selectedRecord 
                      ? `Davomat qayd etilgan (${statusLabel})` 
                      : "Bugun davomat belgilanmagan!"}
                </h4>
                
                <p className="text-xs text-white/90 leading-relaxed">
                  {isSelectedWeekend 
                    ? "Bugun dam olish kuni. Vaqtingizni maroqli o'tkazing!" 
                    : selectedRecord 
                      ? `Kelish vaqti: ${selectedRecord.checkIn ? dayjs(selectedRecord.checkIn).format("HH:mm") : "—"}. Geofozadan muvaffaqiyatli o'tgansiz.` 
                      : "Siz bugun ishga kelmadingiz yoki check-in qilishni unutgansiz."}
                </p>
              </div>
            );
          })()}
        </div>

        {/* ── Davomat foizi progress bar ── */}
        {!isLoading && stats.totalDays > 0 && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-[var(--text-primary)]">Davomat foizi</span>
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
                <span className="text-emerald-400">+{formatMinutes(stats.totalOvertimeMin)} ortiqcha</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}