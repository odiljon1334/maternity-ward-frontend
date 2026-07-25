"use client";
import { GenerateModal } from "@/components/schedules/GenerateModal";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { schedulesApi, employeesApi, shiftsApi, departmentsApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Zap, X, Edit3, Check, Clock, Sun, Moon, Plus, Edit2, Trash2, Search, Copy, Upload, FileSpreadsheet } from "lucide-react";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import { useAuthStore } from "@/stores/auth";

// ─── Ish kunlari ─────────────────────────────────────────────────────────────
const WEEK_DAYS = [
  { value: 1, label: "Du" },
  { value: 2, label: "Se" },
  { value: 3, label: "Ch" },
  { value: 4, label: "Pa" },
  { value: 5, label: "Ju" },
  { value: 6, label: "Sha" },
  { value: 0, label: "Yak" },
];

const PATTERNS = [
  { value: "FIXED_DAY",  label: "Faqat kunduzgi (o'zgarmas)" },
  { value: "FIXED_NIGHT",label: "Faqat kechki (o'zgarmas)" },
  { value: "2-2",        label: "2-2 (2 hafta kunduz, 2 hafta kech)" },
  { value: "1-1",        label: "1-1 (1 hafta kunduz, 1 hafta kech)" },
  { value: "3-1",        label: "3-1 (3 hafta kunduz, 1 hafta kech)" },
];

// ─── Shift types ─────────────────────────────────────────────────────────────
type WeekDayConfig = {
  mode: "off" | "shift" | "custom";
  shiftId?: string;
  shiftType?: "DAYTIME" | "NIGHTTIME";
  startTime?: string;
  endTime?: string;
};

type ShiftForm = {
  name: string;
  type: "DAYTIME" | "NIGHTTIME" | "CUSTOM";
  startTime: string;
  endTime: string;
  graceMinutes: number;
  lunchStart: string;
  lunchEnd: string;
  lunchGraceMin: number;
};

function calcDuration(start: string, end: string, overnight: boolean): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (overnight || mins <= 0) mins += 24 * 60;
  return Math.round(mins / 60);
}

