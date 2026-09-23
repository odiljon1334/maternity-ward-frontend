"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { schedulePlanningApi, schedulesApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight,
  Sun, Moon, Star,
  CalendarDays, Sparkles, Briefcase, Coffee,
  ArrowLeftRight, CheckCircle2, Send, UserRoundCheck, X,
} from "lucide-react";
import dayjs from "dayjs";
import { useAuthStore } from "@/stores/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Field, Select, Textarea } from "@/components/ui/FormControls";
import { Surface } from "@/components/ui/Surface";
import { StatePanel } from "@/components/ui/StatePanel";

const WEEKDAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

// ─── CALENDAR ─────────────────────────────────────────────────────────────────

function CompactScheduleCalendar({
  schedules,
  year,
  month,
  isLoading,
  onSelectSchedule,
}: {
  schedules: any[];
  year:      number;
  month:     number;
  isLoading: boolean;
  onSelectSchedule: (schedule: any) => void;
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

          // Grafikdagi aniq kelish/ketish vaqtlari
          const startTime = isWorkDay ? schedule?.shift?.startTime?.slice(0, 5) : undefined;
          const endTime   = isWorkDay ? schedule?.shift?.endTime?.slice(0, 5)   : undefined;
          // Tungi smen ertangi kunga o'tadimi
          const overnight = isWorkDay && schedule?.shift?.isOvernight === true;
          // Dam olishdan boshqa ishlamaydigan kunlar (ta'til, kasallik, bayram)
          // Katak juda tor (~38px) — desktop jadvaldagi kabi qisqa belgilar
          const offMark   = hasData && !isWorkDay && !isDayOff
            ? ({ VACATION: "Ta", SICK: "Ka", HOLIDAY: "B", MATERNITY_LEAVE: "TT", TRAINING: "MO", OTHER_ABSENCE: "B" } as Record<string, string>)[schedule.status]
            : undefined;
          const offLabel  = hasData && !isWorkDay && !isDayOff
            ? ({ VACATION: "Ta'til", SICK: "Kasallik", HOLIDAY: "Bayram", MATERNITY_LEAVE: "Tug‘ruq ta’tili", TRAINING: "Malaka oshirish", OTHER_ABSENCE: "Boshqa yo‘qlik" } as Record<string, string>)[schedule.status]
            : undefined;

          // Skeleton
          if (isLoading) {
            return (
              <div
                key={dateStr}
                className="aspect-square rounded-2xl bg-[var(--bg-hover)] animate-pulse"
              />
            );
          }

          const canRequestChange = isWorkDay && Boolean(schedule?.sourceEntryId);

          return (
            <button
              type="button"
              key={dateStr}
              disabled={!canRequestChange}
              onClick={() => canRequestChange && onSelectSchedule(schedule)}
              title={
                !hasData    ? "Grafik belgilanmagan"
                : isDayOff  ? "Dam olish kuni"
                : offLabel  ? (schedule.note || offLabel)
                : `${isNight ? "Kechki" : "Kunduzgi"} smena: ${startTime ?? "?"} dan ${endTime ?? "?"} gacha${overnight ? " (ertangi kun)" : ""}${canRequestChange ? " — almashish uchun bosing" : ""}`
              }
              className={cn(
                "aspect-square rounded-2xl p-1 flex flex-col justify-between transition-all border overflow-hidden",
                canRequestChange && "cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50",
                isToday
                  ? "bg-indigo-500/20 border-indigo-500/60 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/20"
                  : isWorkDay && isNight
                    ? "bg-indigo-500/10 border-indigo-500/20"
                    : isWorkDay
                      ? "bg-amber-500/10 border-amber-500/20"
                      : isDayOff || offLabel
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
                ) : isDayOff || offLabel ? (
                  <Star className="w-3 h-3 text-slate-400" />
                ) : isNight ? (
                  <Moon className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                ) : (
                  <Sun className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                )}
              </div>

              {/* Kelish va ketish vaqti — grafikdan */}
              <div className={cn(
                "text-center leading-none",
                isToday ? "text-indigo-500 dark:text-indigo-300" : "text-[var(--text-muted)]"
              )}>
                {isWorkDay && startTime ? (
                  <>
                    <div className="text-[8px] font-mono font-semibold tracking-tighter">{startTime}</div>
                    {endTime && (
                      // Mobil katak ~38px — "+1" belgisi vaqtni kesib qo'yadi.
                      // Tungi smena oy ikonkasi va tooltip orqali bilinadi.
                      <div className="text-[8px] font-mono opacity-70 tracking-tighter">
                        {endTime}
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-[9px] font-mono font-medium">
                    {isDayOff ? "🌴" : offMark ?? "—"}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function MySchedulePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const now = dayjs();

  const [month, setMonth] = useState(now.month() + 1);
  const [year,  setYear]  = useState(now.year());
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [changeType, setChangeType] = useState("SUBSTITUTION");
  const [replacementEmployeeId, setReplacementEmployeeId] = useState("");
  const [counterpartEntryId, setCounterpartEntryId] = useState("");
  const [absenceEntryType, setAbsenceEntryType] = useState("SICK");
  const [changeReason, setChangeReason] = useState("");

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

  const { data: schedules = [], isLoading, isError, isFetching, refetch } = useQuery<any[]>({
    queryKey: ["my-schedule", month, year],
    queryFn:  () => schedulesApi.my({ month, year }),
    staleTime: 5 * 60_000,
  });

  const { data: planningConfig } = useQuery({
    queryKey: ["my-schedule-planning-config"],
    queryFn: () => schedulePlanningApi.config(),
  });
  const { data: changeRequests = [] } = useQuery<any[]>({
    queryKey: ["my-schedule-change-requests"],
    queryFn: () => schedulePlanningApi.myChanges(),
    enabled: planningConfig?.postCoverageEnabled === true,
  });
  const { data: changeOptions, isLoading: changeOptionsLoading } = useQuery<any>({
    queryKey: ["my-schedule-change-options", selectedSchedule?.sourceEntryId],
    queryFn: () => schedulePlanningApi.myChangeOptions(selectedSchedule.sourceEntryId),
    enabled: Boolean(selectedSchedule?.sourceEntryId),
  });

  const closeChangeForm = () => {
    setSelectedSchedule(null);
    setReplacementEmployeeId("");
    setCounterpartEntryId("");
    setChangeReason("");
  };

  const createChangeRequest = useMutation({
    mutationFn: () => schedulePlanningApi.createChange({
      type: changeType,
      primaryEntryId: selectedSchedule.sourceEntryId,
      ...(changeType === "SUBSTITUTION" && { replacementEmployeeId }),
      ...(changeType === "SWAP" && { counterpartEntryId }),
      ...(changeType !== "SWAP" && { absenceEntryType }),
      reason: changeReason.trim(),
    }),
    onSuccess: () => {
      toast.success("Smena o‘zgarishi so‘rovi yuborildi");
      closeChangeForm();
      qc.invalidateQueries({ queryKey: ["my-schedule-change-requests"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "So‘rov yuborilmadi"),
  });

  const acceptChangeRequest = useMutation({
    mutationFn: (id: string) => schedulePlanningApi.acceptChange(id),
    onSuccess: () => {
      toast.success("Smena o‘zgarishi qabul qilindi va rahbar tasdig‘iga yuborildi");
      qc.invalidateQueries({ queryKey: ["my-schedule-change-requests"] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "So‘rov qabul qilinmadi"),
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
        {!isError && <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Ish kunlari",    value: totalWorkDays, icon: Briefcase, color: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/20" },
            { label: "Dam olish",      value: totalDayOff,   icon: Coffee,    color: "text-amber-500",  bg: "bg-amber-500/10 border-amber-500/20"   },
            { label: "Kunduzgi",       value: totalDay,      icon: Sun,       color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" },
            { label: "Kechki smena",   value: totalNight,    icon: Moon,      color: "text-violet-500", bg: "bg-violet-500/10 border-violet-500/20" },
          ].map(s => (
            <Surface key={s.label} className="p-4">
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
            </Surface>
          ))}
        </div>}

        {/* Calendar */}
        {isError ? (
          <StatePanel
            kind="error"
            title="Shaxsiy grafikni yuklab bo‘lmadi"
            description="Internet aloqasini tekshirib, qayta urinib ko‘ring."
            actionLabel="Qayta urinish"
            onAction={() => void refetch()}
            actionLoading={isFetching}
          />
        ) : (
          <CompactScheduleCalendar
            schedules={schedules}
            year={year}
            month={month}
            isLoading={isLoading}
            onSelectSchedule={setSelectedSchedule}
          />
        )}

        {selectedSchedule && (
          <Surface className="space-y-4 border-indigo-500/20 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 font-extrabold"><ArrowLeftRight className="h-4 w-4 text-indigo-500" />Smena o‘zgarishi so‘rovi</h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{dayjs(selectedSchedule.date).format("DD.MM.YYYY")} · {selectedSchedule.shift?.startTime}–{selectedSchedule.shift?.endTime}</p>
              </div>
              <Button onClick={closeChangeForm} variant="ghost" size="icon" aria-label="So‘rov formasini yopish"><X className="h-4 w-4" /></Button>
            </div>

            {changeOptionsLoading ? <StatePanel kind="loading" title="Variantlar yuklanmoqda" className="min-h-32" /> : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="O‘zgarish turi"><Select value={changeType} onChange={(event) => setChangeType(event.target.value)}><option value="SUBSTITUTION">O‘rnimga boshqa xodim ishlaydi</option><option value="SWAP">Smenani o‘zaro almashtirish</option><option value="ABSENCE">Ishga chiqa olmayman</option></Select></Field>
                {changeType === "SUBSTITUTION" && <Field label="O‘rnini bosuvchi xodim"><Select value={replacementEmployeeId} onChange={(event) => setReplacementEmployeeId(event.target.value)}><option value="">Xodimni tanlang</option>{(changeOptions?.replacementEmployees ?? []).map((employee: any) => <option key={employee.id} value={employee.id}>{employee.fullName}{employee.position?.name ? ` — ${employee.position.name}` : ""}</option>)}</Select></Field>}
                {changeType === "SWAP" && <Field label="Almashiladigan smena"><Select value={counterpartEntryId} onChange={(event) => setCounterpartEntryId(event.target.value)}><option value="">Smenani tanlang</option>{(changeOptions?.counterpartEntries ?? []).map((entry: any) => <option key={entry.id} value={entry.id}>{entry.employee.fullName} — {dayjs(entry.workDate).format("DD.MM")} · {entry.shift?.startTime}–{entry.shift?.endTime}</option>)}</Select></Field>}
                {changeType !== "SWAP" && <Field label="Sabab turi"><Select value={absenceEntryType} onChange={(event) => setAbsenceEntryType(event.target.value)}><option value="SICK">Kasallik</option><option value="DAY_OFF">Uzrli kun</option><option value="VACATION">Mehnat ta’tili</option><option value="MATERNITY_LEAVE">Tug‘ruq ta’tili</option><option value="TRAINING">Malaka oshirish</option><option value="OTHER_ABSENCE">Boshqa sabab</option></Select></Field>}
                <Field label="Izoh" className="sm:col-span-2"><Textarea value={changeReason} onChange={(event) => setChangeReason(event.target.value)} rows={3} placeholder="Smena o‘zgarishi sababini yozing" /></Field>
              </div>
            )}
            <Button onClick={() => createChangeRequest.mutate()} loading={createChangeRequest.isPending} disabled={!changeReason.trim() || (changeType === "SUBSTITUTION" && !replacementEmployeeId) || (changeType === "SWAP" && !counterpartEntryId)} size="sm"><Send className="h-4 w-4" />So‘rov yuborish</Button>
          </Surface>
        )}

        {changeRequests.length > 0 && (
          <Surface className="space-y-3 p-5">
            <h3 className="flex items-center gap-2 font-extrabold"><UserRoundCheck className="h-4 w-4 text-indigo-500" />Smena o‘zgarishlari</h3>
            {changeRequests.map((request: any) => <div key={request.id} className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-main)] p-3 text-xs">
              <div><p className="font-bold">{request.type === "SWAP" ? "Smena almashish" : request.type === "SUBSTITUTION" ? "O‘rnini bosish" : "Ishga chiqmaslik"}</p><p className="text-[var(--text-muted)]">{request.primaryEntry.employee.fullName} · {dayjs(request.primaryEntry.workDate).format("DD.MM.YYYY")} · {request.reason}</p></div>
              <span className="ml-auto rounded-full bg-indigo-500/10 px-2.5 py-1 font-bold text-indigo-600 dark:text-indigo-300">{request.status}</span>
              {request.canAccept && <Button onClick={() => acceptChangeRequest.mutate(request.id)} loading={acceptChangeRequest.isPending} variant="success" size="sm"><CheckCircle2 className="h-4 w-4" />Qabul qilish</Button>}
            </div>)}
          </Surface>
        )}
      </div>
    </div>
  );
}
