"use client";
import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { schedulesApi, shiftsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  X, Sun, Moon, Coffee, ChevronLeft, ChevronRight,
  Copy, Zap, Users, User, Search, Check
} from "lucide-react";
import dayjs from "dayjs";

type ShiftType = "day" | "night" | "off";

interface ShiftPreset {
  type: ShiftType;
  startTime: string;
  endTime: string;
  lunchEnabled: boolean;
  lunchStart: string;
  lunchEnd: string;
}

function toMin(t: string) {
  if (!t || !t.includes(":")) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function fmtDur(min: number) {
  if (min <= 0) return "0 soat";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}s ${m}d` : `${h} soat`;
}
function calcGross(start: string, end: string) {
  if (!start || !end) return 0;
  let g = toMin(end) - toMin(start);
  if (g <= 0) g += 1440;
  return g;
}
function calcLunch(ls: string, le: string) {
  if (!ls || !le) return 0;
  let lm = toMin(le) - toMin(ls);
  if (lm <= 0) lm += 1440;
  return lm;
}
function isOvernightFn(start: string, end: string) {
  return toMin(end) < toMin(start);
}

const MONTH_NAMES = [
  "Yanvar","Fevral","Mart","Aprel","May","Iyun",
  "Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr",
];

// ─── ShiftCard ────────────────────────────────────────────────────────────────
function ShiftCard({
  preset, active, onSelect, onChange,
}: {
  preset: ShiftPreset;
  active: boolean;
  onSelect: () => void;
  onChange: (p: Partial<ShiftPreset>) => void;
}) {
  const safeStart = preset.startTime || "08:00";
  const safeEnd   = preset.endTime   || "20:00";
  const safeLs    = preset.lunchStart || "12:00";
  const safeLe    = preset.lunchEnd   || "13:00";

  const gross    = calcGross(safeStart, safeEnd);
  const lunchMin = preset.lunchEnabled ? calcLunch(safeLs, safeLe) : 0;
  const net      = Math.max(0, gross - lunchMin);

  const isDay   = preset.type === "day";
  const isNight = preset.type === "night";
  const isOff   = preset.type === "off";

  const timeInputCls = cn(
    "h-9 rounded-lg border text-sm font-medium px-3 w-28",
    "bg-[var(--bg-primary)] text-[var(--text-primary)]",
    "outline-none focus:ring-1",
    active && isDay   && "border-blue-500/60 focus:ring-blue-500/40",
    active && isNight && "border-violet-500/60 focus:ring-violet-500/40",
    !active && "border-[var(--border)] focus:ring-[var(--border-strong)]",
  );

  return (
    <div
      onClick={onSelect}
      className={cn(
        "rounded-xl border-2 px-4 py-3 cursor-pointer transition-all select-none relative",
        active && isDay   && "border-blue-500 bg-blue-500/10",
        active && isNight && "border-violet-500 bg-violet-500/10",
        active && isOff   && "border-slate-500 bg-slate-500/10",
        !active && "border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-strong)]",
      )}
    >
      {/* Active check */}
      {active && (
        <div className={cn(
          "absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center",
          isDay && "bg-blue-500", isNight && "bg-violet-500", isOff && "bg-slate-500",
        )}>
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Row 1: Icon + Title + Duration */}
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
          active && isDay   && "bg-blue-500",
          active && isNight && "bg-violet-500",
          active && isOff   && "bg-slate-500",
          !active && "bg-[var(--bg-hover)] border border-[var(--border)]",
        )}>
          {isDay   && <Sun    className={cn("w-4 h-4", active ? "text-white" : "text-[var(--text-muted)]")} />}
          {isNight && <Moon   className={cn("w-4 h-4", active ? "text-white" : "text-[var(--text-muted)]")} />}
          {isOff   && <Coffee className={cn("w-4 h-4", active ? "text-white" : "text-[var(--text-muted)]")} />}
        </div>
        <div>
          <p className={cn(
            "text-sm font-semibold",
            active && isDay   && "text-blue-400",
            active && isNight && "text-violet-400",
            active && isOff   && "text-slate-300",
            !active && "text-[var(--text-primary)]",
          )}>
            {isDay ? "Kunduzgi" : isNight ? "Tungi" : "Dam olish"}
          </p>
          {!isOff && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {preset.lunchEnabled
                ? <><span>{fmtDur(gross)}</span> → <span className="text-emerald-400 font-medium">{fmtDur(net)} sof</span></>
                : <span>{fmtDur(gross)} ish</span>
              }
            </p>
          )}
          {isOff && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {active ? "Kunlarga bosing" : "Ishlamaydigan kun"}
            </p>
          )}
        </div>
      </div>

      {/* Row 2: Time inputs (agar off emas) */}
      {!isOff && (
        <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <input
            type="time" value={safeStart}
            onChange={(e) => onChange({ startTime: e.target.value })}
            style={{ colorScheme: "dark" }}
            className={timeInputCls}
          />
          <span className="text-[var(--text-muted)]">–</span>
          <input
            type="time" value={safeEnd}
            onChange={(e) => onChange({ endTime: e.target.value })}
            style={{ colorScheme: "dark" }}
            className={timeInputCls}
          />

          {/* Lunch toggle */}
          <div
            className="flex items-center gap-2 ml-2 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onChange({ lunchEnabled: !preset.lunchEnabled }); }}
          >
            <div className={cn(
              "w-9 h-5 rounded-full transition-colors relative flex-shrink-0",
              preset.lunchEnabled ? "bg-amber-500" : "bg-[var(--bg-hover)] border border-[var(--border)]"
            )}>
              <div className={cn(
                "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
                preset.lunchEnabled ? "translate-x-4" : "translate-x-0.5"
              )} />
            </div>
            <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">Tushlik</span>
          </div>

          {/* Lunch times inline */}
          {preset.lunchEnabled && (
            <>
              <input
                type="time" value={safeLs}
                onChange={(e) => onChange({ lunchStart: e.target.value })}
                style={{ colorScheme: "dark" }}
                className="h-9 rounded-lg border text-sm font-medium px-3 w-25 bg-amber-500/10 border-amber-500/40 text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-amber-500/40"
              />
              <span className="text-amber-400 text-sm">–</span>
              <input
                type="time" value={safeLe}
                onChange={(e) => onChange({ lunchEnd: e.target.value })}
                style={{ colorScheme: "dark" }}
                className="h-9 rounded-lg border text-sm font-medium px-3 w-25 bg-amber-500/10 border-amber-500/40 text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Active shift indicator bar ───────────────────────────────────────────────
function ActiveShiftBar({ activeShift, presets }: {
  activeShift: ShiftType;
  presets: Record<ShiftType, ShiftPreset>;
}) {
  const preset = presets[activeShift];
  const safeStart = preset.startTime || "08:00";
  const safeEnd   = preset.endTime   || "20:00";
  const safeLs    = preset.lunchStart || "12:00";
  const safeLe    = preset.lunchEnd   || "13:00";
  const gross     = calcGross(safeStart, safeEnd);
  const lunchMin  = preset.lunchEnabled ? calcLunch(safeLs, safeLe) : 0;
  const net       = Math.max(0, gross - lunchMin);

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border",
      activeShift === "day"   && "bg-blue-500/10 border-blue-500/30 text-blue-400",
      activeShift === "night" && "bg-violet-500/10 border-violet-500/30 text-violet-400",
      activeShift === "off"   && "bg-slate-500/10 border-slate-500/30 text-slate-400",
    )}>
      {activeShift === "day"   && <Sun    className="w-3.5 h-3.5 flex-shrink-0" />}
      {activeShift === "night" && <Moon   className="w-3.5 h-3.5 flex-shrink-0" />}
      {activeShift === "off"   && <Coffee className="w-3.5 h-3.5 flex-shrink-0" />}
      <span>
        {activeShift === "off"
          ? "Dam olish tanlangan — kunlarga bosing"
          : `${activeShift === "day" ? "Kunduzgi" : "Tungi"} ${safeStart}–${safeEnd}${preset.lunchEnabled ? ` · ${fmtDur(net)} sof` : ` · ${fmtDur(gross)}`} tanlangan — kunlarga bosing`
        }
      </span>
    </div>
  );
}

// ─── Calendar ─────────────────────────────────────────────────────────────────
function ScheduleCalendar({
  year, month, dayMap, dayPresets, activeShift, onDayClick, onCopyPrev,
}: {
  year: number;
  month: number;
  dayMap: Record<number, ShiftType>;
  dayPresets: Record<ShiftType, ShiftPreset>;
  activeShift: ShiftType;
  onDayClick: (day: number) => void;
  onCopyPrev: () => void;
}) {
  const daysInMonth = dayjs(`${year}-${String(month).padStart(2, "0")}-01`).daysInMonth();
  const firstDow    = dayjs(`${year}-${String(month).padStart(2, "0")}-01`).day();
  const offset      = firstDow === 0 ? 6 : firstDow - 1;

  const workedDays = Object.values(dayMap).filter((t) => t !== "off").length;
  const offDays    = Object.values(dayMap).filter((t) => t === "off").length;
  const emptyDays  = daysInMonth - workedDays - offDays;

  return (
    <div>
      {/* Active shift indicator */}
      <ActiveShiftBar activeShift={activeShift} presets={dayPresets} />

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2.5 mb-2">
        {[
          { cls: "bg-blue-500",   label: "Kunduzgi" },
          { cls: "bg-violet-500", label: "Tungi" },
          { cls: "bg-amber-500/40 border border-amber-500/50", label: "Tushlik" },
          { cls: "bg-[var(--bg-hover)] border border-[var(--border)]", label: "Dam olish" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={cn("w-2.5 h-2.5 rounded-sm flex-shrink-0", l.cls)} />
            <span className="text-[11px] text-[var(--text-muted)]">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-[2px] mb-[2px]">
        {["Du","Se","Ch","Pa","Ju","Sh","Ya"].map((d, i) => (
          <div key={d} className={cn(
            "text-center text-[10px] font-semibold py-1 uppercase tracking-wide",
            i >= 5 ? "text-red-400" : "text-[var(--text-muted)]"
          )}>
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-[2px]">
        {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day    = i + 1;
          const dow    = dayjs(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`).day();
          const isWk   = dow === 0 || dow === 6;
          const type   = dayMap[day];
          const preset = type ? dayPresets[type] : null;
          const hasLunch = preset?.lunchEnabled && type !== "off";

          return (
            <div
              key={day}
              onClick={() => onDayClick(day)}
              className={cn(
                "rounded-md border cursor-pointer transition-all min-h-[44px] p-1 select-none",
                type === "day"   && "bg-blue-500/10 border-blue-500/50",
                type === "night" && "bg-violet-500/10 border-violet-500/50",
                type === "off"   && "bg-[var(--bg-hover)] border-[var(--border)]",
                !type && isWk   && "border-[var(--border)] bg-transparent hover:bg-red-500/5 hover:border-red-500/30",
                !type && !isWk  && "border-[var(--border)] bg-transparent hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)]",
              )}
            >
              <div className={cn(
                "text-[10px] font-medium px-0.5 mb-0.5",
                type === "day"   && "text-blue-400",
                type === "night" && "text-violet-400",
                type === "off"   && "text-[var(--text-muted)]",
                !type && isWk   && "text-red-400",
                !type && !isWk  && "text-[var(--text-muted)]",
              )}>
                {day}
              </div>
              {type && (
                <div className={cn(
                  "text-[8px] font-bold px-0.5 py-0.5 rounded text-center leading-tight",
                  type === "day"   && "bg-blue-500 text-white",
                  type === "night" && "bg-violet-500 text-white",
                  type === "off"   && "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)]",
                )}>
                  {type === "off"
                    ? "Dam"
                    : `${preset?.startTime?.slice(0,5)}–${preset?.endTime?.slice(0,5)}`}
                </div>
              )}
              {hasLunch && (
                <div className="text-[7px] px-0.5 py-0.5 rounded mt-0.5 text-center bg-amber-500/20 text-amber-400 leading-tight">
                  🍽 {preset?.lunchStart?.slice(0,5)}–{preset?.lunchEnd?.slice(0,5)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-blue-500 flex-shrink-0" />
            <span className="text-[var(--text-muted)]">Ish:</span>
            <span className="font-semibold text-[var(--text-primary)]">{workedDays}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-[var(--bg-hover)] border border-[var(--border)] flex-shrink-0" />
            <span className="text-[var(--text-muted)]">Dam:</span>
            <span className="font-semibold text-[var(--text-primary)]">{offDays}</span>
          </span>
          {emptyDays > 0 && (
            <span className="text-[var(--text-muted)]">
              Bo'sh: <span className="font-semibold text-amber-400">{emptyDays}</span>
            </span>
          )}
        </div>
        <button
          onClick={onCopyPrev}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          <Copy className="w-3 h-3" />
          Oldingi oydan ko'chir
        </button>
      </div>
    </div>
  );
}

// ─── Employee Multi-Select ────────────────────────────────────────────────────
function EmployeeSelect({
  employees, departments, selected, onToggle, onToggleAll,
}: {
  employees: any[];
  departments: any[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
}) {
  const [dept, setDept]   = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = dept
      ? employees.filter((e) => e.departmentId === dept || e.department?.id === dept)
      : employees;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.fullName?.toLowerCase().includes(q));
    }
    return list;
  }, [employees, dept, search]);

  const filteredIds  = filtered.map((e) => e.id);
  const allSelected  = filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));

  return (
    <div className="space-y-2">
      {/* Filters */}
      <div className="grid grid-cols-2 gap-2">
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="input-field text-sm h-9"
        >
          <option value="">Barcha bo'limlar</option>
          {departments.map((d: any) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            placeholder="Ism qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field text-sm h-9 w-full pl-8"
          />
        </div>
      </div>

      {/* Count + select all */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)]">
          {selected.size > 0
            ? <><span className="font-semibold text-indigo-400">{selected.size}</span> ta tanlangan</>
            : "Hech kim tanlanmagan"
          }
        </span>
        <button
          onClick={() => onToggleAll(filteredIds)}
          className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
        >
          {allSelected
            ? <><X className="w-3 h-3" /> Barchasini olib tashlash</>
            : <><Check className="w-3 h-3" /> Barchasini tanlash</>
          }
        </button>
      </div>

      {/* List with scroll fade */}
      <div className="relative">
        <div className="border border-[var(--border)] rounded-xl overflow-hidden max-h-44 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              <Search className="w-5 h-5 mx-auto mb-1.5 opacity-30" />
              Topilmadi
            </div>
          )}
          {filtered.map((emp) => {
            const isSel = selected.has(emp.id);
            return (
              <div
                key={emp.id}
                onClick={() => onToggle(emp.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 border-b border-[var(--border)] last:border-0 cursor-pointer transition-colors",
                  isSel ? "bg-indigo-500/10" : "hover:bg-[var(--bg-hover)]"
                )}
              >
                {/* Custom checkbox */}
                <div className={cn(
                  "w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors",
                  isSel
                    ? "bg-indigo-500 border-indigo-500"
                    : "border-[var(--border)] bg-transparent"
                )}>
                  {isSel && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "text-sm truncate transition-colors",
                    isSel ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-primary)]"
                  )}>
                    {emp.fullName}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{emp.department?.name}</p>
                </div>
                {isSel && <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
        {/* Scroll fade indicator */}
        {filtered.length > 4 && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--bg-card)] to-transparent rounded-b-xl pointer-events-none" />
        )}
      </div>
    </div>
  );
}