function ShiftModal({ open, onClose, shift, targetHospitalId }: {
  open: boolean; onClose: () => void; shift?: any; targetHospitalId?: string;
}) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ShiftForm>();
  const params = targetHospitalId ? { targetHospitalId } : undefined;

  const startTime = watch("startTime", "08:00");
  const endTime = watch("endTime", "17:00");

  const isOvernight = (() => {
    if (!startTime || !endTime) return false;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    return (eh * 60 + em) < (sh * 60 + sm);
  })();

  const durationH = startTime && endTime ? calcDuration(startTime, endTime, isOvernight) : 0;

  useEffect(() => {
    if (shift) {
      reset({
        name: shift.name, type: shift.type, startTime: shift.startTime, endTime: shift.endTime,
        graceMinutes: shift.graceMinutes ?? 15,
        lunchStart: shift.lunchStart ?? "", lunchEnd: shift.lunchEnd ?? "", lunchGraceMin: shift.lunchGraceMin ?? 10,
      });
    } else {
      reset({ name: "", type: "DAYTIME", startTime: "08:00", endTime: "17:00", graceMinutes: 15, lunchStart: "", lunchEnd: "", lunchGraceMin: 10 });
    }
  }, [shift, open, reset]);

  const mutation = useMutation({
    mutationFn: (data: ShiftForm) => {
      const payload = {
        ...data,
        durationH,
        isOvernight,
        graceMinutes: Number(data.graceMinutes),
        lunchStart: data.lunchStart || null,
        lunchEnd: data.lunchEnd || null,
        lunchGraceMin: Number(data.lunchGraceMin) || 10,
      };
      return shift
        ? shiftsApi.update(shift.id, payload, params)
        : shiftsApi.create(payload, params);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shifts"] });
      toast.success(shift ? "Smen yangilandi" : "Smen qo'shildi");
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[var(--text-primary)] text-sm">
            {shift ? "Smenni tahrirlash" : "Yangi smen"}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Smen nomi *</label>
            <input {...register("name", { required: "Nom kerak" })} className="input-field text-sm" placeholder="1-smen" />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Turi *</label>
            <select {...register("type", { required: true })} className="input-field text-sm">
              <option value="DAYTIME">☀️ Kunduzgi</option>
              <option value="NIGHTTIME">🌙 Tungi</option>
              <option value="CUSTOM">⚙️ Maxsus</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Boshlanish *</label>
              <input {...register("startTime", { required: true })} type="time" className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Tugash *</label>
              <input {...register("endTime", { required: true })} type="time" className="input-field text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--bg-hover)] text-xs text-[var(--text-muted)]">
            <span>⏱ Davomiylik: <b className="text-[var(--text-primary)]">{durationH} soat</b></span>
            {isOvernight && <span className="text-amber-400">🌙 Tungi (keyingi kun)</span>}
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Ruxsat (daqiqa)</label>
            <input {...register("graceMinutes", { min: 0, max: 60 })} type="number" min={0} max={60} className="input-field text-sm" placeholder="15" />
            <p className="text-xs text-[var(--text-muted)] mt-1">Kechikish uchun ruxsat etilgan daqiqalar (0–60)</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] p-3 space-y-2.5">
            <p className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">🍽️ Tushlik vaqti <span className="font-normal">(ixtiyoriy)</span></p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Tushlik boshi</label>
                <input {...register("lunchStart")} type="time" className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Tushlik oxiri</label>
                <input {...register("lunchEnd")} type="time" className="input-field text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Ruxsat (daqiqa)</label>
              <input {...register("lunchGraceMin", { min: 0, max: 30 })} type="number" min={0} max={30} className="input-field text-sm" placeholder="10" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 text-sm">Bekor</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 text-sm">
              {mutation.isPending ? "Saqlanmoqda..." : (shift ? "Yangilash" : "Qo'shish")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ShiftsView({ targetHospitalId }: { targetHospitalId?: string }) {
  const qc = useQueryClient();
  const [shiftModal, setShiftModal] = useState<{ open: boolean; shift?: any }>({ open: false });
  const params = targetHospitalId ? { targetHospitalId } : undefined;

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ["shifts", targetHospitalId],
    queryFn: () => shiftsApi.list(params),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => shiftsApi.delete(id, params),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shifts"] }); toast.success("O'chirildi"); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "O'chirishda xatolik"),
  });

  const seedMut = useMutation({
    mutationFn: () => shiftsApi.seed(params),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shifts"] }); toast.success("Standart smenlar yaratildi"); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-400" />
            <h3 className="font-semibold text-[var(--text-primary)]">Smenlar</h3>
            <span className="badge-gray">{(shifts as any[]).length}</span>
          </div>
          <button onClick={() => setShiftModal({ open: true })} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Qo&apos;shish
          </button>
        </div>

        <div>
          {isLoading && <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">Yuklanmoqda...</div>}
          {(shifts as any[]).map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors group">
              <div className="flex items-center gap-3 min-w-0">
                {s.type === "DAYTIME"
                  ? <Sun className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  : <Moon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                }
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{s.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {s.startTime} – {s.endTime} &nbsp;·&nbsp; {s.durationH} soat
                    {s.isOvernight && <span className="text-amber-400 ml-1">🌙</span>}
                    {s.lunchStart && <span className="ml-1.5 text-orange-400">🍽 {s.lunchStart}–{s.lunchEnd}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded font-medium",
                  s.type === "DAYTIME" ? "bg-yellow-500/15 text-yellow-400" : "bg-indigo-500/15 text-indigo-400"
                )}>
                  {s.type === "DAYTIME" ? "Kunduzgi" : s.type === "NIGHTTIME" ? "Tungi" : "Maxsus"}
                </span>
                <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-hover)] px-1.5 py-0.5 rounded">
                  {s.graceMinutes} min
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setShiftModal({ open: true, shift: s })} className="p-1.5 rounded text-[var(--text-muted)] hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => confirm("Smenni o'chirishni tasdiqlaysizmi?") && deleteMut.mutate(s.id)} className="p-1.5 rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!isLoading && (shifts as any[]).length === 0 && (
            <div className="px-4 py-10 text-center space-y-3">
              <Clock className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-40" />
              <p className="text-sm text-[var(--text-muted)]">Smenlar yo&apos;q</p>
              <button onClick={() => seedMut.mutate()} disabled={seedMut.isPending} className="btn-primary py-1.5 px-4 text-xs mx-auto flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                {seedMut.isPending ? "Yaratilmoqda..." : "Standart smenlarni yaratish"}
              </button>
              <p className="text-xs text-[var(--text-muted)]">Kunduzgi (08:00–20:00) va Kechki (20:00–08:00)</p>
            </div>
          )}
        </div>
      </div>

      <ShiftModal
        open={shiftModal.open}
        onClose={() => setShiftModal({ open: false })}
        shift={shiftModal.shift}
        targetHospitalId={targetHospitalId}
      />
    </>
  );
}

// ─── Jadval katakchasi rangi ──────────────────────────────────────────────────
function CellBadge({ sch }: { sch?: any }) {
  if (!sch) return <span className="text-gray-700 text-[10px]">—</span>;
  if (sch.status === "DAY_OFF") return <span className="text-gray-600 text-[10px]">○</span>;
  const type = sch.shift?.type;
  const timeStr = sch.shift?.startTime && sch.shift?.endTime
    ? `${sch.shift.startTime.substring(0, 2)}–${sch.shift.endTime.substring(0, 2)}`
    : null;
  if (type === "DAYTIME") return (
    <div className="flex flex-col items-center gap-[1px]">
      <span className="badge-blue px-1 py-0.5 text-[10px] leading-none">K</span>
      {timeStr && <span className="text-[8px] text-blue-400/60 leading-none">{timeStr}</span>}
    </div>
  );
  if (type === "NIGHTTIME") return (
    <div className="flex flex-col items-center gap-[1px]">
      <span className="badge-purple px-1 py-0.5 text-[10px] leading-none">Tu</span>
      {timeStr && <span className="text-[8px] text-purple-400/60 leading-none">{timeStr}</span>}
    </div>
  );
  return (
    <div className="flex flex-col items-center gap-[1px]">
      <span className="text-indigo-400 text-[10px] leading-none">✓</span>
      {timeStr && <span className="text-[8px] text-indigo-400/60 leading-none">{timeStr}</span>}
    </div>
  );
}