// ─── GenerateModal ────────────────────────────────────────────────────────────
export function GenerateModal({
  open, onClose, employees, shifts: existingShifts, departments,
  targetHospitalId, preEmployeeId, onMonthChange,
}: {
  open: boolean;
  onClose: () => void;
  employees: any[];
  shifts: any[];
  departments: any[];
  targetHospitalId?: string;
  preEmployeeId?: string;
  onMonthChange?: (m: number, y: number) => void;
}) {
  const qc       = useQueryClient();
  const apiParams = targetHospitalId ? { targetHospitalId } : undefined;

  const [mode, setMode]               = useState<"single" | "multi">("single");
  const [calMonth, setCalMonth]       = useState(dayjs().month() + 1);
  const [calYear, setCalYear]         = useState(dayjs().year());
  const [singleEmpId, setSingleEmpId] = useState(preEmployeeId ?? "");
  const [multiSelected, setMultiSelected] = useState<Set<string>>(new Set());
  const [activeShift, setActiveShift] = useState<ShiftType>("day");
  const [dayMap, setDayMap]           = useState<Record<number, ShiftType>>({});
  const [submitting, setSubmitting]   = useState(false);

  const [presets, setPresets] = useState<Record<ShiftType, ShiftPreset>>({
    day:   { type: "day",   startTime: "08:00", endTime: "20:00", lunchEnabled: false, lunchStart: "12:00", lunchEnd: "13:00" },
    night: { type: "night", startTime: "20:00", endTime: "08:00", lunchEnabled: false, lunchStart: "02:00", lunchEnd: "03:00" },
    off:   { type: "off",   startTime: "",       endTime: "",      lunchEnabled: false, lunchStart: "",      lunchEnd: ""      },
  });

  useEffect(() => {
    if (preEmployeeId) { setMode("single"); setSingleEmpId(preEmployeeId); }
  }, [preEmployeeId, open]);

  useEffect(() => {
    if (!open) { setDayMap({}); setMultiSelected(new Set()); }
  }, [open]);

  const navMonth = (dir: number) => {
    const next = dayjs(`${calYear}-${String(calMonth).padStart(2, "0")}-01`).add(dir, "month");
    setCalMonth(next.month() + 1);
    setCalYear(next.year());
  };

  const handleDayClick = (day: number) => {
    setDayMap((prev) => ({ ...prev, [day]: activeShift }));
  };

  const handleCopyPrev = () => {
    const daysInMonth = dayjs(`${calYear}-${String(calMonth).padStart(2, "0")}-01`).daysInMonth();
    const newMap: Record<number, ShiftType> = { ...dayMap };
    for (let d = 1; d <= daysInMonth; d++) {
      if (!newMap[d]) {
        const dow = dayjs(`${calYear}-${String(calMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`).day();
        newMap[d] = (dow === 0 || dow === 6) ? "off" : "day";
      }
    }
    setDayMap(newMap);
  };

  const updatePreset = (type: ShiftType, patch: Partial<ShiftPreset>) => {
    setPresets((prev) => ({ ...prev, [type]: { ...prev[type], ...patch } }));
  };

  const resolveShift = async (preset: ShiftPreset): Promise<string | undefined> => {
    if (preset.type === "off") return undefined;
    const shiftType = preset.type === "day" ? "DAYTIME" : "NIGHTTIME";
    const found = (existingShifts as any[]).find(
      (s) => s.type === shiftType
        && s.startTime === preset.startTime
        && s.endTime   === preset.endTime
    );
    if (found) return found.id;

    const ovn   = isOvernightFn(preset.startTime, preset.endTime);
    const gross = calcGross(preset.startTime, preset.endTime);
    const newShift = await shiftsApi.create({
      name:        `${preset.type === "day" ? "Kunduzgi" : "Kechki"} ${preset.startTime}–${preset.endTime}`,
      type:        shiftType,
      startTime:   preset.startTime,
      endTime:     preset.endTime,
      durationH:   Math.round(gross / 60),
      isOvernight: ovn,
      graceMinutes: 15,
      lunchStart:  preset.lunchEnabled ? preset.lunchStart : null,
      lunchEnd:    preset.lunchEnabled ? preset.lunchEnd   : null,
      lunchGraceMin: 10,
    }, apiParams);
    qc.invalidateQueries({ queryKey: ["shifts"] });
    return newShift.id;
  };

  const buildEntries = async () => {
    const cache   = new Map<ShiftType, string | undefined>();
    const entries: Array<{ date: string; status: string; shiftId?: string }> = [];

    for (const [dayStr, type] of Object.entries(dayMap)) {
      const day     = Number(dayStr);
      const dateStr = `${calYear}-${String(calMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      if (type === "off") {
        entries.push({ date: dateStr, status: "DAY_OFF" });
        continue;
      }
      if (!cache.has(type)) {
        cache.set(type, await resolveShift(presets[type]));
      }
      entries.push({ date: dateStr, status: "WORKING", shiftId: cache.get(type) });
    }
    return entries;
  };

  const handleSubmit = async () => {
    const empIds = mode === "single"
      ? singleEmpId ? [singleEmpId] : []
      : Array.from(multiSelected);

    if (empIds.length === 0) { toast.error("Kamida bitta hodim tanlang"); return; }
    if (Object.keys(dayMap).length === 0) { toast.error("Kamida bitta kun belgilang"); return; }

    setSubmitting(true);
    try {
      const entries = await buildEntries();
      let total = 0;
      for (const empId of empIds) {
        const res = await schedulesApi.bulkManual({ employeeId: empId, entries });
        total += res?.created ?? entries.filter((e) => e.status === "WORKING").length;
      }
      qc.invalidateQueries({ queryKey: ["schedules-monthly"] });
      onMonthChange?.(calMonth, calYear);
      toast.success(
        empIds.length > 1
          ? `${empIds.length} hodim uchun grafik yaratildi`
          : `Grafik yaratildi: ${total} ta kun`
      );
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMulti = (id: string) => {
    setMultiSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllMulti = (ids: string[]) => {
    setMultiSelected((prev) => {
      const allSel = ids.every((id) => prev.has(id));
      const next   = new Set(prev);
      ids.forEach((id) => allSel ? next.delete(id) : next.add(id));
      return next;
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--bg-card)] flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">Grafik yaratish</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {MONTH_NAMES[calMonth - 1]} {calYear}
              {mode === "single" && singleEmpId && (
                <> · {employees.find((e) => e.id === singleEmpId)?.fullName}</>
              )}
              {mode === "multi" && multiSelected.size > 0 && (
                <> · <span className="text-indigo-400">{multiSelected.size} hodim</span></>
              )}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-5">

          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl">
            {([
              { v: "single", l: "Bitta hodim", icon: User },
              { v: "multi",  l: "Ko'p hodim",  icon: Users },
            ] as const).map(({ v, l, icon: Icon }) => (
              <button
                key={v}
                onClick={() => setMode(v)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all",
                  mode === v
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                <Icon className="w-3.5 h-3.5" /> {l}
              </button>
            ))}
          </div>

          {/* Single employee */}
          {mode === "single" && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wide">
                Hodim
              </label>
              <select
                value={singleEmpId}
                onChange={(e) => setSingleEmpId(e.target.value)}
                className="input-field"
              >
                <option value="">Tanlang</option>
                {employees.map((e: any) => (
                  <option key={e.id} value={e.id}>{e.fullName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Multi employee */}
          {mode === "multi" && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wide">
                Hodimlarni tanlang
              </label>
              <EmployeeSelect
                employees={employees}
                departments={departments}
                selected={multiSelected}
                onToggle={toggleMulti}
                onToggleAll={toggleAllMulti}
              />
            </div>
          )}

          <div className="border-t border-[var(--border)]" />

          {/* Month nav */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              Oy tanlang
            </label>
            <div className="flex items-center gap-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-1 py-0.5">
              <button onClick={() => navMonth(-1)} className="btn-ghost p-1.5 rounded-md">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-[var(--text-primary)] min-w-28 text-center">
                {MONTH_NAMES[calMonth - 1]} {calYear}
              </span>
              <button onClick={() => navMonth(1)} className="btn-ghost p-1.5 rounded-md">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="border-t border-[var(--border)]" />

          {/* Shift presets */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2.5">
              Smen turi tanlang
            </label>
            <div className="grid grid-cols-1 gap-2">
              {(["day", "night", "off"] as ShiftType[]).map((type) => (
                <ShiftCard
                  key={type}
                  preset={presets[type]}
                  active={activeShift === type}
                  onSelect={() => setActiveShift(type)}
                  onChange={(patch) => updatePreset(type, patch)}
                />
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--border)]" />

          {/* Calendar */}
          <ScheduleCalendar
            year={calYear}
            month={calMonth}
            dayMap={dayMap}
            dayPresets={presets}
            activeShift={activeShift}
            onDayClick={handleDayClick}
            onCopyPrev={handleCopyPrev}
          />

          {/* Footer */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1">Bekor</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary flex-1 gap-2"
            >
              <Zap className="w-4 h-4" />
              {submitting ? "Yaratilmoqda..." : "Grafik saqlash"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}