// ─── Cell Edit Modal ──────────────────────────────────────────────────────────
function CellEditModal({
  entry, shifts, onClose,
}: {
  entry: { id: string; status: string; shiftId: string; employeeName: string; date: string } | null;
  shifts: any[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>(entry?.status ?? "WORKING");
  const [shiftId, setShiftId] = useState<string>(entry?.shiftId ?? "");

  const mutation = useMutation({
    mutationFn: () => schedulesApi.update(entry!.id, { status, shiftId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedules-monthly"] });
      toast.success("Grafik yangilandi");
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  if (!entry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">Grafik tahrirlash</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{entry.employeeName} — {dayjs(entry.date).format("DD.MM.YYYY")}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Holat</label>
            <div className="flex gap-2">
              {[
                { v: "WORKING", l: "Ish kuni" },
                { v: "DAY_OFF", l: "Dam olish" },
              ].map((s) => (
                <button
                  key={s.v}
                  onClick={() => setStatus(s.v)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-colors border",
                    status === s.v
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-[var(--border)] text-[var(--text-muted)] hover:border-indigo-500"
                  )}
                >
                  {s.l}
                </button>
              ))}
            </div>
          </div>

          {status === "WORKING" && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Smen</label>
              <select
                value={shiftId}
                onChange={(e) => setShiftId(e.target.value)}
                className="input-field"
              >
                <option value="">Tanlang</option>
                {shifts.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.type === "DAYTIME" ? "Kunduzgi" : "Kechki"})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1">Bekor</button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="btn-primary flex-1 gap-2"
            >
              <Check className="w-4 h-4" />
              {mutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DayConfigRow — haftalik shablon satri ────────────────────────────────────
function DayConfigRow({ label, isWeekend, cfg, shifts, onChange }: {
  label: string;
  isWeekend: boolean;
  cfg: WeekDayConfig;
  shifts: any[];
  onChange: (patch: Partial<WeekDayConfig>) => void;
}) {
  return (
    <div className="p-2.5 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn(
          "min-w-[3.5rem] text-xs font-semibold flex-shrink-0",
          isWeekend ? "text-red-400" : "text-[var(--text-primary)]"
        )}>
          {label}
        </span>
        <div className="flex gap-1">
          {([
            { v: "off",    l: "Dam" },
            { v: "shift",  l: "Smen" },
            { v: "custom", l: "Vaqt" },
          ] as const).map((m) => (
            <button
              key={m.v}
              type="button"
              onClick={() => onChange({ mode: m.v })}
              className={cn(
                "px-2 py-1 rounded text-[11px] font-medium border transition-colors",
                cfg.mode === m.v
                  ? m.v === "off"
                    ? "bg-gray-700 border-gray-600 text-gray-200"
                    : "bg-indigo-600 border-indigo-600 text-white"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:border-indigo-500"
              )}
            >
              {m.l}
            </button>
          ))}
        </div>
        {cfg.mode === "custom" && cfg.startTime && (
          <span className="text-[11px] text-[var(--text-muted)] ml-auto">
            {cfg.shiftType === "DAYTIME" ? "☀️" : "🌙"} {cfg.startTime}–{cfg.endTime}
          </span>
        )}
        {cfg.mode === "shift" && cfg.shiftId && (
          <span className="text-[11px] text-indigo-400 ml-auto truncate max-w-24">
            {shifts.find((s: any) => s.id === cfg.shiftId)?.name ?? ""}
          </span>
        )}
      </div>

      {cfg.mode === "shift" && (
        <div className="ml-10">
          <select
            value={cfg.shiftId ?? ""}
            onChange={(e) => onChange({ shiftId: e.target.value })}
            className="input-field text-xs"
          >
            <option value="">Tanlang</option>
            {shifts.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name} ({s.startTime}–{s.endTime})</option>
            ))}
          </select>
        </div>
      )}

      {cfg.mode === "custom" && (
        <div className="ml-10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange({
              shiftType: cfg.shiftType === "DAYTIME" ? "NIGHTTIME" : "DAYTIME",
              startTime: cfg.shiftType === "DAYTIME" ? "20:00" : "08:00",
              endTime:   cfg.shiftType === "DAYTIME" ? "08:00" : "20:00",
            })}
            className={cn(
              "flex items-center gap-1 px-2 py-1.5 rounded border text-xs font-medium transition-colors flex-shrink-0",
              cfg.shiftType === "DAYTIME"
                ? "bg-yellow-500/10 border-yellow-500/40 text-yellow-400"
                : "bg-indigo-500/10 border-indigo-500/40 text-indigo-400"
            )}
          >
            {cfg.shiftType === "DAYTIME" ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
          </button>
          <input
            type="time"
            value={cfg.startTime ?? "08:00"}
            onChange={(e) => onChange({ startTime: e.target.value })}
            className="input-field text-xs flex-1"
          />
          <span className="text-[var(--text-muted)] text-xs flex-shrink-0">–</span>
          <input
            type="time"
            value={cfg.endTime ?? "20:00"}
            onChange={(e) => onChange({ endTime: e.target.value })}
            className="input-field text-xs flex-1"
          />
        </div>
      )}
    </div>
  );
}

// ─── XLSX Import Modal ───────────────────────────────────────────────────────
function ImportModal({
  open, onClose, month, year, targetHospitalId, onSuccess,
}: {
  open: boolean; onClose: () => void; month: number; year: number;
  targetHospitalId?: string; onSuccess?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [importMonth, setImportMonth] = useState(month);
  const [importYear, setImportYear] = useState(year);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("month", String(importMonth));
      fd.append("year", String(importYear));
      const res = await schedulesApi.importXlsx(fd, targetHospitalId ? { targetHospitalId } : undefined);
      setResult(res);
      onSuccess?.();
      toast.success(res?.message || "Import yakunlandi");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Import xatolik");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <h2 className="font-semibold text-[var(--text-primary)]">XLSX Import</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-lg bg-[var(--bg-hover)] p-3 text-xs text-[var(--text-muted)] space-y-1">
            <p className="font-medium text-[var(--text-primary)]">Fayl formati:</p>
            <p>• A ustun: Ism familya</p>
            <p>• F–J ustunlar: Dushanba–Juma ish vaqti (masalan: <code className="text-emerald-400">08:00  16:30</code>)</p>
            <p>• 7 ustun bo'lsa Shanba va Yakshanba ham qo'shiladi</p>
            <p>• Bo'sh kataklar = dam olish</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Oy</label>
              <select value={importMonth} onChange={(e) => setImportMonth(+e.target.value)} className="input-field text-sm">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{dayjs().month(m - 1).format("MMMM")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Yil</label>
              <select value={importYear} onChange={(e) => setImportYear(+e.target.value)} className="input-field text-sm">
                {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Fayl (.xlsx)</label>
            <label className={cn(
              "flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
              file ? "border-emerald-500/50 bg-emerald-500/5" : "border-[var(--border)] hover:border-indigo-500/50"
            )}>
              <Upload className={cn("w-6 h-6", file ? "text-emerald-400" : "text-[var(--text-muted)]")} />
              <span className="text-sm text-center text-[var(--text-muted)]">
                {file ? file.name : "Faylni tanlash yoki bu yerga tashlash"}
              </span>
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); }} />
            </label>
          </div>

          {result && (
            <div className="rounded-lg bg-[var(--bg-hover)] p-3 text-xs space-y-2">
              <p className="text-emerald-400 font-semibold">✓ Import yakunlandi</p>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="rounded bg-[var(--bg-card)] px-2 py-1.5 text-center">
                  <p className="text-lg font-bold text-[var(--text-primary)]">{result.employeesCount ?? "—"}</p>
                  <p className="text-[var(--text-muted)]">Hodim</p>
                </div>
                <div className="rounded bg-[var(--bg-card)] px-2 py-1.5 text-center">
                  <p className="text-lg font-bold text-[var(--text-primary)]">{(result.created ?? 0) + (result.updated ?? 0)}</p>
                  <p className="text-[var(--text-muted)]">Grafik yozuvi</p>
                </div>
                <div className="rounded bg-emerald-500/10 px-2 py-1.5 text-center">
                  <p className="text-lg font-bold text-emerald-400">{result.created ?? 0}</p>
                  <p className="text-[var(--text-muted)]">Yangi</p>
                </div>
                <div className="rounded bg-indigo-500/10 px-2 py-1.5 text-center">
                  <p className="text-lg font-bold text-indigo-400">{result.updated ?? 0}</p>
                  <p className="text-[var(--text-muted)]">Yangilandi</p>
                </div>
              </div>
              {result.unmatched?.length > 0 && (
                <div>
                  <p className="text-amber-400 font-medium">Topilmagan xodimlar ({result.unmatched.length}):</p>
                  <div className="mt-1 max-h-24 overflow-y-auto space-y-0.5">
                    {result.unmatched.map((n: string, i: number) => (
                      <p key={i} className="text-[var(--text-muted)] truncate">• {n}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1 text-sm">Yopish</button>
            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              className="btn-primary flex-1 text-sm gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              {loading ? "Yuklanmoqda..." : "Import qilish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Lotin / Kirill normalizer ────────────────────────────────────────────────
function normalizeStr(str: string): string {
  const cyr: Record<string, string> = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'j','з':'z',
    'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
    'с':'s','т':'t','у':'u','ф':'f','х':'x','ц':'c','ч':'ch','ш':'sh',
    'ъ':"'",'ь':"'",'э':'e','ю':'yu','я':'ya',
    'ғ':'g','қ':'q','ҳ':'h','ў':'o',
  };
  return str.toLowerCase().split('').map(c => cyr[c] || c).join('');
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SchedulesPage() {
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [year, setYear] = useState(dayjs().year());
  const [deptFilter, setDeptFilter] = useState("");
  const [empSearch, setEmpSearch] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState<"all" | "with" | "without">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [generateEmpId, setGenerateEmpId] = useState<string | undefined>(undefined); // xodim row klik
  const [editEntry, setEditEntry] = useState<any>(null);
  const [view, setView] = useState<"grafik" | "smenlar">("grafik");
  const [rollingOver, setRollingOver] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { selectedHospital } = useAuthStore();
  const targetHospitalId = selectedHospital?.id;
  const qc = useQueryClient();

  // Kasalxona o'zgarganda barcha filtrlar reset bo'lsin
  useEffect(() => {
    setDeptFilter("");
    setEmpSearch("");
    setScheduleFilter("all");
  }, [targetHospitalId]);

  // Monthly schedules — barcha hodimlar uchun bir oylik grafik
  const { data: schedules = [], isLoading: schedLoading } = useQuery({
    queryKey: ["schedules-monthly", month, year, targetHospitalId],
    queryFn: () =>
      schedulesApi.monthly({ month, year, ...(targetHospitalId && { targetHospitalId }) }),
  });

  const { data: employeesResp, isLoading: empLoading } = useQuery({
    queryKey: ["employees-all", targetHospitalId],
    queryFn: () => employeesApi.list({ limit: 500, ...(targetHospitalId ? { targetHospitalId } : {}) }),
    staleTime: 30_000,
  });
  // ResponseInterceptor: { success, data: [...], meta: {...} }
  const allEmployees: any[] = (employeesResp as any)?.data ?? [];

  const { data: shifts = [] } = useQuery({
    queryKey: ["shifts", targetHospitalId],
    queryFn: () => shiftsApi.list(targetHospitalId ? { targetHospitalId } : undefined),
  });
  const { data: departments = [] } = useQuery({
    queryKey: ["departments", targetHospitalId],
    queryFn: () => departmentsApi.list(targetHospitalId ? { targetHospitalId } : undefined),
  });

  // Grafik ma'lumotlarini: employeeId → { YYYY-MM-DD → schedule } formatga o'tkazish
  const scheduleMap = useMemo(() => {
    const map = new Map<string, Map<string, any>>();
    for (const s of schedules as any[]) {
      if (!map.has(s.employeeId)) map.set(s.employeeId, new Map());
      const dateKey = dayjs(s.date).format("YYYY-MM-DD");
      map.get(s.employeeId)!.set(dateKey, s);
    }
    return map;
  }, [schedules]);

  // Faqat WORKING grafigi bor hodimlar ID seti (DAY_OFF hisobga olinmaydi)
  const workingEmpIds = useMemo(() => {
    const set = new Set<string>();
    for (const s of schedules as any[]) {
      if (s.status === "WORKING") set.add(s.employeeId);
    }
    return set;
  }, [schedules]);

  // Filtrlar: bo'lim + grafik holati + ism qidiruv
  const employees = useMemo(() => {
    let list = deptFilter
      ? allEmployees.filter((e) => e.department?.id === deptFilter || e.departmentId === deptFilter)
      : [...allEmployees];
    if (scheduleFilter === "with")
      list = list.filter((e) => workingEmpIds.has(e.id));
    else if (scheduleFilter === "without")
      list = list.filter((e) => !workingEmpIds.has(e.id));
    if (empSearch.trim()) {
      const q = normalizeStr(empSearch.trim());
      list = list.filter((e) => normalizeStr(e.fullName).includes(q));
    }
    return list;
  }, [allEmployees, deptFilter, scheduleFilter, empSearch, workingEmpIds]);

  // Statistika uchun sof bo'lim filtri (scheduleFilter/search ta'sir qilmaydi)
  const deptFilteredEmployees = useMemo(
    () => deptFilter
      ? allEmployees.filter((e) => e.department?.id === deptFilter || e.departmentId === deptFilter)
      : allEmployees,
    [allEmployees, deptFilter]
  );
  const withScheduleCount    = deptFilteredEmployees.filter((e) => workingEmpIds.has(e.id)).length;
  const withoutScheduleCount = deptFilteredEmployees.length - withScheduleCount;

  const isLoading = schedLoading || empLoading;
  const daysInMonth = dayjs(`${year}-${String(month).padStart(2, "0")}-01`).daysInMonth();

  // Statistika
  const stats = useMemo(() => {
    const all = schedules as any[];
    const working = all.filter((s) => s.status === "WORKING").length;
    const dayOff = all.filter((s) => s.status === "DAY_OFF").length;
    const day   = all.filter((s) => s.status === "WORKING" && s.shift?.type === "DAYTIME").length;
    const night = all.filter((s) => s.status === "WORKING" && s.shift?.type === "NIGHTTIME").length;
    return { working, dayOff, day, night };
  }, [schedules]);

  const navMonth = (dir: number) => {
    const next = dayjs(`${year}-${String(month).padStart(2, "0")}-01`).add(dir, "month");
    setMonth(next.month() + 1);
    setYear(next.year());
  };

  // Generate modal yakunlanganda oy/yilga o'tish
  const handleMonthChange = (m: number, y: number) => {
    setMonth(m);
    setYear(y);
    qc.invalidateQueries({ queryKey: ["schedules-monthly"] });
  };

  // Oldingi oydan joriy oyga grafik ko'chirish
  const handleRollover = async () => {
    const cur  = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
    const prev = cur.subtract(1, "month");
    const fromMonth = prev.month() + 1;
    const fromYear  = prev.year();
    const toMonth   = month;
    const toYear    = year;

    const confirm = window.confirm(
      `${prev.format("MMMM YYYY")} oyidagi grafiklarni ${cur.format("MMMM YYYY")} oyiga ko'chirasizmi?\n\n` +
      `Allaqachon grafigi bor xodimlar o'tkazib yuboriladi.`
    );
    if (!confirm) return;

    setRollingOver(true);
    const tid = toast.loading("Grafiklar ko'chirilmoqda...");
    try {
      const params = targetHospitalId ? { targetHospitalId } : undefined;
      const res = await schedulesApi.rollover({ fromMonth, fromYear, toMonth, toYear }, params);
      toast.success(res?.message || `${res?.rolled ?? 0} ta xodim grafigi ko'chirildi`, { id: tid });
      qc.invalidateQueries({ queryKey: ["schedules"] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Ko'chirishda xatolik", { id: tid });
    } finally {
      setRollingOver(false);
    }
  };

  return (
    <div>
      <Topbar title="Grafik" subtitle="Oylik ish grafigi" />

      <div className="p-4 lg:p-6 space-y-4">
        {/* Header controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Tab toggle */}
          <div className="flex items-center gap-1 p-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg">
            <button
              onClick={() => setView("grafik")}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                view === "grafik" ? "bg-indigo-600 text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              <Edit3 className="w-3.5 h-3.5" /> Grafik
            </button>
            <button
              onClick={() => setView("smenlar")}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                view === "smenlar" ? "bg-indigo-600 text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              <Clock className="w-3.5 h-3.5" /> Smenlar
            </button>
          </div>

          {view === "grafik" && (
            <>
              {/* Month nav */}
              <div className="flex items-center gap-1 card px-2 py-1">
                <button onClick={() => navMonth(-1)} className="btn-ghost p-1.5">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-sm font-medium text-[var(--text-primary)] min-w-32 text-center">
                  {dayjs(`${year}-${String(month).padStart(2, "0")}-01`).format("MMMM YYYY")}
                </span>
                <button onClick={() => navMonth(1)} className="btn-ghost p-1.5">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Buoy tugmasi — hozirgi oyda emasak ko'rsatiladi */}
              {(month !== dayjs().month() + 1 || year !== dayjs().year()) && (
                <button
                  onClick={() => { setMonth(dayjs().month() + 1); setYear(dayjs().year()); }}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Bu oy
                </button>
              )}

              {/* Dept filter */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="input-field text-sm w-full sm:w-auto"
              >
                <option value="">Barcha bo'limlar</option>
                {(departments as any[]).map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              {/* Stats mini chips */}
              {(schedules as any[]).length > 0 && (
                <div className="flex gap-2 text-xs">
                  <span className="badge-blue px-2 py-1">K: {stats.day}</span>
                  <span className="badge-purple px-2 py-1">Tu: {stats.night}</span>
                  <span className="px-2 py-1 rounded-full bg-[var(--bg-hover)] text-[var(--text-muted)]">○ {stats.dayOff}</span>
                </div>
              )}

              {/* Oldingi oydan grafik ko'chirish */}
              <button
                onClick={handleRollover}
                disabled={rollingOver}
                className="btn-secondary gap-1.5 text-xs sm:text-sm"
                title="Oldingi oyning grafigini shu oyga ko'chirish"
              >
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">{rollingOver ? "Ko'chirilmoqda..." : "Avvalgi oy"}</span>
              </button>

              <div className="flex gap-2 ml-auto">
                <button onClick={() => setImportOpen(true)} className="btn-secondary gap-1.5 text-xs sm:text-sm" title="XLSX fayldan grafik import qilish">
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Import</span>
                </button>
                <button onClick={() => { setGenerateEmpId(undefined); setModalOpen(true); }} className="btn-primary gap-2">
                  <Zap className="w-4 h-4" /> Grafik yaratish
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Filter qatori: qidiruv + grafik holati ── */}
        {view === "grafik" && (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
            {/* Ism qidiruv (Lotin / Kirill) — full width on mobile */}
            <div className="relative sm:flex-1 sm:min-w-44 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
              <input
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                placeholder="Ism, familiya..."
                className="input-field w-full text-sm h-9"
                style={{ paddingLeft: '2.25rem' }}
              />
              {empSearch && (
                <button onClick={() => setEmpSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Grafik holati filtrlari */}
            <div className="flex items-center gap-1.5">
              {([
                { v: "all",     l: "Barchasi",   count: deptFilteredEmployees.length,   cls: "indigo" },
                { v: "with",    l: "✓ Grafik bor", count: withScheduleCount,             cls: "green"  },
                { v: "without", l: "○ Grafiksiz", count: withoutScheduleCount,           cls: "amber"  },
              ] as const).map((f) => (
                <button
                  key={f.v}
                  onClick={() => setScheduleFilter(f.v)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap",
                    scheduleFilter === f.v
                      ? f.v === "without"
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                        : f.v === "with"
                        ? "bg-green-500/20 border-green-500/40 text-green-300"
                        : "bg-indigo-600 border-indigo-600 text-white"
                      : "border-[var(--border)] text-[var(--text-muted)] hover:border-indigo-500 hover:text-[var(--text-primary)]"
                  )}
                >
                  {f.l}
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                    scheduleFilter === f.v ? "bg-white/20 text-inherit" : "bg-[var(--bg-hover)]"
                  )}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Ko'rsatilayotgan son + tozalash */}
            <div className="ml-auto flex items-center gap-3 text-xs text-[var(--text-muted)]">
              {(empSearch || scheduleFilter !== "all") && (
                <>
                  <span className="text-indigo-400 font-medium">{employees.length} ta topildi</span>
                  <button
                    onClick={() => { setEmpSearch(""); setScheduleFilter("all"); }}
                    className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors"
                  >
                    <X className="w-3 h-3" /> Tozalash
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Smenlar view */}
        {view === "smenlar" && (
          <ShiftsView targetHospitalId={targetHospitalId} />
        )}

        {/* Calendar table */}
        {view === "grafik" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-20">
                <tr className="border-b border-[var(--border)]">
                  <th className="sticky left-0 bg-[var(--bg-card)] z-30 text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase min-w-48">
                    Xodim
                  </th>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const d = dayjs(`${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`);
                    const isWeekend = d.day() === 0 || d.day() === 6;
                    const isToday = d.isSame(dayjs(), "day");
                    return (
                      <th
                        key={i}
                        className={cn(
                          "text-center py-2 px-0.5 font-medium min-w-9 bg-[var(--bg-card)]",
                          isWeekend ? "text-gray-600" : "text-[var(--text-muted)]",
                          isToday && "bg-indigo-950/30"
                        )}
                      >
                        <div className={cn(isToday && "text-indigo-400 font-bold")}>{i + 1}</div>
                        <div className="text-[10px] opacity-60">{d.format("dd")}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {isLoading &&
                  [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b border-[var(--border)]">
                      <td className="px-4 py-3">
                        <div className="h-4 w-36 rounded bg-[var(--bg-hover)] animate-pulse" />
                      </td>
                      {[...Array(daysInMonth)].map((_, j) => (
                        <td key={j} className="px-0.5 py-3">
                          <div className="h-5 w-8 rounded bg-[var(--bg-hover)] animate-pulse mx-auto" />
                        </td>
                      ))}
                    </tr>
                  ))}

                {!isLoading && employees.length === 0 && (
                  <tr>
                    <td
                      colSpan={daysInMonth + 1}
                      className="text-center py-12 text-[var(--text-muted)]"
                    >
                      Xodimlar topilmadi
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  employees.map((emp: any) => {
                    const empSchedules = scheduleMap.get(emp.id);
                    return (
                      <tr key={emp.id} className="border-b border-[var(--border)] group hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="sticky left-0 bg-[var(--bg-card)] group-hover:bg-[var(--bg-hover)] z-10 px-4 py-2.5 transition-colors">
                          <div
                            className="cursor-pointer hover:text-indigo-400 transition-colors"
                            title="Grafik yaratish / tahrirlash"
                            onClick={() => { setGenerateEmpId(emp.id); setModalOpen(true); }}
                          >
                            <p className="font-medium text-[var(--text-primary)] truncate max-w-44 group-hover:text-indigo-400">{emp.fullName}</p>
                            <p className="text-[10px] text-[var(--text-muted)] truncate">{emp.department?.name}</p>
                          </div>
                        </td>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
                          const d = dayjs(dateStr);
                          const isWeekend = d.day() === 0 || d.day() === 6;
                          const isToday = d.isSame(dayjs(), "day");
                          const sch = empSchedules?.get(dateStr);

                          return (
                            <td
                              key={i}
                              className={cn(
                                "text-center px-0.5 py-2",
                                isWeekend && "bg-[var(--bg-primary)]/30",
                                isToday && "bg-indigo-950/20",
                                sch && "cursor-pointer hover:bg-indigo-950/30 transition-colors"
                              )}
                              onClick={() => {
                                if (!sch) return;
                                setEditEntry({
                                  id: sch.id,
                                  status: sch.status,
                                  shiftId: sch.shiftId,
                                  employeeName: emp.fullName,
                                  date: dateStr,
                                });
                              }}
                            >
                              <CellBadge sch={sch} />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <span className="badge-blue px-1.5 py-0.5">K</span> Kunduzgi smen
            </span>
            <span className="flex items-center gap-1.5">
              <span className="badge-purple px-1.5 py-0.5">Tu</span> Kechki smen
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 text-center text-gray-500">○</span> Dam olish
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 text-center text-gray-700">—</span> Grafik yo'q
            </span>
            <span className="flex items-center gap-1.5 ml-auto">
              <Edit3 className="w-3 h-3" /> Katakchaga bosib tahrirlash
            </span>
          </div>
        </div>
        )}
      </div>

      {/* Modals */}
      <GenerateModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setGenerateEmpId(undefined); }}
        employees={allEmployees}
        shifts={shifts}
        departments={departments}
        targetHospitalId={targetHospitalId}
        preEmployeeId={generateEmpId}
        onMonthChange={handleMonthChange}
      />

      <CellEditModal
        entry={editEntry}
        shifts={shifts as any[]}
        onClose={() => setEditEntry(null)}
      />

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        month={month}
        year={year}
        targetHospitalId={targetHospitalId}
        onSuccess={() => qc.invalidateQueries({ queryKey: ["schedules-monthly"] })}
      />
    </div>
  );
}
