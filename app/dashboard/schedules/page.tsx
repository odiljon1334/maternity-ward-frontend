"use client";

import { GenerateModal } from "@/components/schedules/GenerateModal";
import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { schedulesApi, employeesApi, shiftsApi, departmentsApi, schedulePlanningApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight, X, Edit3, Check, Clock, Sun, Moon,
  Plus, Edit2, Trash2, Search, Copy, Upload, FileSpreadsheet,
  Calendar, Users, UserCheck, UserX, Sparkles, AlertCircle, Lock
} from "lucide-react";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import { useAuthStore } from "@/stores/auth";
import { PostSchedulePlanner } from "@/components/schedules/PostSchedulePlanner";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/FormControls";
import { Surface } from "@/components/ui/Surface";
import { StatePanel } from "@/components/ui/StatePanel";
import { ConfirmDialog } from "@/components/ui/Dialog";

// ─── Sana kaliti keshi ──────────────────────────────────────────────────────
// Backend ISO sana qaytaradi; jadval kalitlari "YYYY-MM-DD" ko'rinishida.
// Bir oyda ~31 xil qiymat bo'lgani uchun natijani keshlaymiz — bu dayjs
// chaqiruvlarini ~10 000 dan ~31 taga tushiradi. Semantika o'zgarmaydi.
const dateKeyCache = new Map<string, string>();
function toDateKey(raw: string | Date): string {
  const s = String(raw);
  let key = dateKeyCache.get(s);
  if (key === undefined) {
    key = dayjs(s).format("YYYY-MM-DD");
    dateKeyCache.set(s, key);
  }
  return key;
}

// ─── Shift Duration Calc ───────────────────────────────────────────────────
function calcDuration(start: string, end: string, overnight: boolean): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (overnight || mins <= 0) mins += 24 * 60;
  return Math.round(mins / 60);
}

// ─── Shift Modal ─────────────────────────────────────────────────────────────
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

function ShiftModal({ open, onClose, shift, targetHospitalId }: {
  open: boolean; onClose: () => void; shift?: any; targetHospitalId?: string;
}) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ShiftForm>();
  const params = targetHospitalId ? { targetHospitalId } : undefined;

  const startTime = watch("startTime", "08:00");
  const endTime = watch("endTime", "17:00");

  const isOvernight = useMemo(() => {
    if (!startTime || !endTime) return false;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    return (eh * 60 + em) < (sh * 60 + sm);
  }, [startTime, endTime]);

  const durationH = useMemo(() => startTime && endTime ? calcDuration(startTime, endTime, isOvernight) : 0, [startTime, endTime, isOvernight]);

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
      return shift ? shiftsApi.update(shift.id, payload, params) : shiftsApi.create(payload, params);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shifts"] });
      toast.success(shift ? "Smen yangilandi" : "Smen qo'shildi");
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik yuz berdi"),
  });

  if (!open) return null;

  return (
    <div className="ui-dialog-backdrop">
      <div className="ui-dialog-panel max-w-md space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {shift ? "Smenni tahrirlash" : "Yangi smen yaratish"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ish vaqti parametrlarini kiriting</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost min-h-9 p-2" aria-label="Oynani yopish">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Smen nomi *</label>
            <input {...register("name", { required: "Nomini kiritish majburiy" })} className="input-field text-xs" placeholder="Masalan: Kunduzgi 12 soat" />
            {errors.name && <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Smen turi *</label>
            <select {...register("type", { required: true })} className="input-field text-xs">
              <option value="DAYTIME">☀️ Kunduzgi</option>
              <option value="NIGHTTIME">🌙 Tungi</option>
              <option value="CUSTOM">⚙️ Maxsus (Moslashuvchan)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Boshlanish vaqti</label>
              <input {...register("startTime", { required: true })} type="time" className="input-field text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tugash vaqti</label>
              <input {...register("endTime", { required: true })} type="time" className="input-field text-xs" />
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5 font-medium">
              ⏱ Davomiyligi: <b className="text-slate-900 dark:text-white text-sm ml-1">{durationH} soat</b>
            </span>
            {isOvernight && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[11px] flex items-center gap-1">
                🌙 Tungi smen
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Kechikish uchun ruxsat (daqiqa)</label>
            <input {...register("graceMinutes", { min: 0, max: 60 })} type="number" min={0} max={60} className="input-field text-xs" placeholder="15" />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/5 p-4 space-y-3 bg-slate-50/50 dark:bg-white/[0.01]">
            <p className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              🍽️ Tushlik vaqti <span className="text-slate-400 font-normal">(ixtiyoriy)</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Boshlanishi</label>
                <input {...register("lunchStart")} type="time" className="input-field text-xs" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Tugashi</label>
                <input {...register("lunchEnd")} type="time" className="input-field text-xs" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 text-xs">Bekor qilish</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 text-xs">
              {mutation.isPending ? "Saqlanmoqda..." : (shift ? "Yangilash" : "Qo'shish")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Shifts List View ────────────────────────────────────────────────────────
function ShiftsView({ targetHospitalId }: { targetHospitalId?: string }) {
  const qc = useQueryClient();
  const [shiftModal, setShiftModal] = useState<{ open: boolean; shift?: any }>({ open: false });
  const [deleteShift, setDeleteShift] = useState<any>(null);
  const params = targetHospitalId ? { targetHospitalId } : undefined;

  const { data: shifts = [], isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["shifts", targetHospitalId],
    queryFn: () => shiftsApi.list(params),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => shiftsApi.delete(id, params),
    onSuccess: () => { setDeleteShift(null); qc.invalidateQueries({ queryKey: ["shifts"] }); toast.success("O'chirildi"); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "O'chirishda xatolik"),
  });

  const seedMut = useMutation({
    mutationFn: () => shiftsApi.seed(params),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shifts"] }); toast.success("Standart smenlar yaratildi"); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  return (
    <>
      <div className="ui-surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">Mavjud smenlar</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tizimdagi ish tartiblari ro&apos;yxati</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              {(shifts as any[]).length}
            </span>
          </div>
          <Button onClick={() => setShiftModal({ open: true })} size="sm">
            <Plus className="w-4 h-4" /> Smen qo&apos;shish
          </Button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-white/[0.03]">
          {isLoading && (
            <StatePanel kind="loading" title="Smenalar yuklanmoqda" className="m-4" />
          )}

          {isError && !isLoading && (
            <StatePanel
              kind="error"
              className="m-4"
              title="Smenalarni yuklab bo‘lmadi"
              description="Internet aloqasini tekshirib, qayta urinib ko‘ring."
              actionLabel="Qayta urinish"
              onAction={() => void refetch()}
              actionLoading={isFetching}
            />
          )}

          {!isError && (shifts as any[]).map((s) => (
            <div key={s.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
              <div className="flex items-center gap-4 min-w-0">
                <div className={cn(
                  "p-3 rounded-xl flex-shrink-0 border",
                  s.type === "DAYTIME" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                )}>
                  {s.type === "DAYTIME" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{s.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                    <span className="font-mono bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded text-[11px] border border-slate-200 dark:border-white/5">{s.startTime} – {s.endTime}</span>
                    <span>•</span>
                    <span>{s.durationH} soat</span>
                    {s.lunchStart && <span className="text-amber-600 dark:text-amber-400">🍽 {s.lunchStart}–{s.lunchEnd}</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={cn(
                  "text-xs px-3 py-1 rounded-full font-semibold border",
                  s.type === "DAYTIME" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                )}>
                  {s.type === "DAYTIME" ? "Kunduzgi" : s.type === "NIGHTTIME" ? "Tungi" : "Maxsus"}
                </span>
                
                <div className="flex items-center gap-1">
                  <Button onClick={() => setShiftModal({ open: true, shift: s })} variant="ghost" size="icon" aria-label={`${s.name} smenasini tahrirlash`}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <button onClick={() => setDeleteShift(s)} className="btn-ghost min-h-10 p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500" aria-label={`${s.name} smenasini o‘chirish`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!isLoading && !isError && (shifts as any[]).length === 0 && (
            <StatePanel
              className="m-4"
              title="Hozircha hech qanday smena yo‘q"
              description="Ish grafiklarini boshlash uchun standart smenalarni yarating."
              icon={Clock}
              actionLabel="Standart smenalarni yaratish"
              onAction={() => seedMut.mutate()}
              actionLoading={seedMut.isPending}
            />
          )}
        </div>
      </div>

      <ShiftModal
        open={shiftModal.open}
        onClose={() => setShiftModal({ open: false })}
        shift={shiftModal.shift}
        targetHospitalId={targetHospitalId}
      />
      <ConfirmDialog
        open={Boolean(deleteShift)}
        onClose={() => setDeleteShift(null)}
        onConfirm={() => deleteShift && deleteMut.mutate(deleteShift.id)}
        title="Smena o‘chirilsinmi?"
        description={`${deleteShift?.name ?? "Tanlangan smena"} boshqa grafiklarda ishlatilgan bo‘lsa, tizim o‘chirishni rad etadi.`}
        confirmLabel="O‘chirish"
        tone="danger"
        loading={deleteMut.isPending}
      />
    </>
  );
}

// ─── Cell Badge Component ────────────────────────────────────────────────     
// Ishlamaydigan kunlar uchun qisqa belgilar
const NON_WORKING_BADGE: Record<string, { mark: string; title: string; cls: string }> = {
  DAY_OFF:  { mark: "○",  title: "Dam olish kuni", cls: "text-slate-400 dark:text-slate-500" },
  VACATION: { mark: "Ta", title: "Ta'til",         cls: "text-teal-600 dark:text-teal-400" },
  SICK:     { mark: "Ka", title: "Kasallik",       cls: "text-pink-600 dark:text-pink-400" },
  HOLIDAY:  { mark: "B",  title: "Bayram",         cls: "text-indigo-600 dark:text-indigo-400" },
  MATERNITY_LEAVE: { mark: "TT", title: "Tug‘ruq ta’tili", cls: "text-fuchsia-600 dark:text-fuchsia-400" },
  TRAINING: { mark: "MO", title: "Malaka oshirish", cls: "text-cyan-600 dark:text-cyan-400" },
  OTHER_ABSENCE: { mark: "B", title: "Boshqa yo‘qlik", cls: "text-orange-600 dark:text-orange-400" },
};

function CellBadge({ sch }: { sch?: any }) {
  if (!sch) return <span className="text-slate-300 dark:text-slate-600 text-xs font-light">—</span>;

  const sourceLock = sch.sourcePlanId ? (
    <span title="Tasdiqlangan post rejasidan" className="absolute -right-1 -top-1 rounded-full bg-indigo-600 p-0.5 text-white shadow-sm">
      <Lock className="h-2 w-2" />
    </span>
  ) : null;

  // Dam olish / ta'til / kasallik / bayram
  const nonWorking = NON_WORKING_BADGE[sch.status as string];
  if (nonWorking) {
    return (
      <span className="relative inline-flex min-h-6 min-w-6 items-center justify-center">
        <span
          className={cn("text-[11px] font-semibold", nonWorking.cls)}
          title={sch.note || nonWorking.title}
        >
          {nonWorking.mark}
        </span>
        {sourceLock}
      </span>
    );
  }

  const type      = sch.shift?.type;
  const startTime = sch.shift?.startTime?.substring(0, 5);
  const endTime   = sch.shift?.endTime?.substring(0, 5);
  // Tungi smen ertangi kunga o'tadimi
  const overnight = sch.shift?.isOvernight === true;

  const label = type === "DAYTIME" ? "K" : type === "NIGHTTIME" ? "Tu" : "✓";
  const shiftName =
    type === "DAYTIME" ? "Kunduzgi smen" : type === "NIGHTTIME" ? "Tungi smen" : "Ish kuni";

  const cls =
    type === "DAYTIME"
      ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
      : type === "NIGHTTIME"
        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";

  return (
    <div
      className={cn(
        "relative inline-flex flex-col items-center justify-center w-full py-1 px-0.5 rounded-xl border group-hover:scale-105 transition-transform",
        cls
      )}
      title={`${shiftName} — ${startTime ?? "?"} dan ${endTime ?? "?"} gacha${overnight ? " (ertangi kun)" : ""}`}
    >
      {sourceLock}
      {/* 1-qator: smen turi */}
      <span className="text-[8px] font-bold leading-none opacity-90">{label}</span>
      {/* 2-qator: kelish vaqti */}
      {startTime && (
        <span className="text-[9px] font-mono font-semibold leading-tight">{startTime}</span>
      )}
      {/* 3-qator: ketish vaqti — Kadr uchun eng muhim qo'shimcha */}
      {endTime && (
        <span className="text-[9px] font-mono leading-tight opacity-70">
          {endTime}{overnight ? <sup className="text-[7px]">+1</sup> : null}
        </span>
      )}
    </div>
  );
}

// ─── Cell Edit Modal ────────────────────────────────────────────────────────
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

  useEffect(() => {
    if (entry) {
      setStatus(entry.status);
      setShiftId(entry.shiftId || "");
    }
  }, [entry]);

  const mutation = useMutation({
    mutationFn: () => schedulesApi.update(entry!.id, { status, shiftId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-schedule-paginated"] });
      toast.success("Grafik yangilandi");
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  if (!entry) return null;

  return (
    <div className="ui-dialog-backdrop">
      <div className="ui-dialog-panel max-w-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Grafikni tahrirlash</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{entry.employeeName} • {dayjs(entry.date).format("DD.MM.YYYY")}</p>
          </div>
          <button onClick={onClose} className="btn-ghost min-h-9 p-2" aria-label="Oynani yopish"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Kunlik holat</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "WORKING", l: "Ish kuni", icon: "💼" },
                { v: "DAY_OFF", l: "Dam olish", icon: "🌴" },
              ].map((s) => (
                <button
                  key={s.v}
                  onClick={() => setStatus(s.v)}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all border",
                    status === s.v
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                      : "border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <span>{s.icon}</span>
                  <span>{s.l}</span>
                </button>
              ))}
            </div>
          </div>

          {status === "WORKING" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Smenni tanlang</label>
              <Select
                value={shiftId}
                onChange={(e) => setShiftId(e.target.value)}
                className="text-xs"
              >
                <option value="">Smen tanlanmagan</option>
                {shifts.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.type === "DAYTIME" ? "Kunduzgi" : "Tungi"})
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={onClose} variant="secondary" className="flex-1 text-xs">Bekor qilish</Button>
            <Button
              onClick={() => mutation.mutate()}
              loading={mutation.isPending}
              className="flex-1 text-xs"
            >
              <Check className="w-3.5 h-3.5" />
              Saqlash
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Import Modal ───────────────────────────────────────────────────────────
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
      toast.success(res?.message || "Import muvaffaqiyatli yakunlandi");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Importda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="ui-dialog-backdrop">
      <div className="ui-dialog-panel max-w-md space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-base">XLSX Import</h2>
          </div>
          <button onClick={onClose} className="btn-ghost min-h-9 p-2" aria-label="Oynani yopish"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 dark:bg-white/[0.02] p-4 text-xs text-slate-700 dark:text-slate-300 space-y-1.5 border border-slate-200 dark:border-white/5">
            <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
              <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Qoidalar:
            </p>
            <p>• <b>A ustun:</b> Xodim F.I.Sh</p>
            <p>• <b>F–J ustunlar:</b> Dushanba–Juma ish soatlari (Masalan: <code className="text-emerald-600 dark:text-emerald-400 font-bold bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">08:00 16:30</code>)</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Oy</label>
              <Select value={importMonth} onChange={(e) => setImportMonth(+e.target.value)} className="text-xs">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{dayjs().month(m - 1).format("MMMM")}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Yil</label>
              <Select value={importYear} onChange={(e) => setImportYear(+e.target.value)} className="text-xs">
                {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Fayl (.xlsx)</label>
            <label className={cn(
              "flex flex-col items-center justify-center gap-2.5 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all",
              file ? "border-emerald-500/40 bg-emerald-500/5" : "border-slate-200 dark:border-white/10 hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-white/[0.02]"
            )}>
              <Upload className={cn("w-6 h-6", file ? "text-emerald-500 dark:text-emerald-400" : "text-slate-400")} />
              <span className="text-xs text-center font-medium text-slate-700 dark:text-slate-300">
                {file ? file.name : "Excel faylini tanlang"}
              </span>
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); }} />
            </label>
          </div>

          {result && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs space-y-1">
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Muvaffaqiyatli import qilindi
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={onClose} variant="secondary" className="flex-1 text-xs">Bekor qilish</Button>
            <Button
              onClick={handleSubmit}
              disabled={!file}
              loading={loading}
              className="flex-1 text-xs"
            >
              <Upload className="w-4 h-4" />
              Import qilish
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────
export default function SchedulesPage() {
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [year, setYear] = useState(dayjs().year());
  const [deptFilter, setDeptFilter] = useState("");
  const [empSearch, setEmpSearch] = useState("");
  const [debouncedEmpSearch, setDebouncedEmpSearch] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState<"all" | "with" | "without">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [generateEmpId, setGenerateEmpId] = useState<string | undefined>(undefined);
  const [editEntry, setEditEntry] = useState<any>(null);
  const [view, setView] = useState<"grafik" | "smenlar" | "postlar">("grafik");
  const [rollingOver, setRollingOver] = useState(false);
  const [rolloverConfirmOpen, setRolloverConfirmOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { selectedHospital, user } = useAuthStore();
  const targetHospitalId = selectedHospital?.id;
  const qc = useQueryClient();

  const { data: planningConfig } = useQuery({
    queryKey: ["schedule-planning-config", targetHospitalId, user?.hospitalId],
    queryFn: () => schedulePlanningApi.config(targetHospitalId ? { targetHospitalId } : undefined),
    enabled: !!targetHospitalId || !!user?.hospitalId,
  });
  const postCoverageEnabled = planningConfig?.postCoverageEnabled === true;

  useEffect(() => {
    if (!postCoverageEnabled && view === "postlar") setView("grafik");
  }, [postCoverageEnabled, view]);

  // Scroll konteyner ref'i Infinite Scroll uchun
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Mobil ko'rinishda keyingi sahifani sahifa scrolli yuklaydi
  // (desktopdagi jadval ichidagi onScroll o'rniga)
  const mobileLoadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDeptFilter("");
    setEmpSearch("");
    setDebouncedEmpSearch("");
    setScheduleFilter("all");
  }, [targetHospitalId]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedEmpSearch(empSearch.trim()),
      300,
    );
    return () => window.clearTimeout(timer);
  }, [empSearch]);

  // 1. O'zgarmaydigan statistika (Cards uchun)
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["schedule-statistics", month, year, targetHospitalId],
    queryFn: () => schedulesApi.statisticsSummary({ month, year, ...(targetHospitalId && { targetHospitalId }) }),
  });

 // 2. Sahifalangan (paginated) oylik grafiklar ro'yxati (Infinite Scroll uchun)
 const {
  data: paginatedData, 
  fetchNextPage, 
  hasNextPage, 
  isFetchingNextPage, 
  isLoading: schedLoading,
  isError: schedError,
  isFetching: schedFetching,
  refetch: refetchSchedules,
} = useInfiniteQuery({
  queryKey: [
    'staff-schedule-paginated',
    month,
    year,
    targetHospitalId,
    deptFilter,
    debouncedEmpSearch,
    scheduleFilter,
  ],
  queryFn: ({ pageParam = 1 }) =>
    schedulesApi.monthlyPaginated({
      page: pageParam,
      limit: 30,
      month,
      year,
      ...(targetHospitalId && { targetHospitalId }),
      ...(deptFilter && { departmentId: deptFilter }),
      ...(debouncedEmpSearch && { search: debouncedEmpSearch }),
      scheduleFilter,
    }),
  initialPageParam: 1,
  getNextPageParam: (lastPage, allPages) => {
    if (lastPage?.meta) {
      return lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined;
    }
    const items = lastPage?.data ?? [];
    if (items.length < 30) {
      return undefined;
    }
    return allPages.length + 1;
  },
});

  // Infinite scroll hodisasini kuzatish
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const el = mobileLoadRef.current;
    if (!el) return;

    // Desktopda bu element display:none — hech qachon "intersecting"
    // bo'lmaydi, shuning uchun faqat mobilda ishlaydi.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Katta monitorda birinchi porsiya jadvalni to'ldirmasa, scroll bo'lmaydi va
  // onScroll hech qachon ishlamaydi — bunday holatda keyingi sahifani o'zimiz so'raymiz.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || el.offsetParent === null) return;
    if (hasNextPage && !isFetchingNextPage && el.scrollHeight <= el.clientHeight + 100) {
      fetchNextPage();
    }
  });

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    
    // 100px qolgandayoq keyingi sahifani fetch qilishni boshlaydi
    const isBottom = scrollHeight - scrollTop - clientHeight <= 100;
  
    if (isBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // ⚡ Bu ro'yxat FAQAT "Grafik yaratish" modalidagi hodim tanlash uchun kerak.
  // Ilgari sahifa ochilishi bilan 1000 tagacha xodim (bo'lim, lavozim, user
  // bilan birga) yuklanardi — jadval bilan bir vaqtda. Endi modal ochilganda
  // yuklanadi va 5 daqiqa keshda turadi.
  const { data: employeesResp } = useQuery({
    queryKey: ["employees-all", targetHospitalId],
    queryFn: () => employeesApi.list({ limit: 1000, ...(targetHospitalId ? { targetHospitalId } : {}) }),
    enabled: modalOpen,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
  const allEmployees: any[] = (employeesResp as any)?.data ?? [];

  const { data: shifts = [] } = useQuery({
    queryKey: ["shifts", targetHospitalId],
    queryFn: () => shiftsApi.list(targetHospitalId ? { targetHospitalId } : undefined),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", targetHospitalId],
    queryFn: () => departmentsApi.list(targetHospitalId ? { targetHospitalId } : undefined),
  });

  // Yuklangan barcha sahifalardagi xodimlar va ularning grafiklarini birlashtiramiz
  const employeesWithSchedules = useMemo(() => {
    if (!paginatedData?.pages) return [];
  
    const list: any[] = [];
    // ⚠️ Ilgari dedupe ISM bo'yicha edi — bir xil F.I.Sh li ikkinchi xodim
    //    jadvaldan butunlay tushib qolardi (349 xodimda bu real ehtimol).
    //    Endi ID bo'yicha: ID unikal, ism esa yo'q.
    const seenIds = new Set<string>();

    for (const page of paginatedData.pages) {
      const items = page?.data ?? [];

      if (Array.isArray(items)) {
        for (const item of items) {
          const id = item?.id ?? item?.employee?.id;
          if (!id) { list.push(item); continue; }
          if (seenIds.has(id)) continue;
          seenIds.add(id);
          list.push(item);
        }
      }
    }
    return list;
  }, [paginatedData]);

  // Grafik kataklarini tezkor topish uchun Map tuzish
  const scheduleMap = useMemo(() => {
    const map = new Map<string, Map<string, any>>();
    for (const emp of employeesWithSchedules) {
      if (!map.has(emp.id)) map.set(emp.id, new Map());
      if (emp.schedules) {
        for (const s of emp.schedules) {
          // ⚡ toDateKey — oyda atigi ~31 xil sana bo'lgani uchun keshlanadi.
          // Ilgari har bir yozuv uchun dayjs() chaqirilardi (~10 000 marta).
          const dateKey = toDateKey(s.date);
          map.get(emp.id)!.set(dateKey, s);
        }
      }
    }
    return map;
  }, [employeesWithSchedules]);

  // Filtrlar backendda barcha xodimlarga paginationdan OLDIN qo'llanadi.
  // Shu sabab `employeesWithSchedules` allaqachon to'g'ri natija hisoblanadi.
  const employees = employeesWithSchedules;

  // Jadval yuklanishi faqat grafik so'roviga bog'liq.
  // Hodimlar ro'yxati modal uchun alohida yuklanadi — u jadvalni bloklamasligi kerak.
  const isLoading = schedLoading;
  const daysInMonth = dayjs(`${year}-${String(month).padStart(2, "0")}-01`).daysInMonth();

  // ⚡ Kun ustunlari metadatasi — oyiga BIR MARTA hisoblanadi.
  //
  // Ilgari har bir katak o'z ichida `dayjs(dateStr)` va `dayjs()` yaratardi:
  //   349 xodim × 31 kun × 2 = ~21 000 ta dayjs obyekti HAR RENDER da.
  //   Endi 31 ta. Jadval "osilib qolishi"ning asosiy sababi shu edi.
  const dayCells = useMemo(() => {
    const todayStr = dayjs().format("YYYY-MM-DD");
    const mm = String(month).padStart(2, "0");
    return Array.from({ length: daysInMonth }, (_, i) => {
      const dateStr = `${year}-${mm}-${String(i + 1).padStart(2, "0")}`;
      const d = dayjs(dateStr);
      const dow = d.day();
      return {
        day: i + 1,
        dateStr,
        dowLabel: d.format("dd"),
        isWeekend: dow === 0 || dow === 6,
        isToday: dateStr === todayStr,
      };
    });
  }, [year, month, daysInMonth]);

  const navMonth = (dir: number) => {
    const next = dayjs(`${year}-${String(month).padStart(2, "0")}-01`).add(dir, "month");
    setMonth(next.month() + 1);
    setYear(next.year());
  };

  const handleRollover = async () => {
    const cur = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
    const prev = cur.subtract(1, "month");

    setRollingOver(true);
    const tid = toast.loading("Grafiklar ko'chirilmoqda...");
    try {
      const params = targetHospitalId ? { targetHospitalId } : undefined;
      const res = await schedulesApi.rollover({ fromMonth: prev.month() + 1, fromYear: prev.year(), toMonth: month, toYear: year }, params);
      toast.success(res?.message || "Grafiklar muvaffaqiyatli ko'chirildi", { id: tid });
      qc.invalidateQueries({ queryKey: ["staff-schedule-paginated"] });
      qc.invalidateQueries({ queryKey: ["schedule-statistics"] });
      setRolloverConfirmOpen(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Ko'chirishda xatolik", { id: tid });
    } finally {
      setRollingOver(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pb-12 text-[var(--text-primary)]">
      <Topbar title="Ish Grafigi" subtitle="Xodimlarning oylik smena jadvallarini boshqarish" />

      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1700px] mx-auto">
        
        {/* Navigation & Controls Header */}
        <Surface className="flex flex-col justify-between gap-4 p-4 xl:flex-row xl:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-1">
              <Button
                onClick={() => setView("grafik")}
                variant={view === "grafik" ? "primary" : "ghost"}
                size="sm"
              >
                  <Calendar className="w-3.5 h-3.5" /> Asosiy grafik
              </Button>
              <Button
                onClick={() => setView("smenlar")}
                variant={view === "smenlar" ? "primary" : "ghost"}
                size="sm"
              >
                <Clock className="w-3.5 h-3.5" /> Smenlar
              </Button>
              {postCoverageEnabled && (
                <Button
                  onClick={() => setView("postlar")}
                  variant={view === "postlar" ? "primary" : "ghost"}
                  size="sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Post reja
                </Button>
              )}
            </div>

            {(view === "grafik" || view === "postlar") && (
              <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-1 shadow-sm">
                <Button onClick={() => navMonth(-1)} variant="ghost" size="icon" className="h-8 w-8" aria-label="Oldingi oy">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="min-w-[120px] px-3 text-center text-xs font-bold text-[var(--text-primary)]">
                  {dayjs(`${year}-${String(month).padStart(2, "0")}-01`).format("MMMM YYYY")}
                </span>
                <Button onClick={() => navMonth(1)} variant="ghost" size="icon" className="h-8 w-8" aria-label="Keyingi oy">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {(month !== dayjs().month() + 1 || year !== dayjs().year()) && (view === "grafik" || view === "postlar") && (
              <Button onClick={() => { setMonth(dayjs().month() + 1); setYear(dayjs().year()); }} variant="secondary" size="sm">
                Joriy oy
              </Button>
            )}
          </div>

          {view === "grafik" && (
            <div className="flex flex-wrap items-center gap-2.5">
              <Select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="h-9 min-w-[160px] w-auto text-xs"
              >
                <option value="">Barcha bo&apos;limlar</option>
                {(departments as any[]).map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>

              <Button onClick={() => setRolloverConfirmOpen(true)} loading={rollingOver} variant="secondary" size="sm">
                <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline">Nusxa olish</span>
              </Button>

              <Button onClick={() => setImportOpen(true)} variant="secondary" size="sm">
                <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline">Import</span>
              </Button>

              <Button onClick={() => { setGenerateEmpId(undefined); setModalOpen(true); }} size="sm">
                <Sparkles className="w-3.5 h-3.5" /> Grafik yaratish
              </Button>
            </div>
          )}
        </Surface>

        {/* Stats Cards (Scroll qilinganda o'zgarmaydigan umumiy statistika) */}
        {view === "grafik" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="ui-surface flex items-center gap-3.5 p-4">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Jami Xodimlar</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {statsLoading ? "..." : (statsData?.totalEmployees ?? 0)}
                </p>
              </div>
            </div>

            <div className="ui-surface flex items-center gap-3.5 p-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Grafikli</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {statsLoading ? "..." : (statsData?.withSchedule ?? 0)}
                </p>
              </div>
            </div>

            <div className="ui-surface flex items-center gap-3.5 p-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Grafiksiz</p>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  {statsLoading ? "..." : (statsData?.withoutSchedule ?? 0)}
                </p>
              </div>
            </div>

            <div className="ui-surface flex items-center gap-3.5 p-4">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Kunduzgi / Tungi</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {statsLoading ? "..." : `${statsData?.daytime ?? 0} / ${statsData?.nighttime ?? 0}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        {view === "grafik" && (
          <Surface className="flex flex-col items-center justify-between gap-3 p-3.5 sm:flex-row">
            <div className="relative w-full sm:w-80">
              {!empSearch && (
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              )}
              <Input
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                placeholder="Xodim ismini izlash..."
                className="h-9 pr-10 text-xs"
              />
              {empSearch && (
                <button 
                  onClick={() => setEmpSearch("")} 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1 rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              {([
                { v: "all", l: "Barchasi" },
                { v: "with", l: "Grafikli" },
                { v: "without", l: "Grafiksiz" },
              ] as const).map((f) => (
                <Button
                  key={f.v}
                  onClick={() => setScheduleFilter(f.v)}
                  variant={scheduleFilter === f.v ? "primary" : "secondary"}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {f.l}
                </Button>
              ))}
            </div>
          </Surface>
        )}

        {/* Smenlar ko'rinishi */}
        {view === "smenlar" && <ShiftsView targetHospitalId={targetHospitalId} />}

        {view === "postlar" && postCoverageEnabled && (
          <PostSchedulePlanner
            targetHospitalId={targetHospitalId}
            month={month}
            year={year}
            departments={departments as any[]}
            shifts={shifts as any[]}
            userRole={user?.role}
          />
        )}

        {/* Main Grid Calendar with Infinite Scroll */}
        {view === "grafik" && schedError && (
          <StatePanel
            kind="error"
            title="Oylik grafikni yuklab bo‘lmadi"
            description="Saqlangan ma’lumot o‘zgarmadi. Aloqani tekshirib, qayta urinib ko‘ring."
            actionLabel="Qayta urinish"
            onAction={() => void refetchSchedules()}
            actionLoading={schedFetching}
          />
        )}

        {view === "grafik" && !schedError && (
          <div className="ui-table-shell">
            {/* Jadval — faqat sm: dan yuqorida. 220px ism ustuni + 31x46px kun
                ustunlari ≈ 1650px kenglik; mobilda ishlatib bo'lmaydi,
                shuning uchun pastda kartochka ko'rinishi bor. */}
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="hidden sm:block overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] relative"
            >
              <table className="w-full border-collapse text-xs table-fixed">
                <thead className="ui-table-head sticky top-0 z-30 border-b border-[var(--border)] shadow-lg">
                  <tr>
                    <th className="ui-table-head sticky left-0 z-40 w-[220px] min-w-[220px] border-r border-[var(--border)] px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider shadow-[4px_0_12px_-2px_rgba(0,0,0,0.18)]">
                      Xodimlarning F.I.Sh
                    </th>
                    {dayCells.map((c) => (
                      <th
                        key={c.dateStr}
                        className={cn(
                          "text-center py-2.5 px-1 w-[46px] min-w-[46px] border-r border-[var(--border)] font-medium transition-colors",
                          c.isWeekend ? "bg-rose-500/5 text-rose-500 dark:text-rose-400" : "text-[var(--text-muted)]",
                          c.isToday && "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold"
                        )}
                      >
                        <div className="text-xs font-bold">{c.day}</div>
                        <div className="text-[9px] uppercase tracking-tighter opacity-70">{c.dowLabel}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                  {isLoading &&
                    [...Array(8)].map((_, i) => (
                      <tr key={i}>
                        <td className="sticky left-0 z-20 border-r border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
                          <div className="h-4 w-32 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                        </td>
                        {[...Array(daysInMonth)].map((_, j) => (
                          <td key={j} className="border-r border-[var(--border)] p-2">
                            <div className="h-7 w-full bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))}

                  {!isLoading && employees.length === 0 && (
                    <tr>
                      <td colSpan={daysInMonth + 1} className="text-center py-16 text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Users className="w-8 h-8 opacity-30" />
                          <p className="text-sm font-medium">Xodimlar topilmadi</p>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!isLoading &&
                    employees.map((emp: any) => {
                      const empSchedules = scheduleMap.get(emp.id);
                      const hasProtectedPostSchedules = empSchedules
                        ? Array.from(empSchedules.values()).some((schedule: any) => Boolean(schedule.sourcePlanId))
                        : false;
                      return (
                        <tr key={emp.id} className="table-row-hover group">
                          {/* Left Sticky Column */}
                          <td className="sticky left-0 z-20 border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 shadow-[4px_0_12px_-2px_rgba(0,0,0,0.18)] transition-colors group-hover:bg-[var(--bg-hover)]">
                            <div
                              className="cursor-pointer group/item"
                              onClick={() => {
                                if (hasProtectedPostSchedules) {
                                  toast.info("Bu xodimda tasdiqlangan post rejasi mavjud. O‘zgarishni Post reja orqali kiriting.");
                                  return;
                                }
                                setGenerateEmpId(emp.id);
                                setModalOpen(true);
                              }}
                            >
                              <p className="font-semibold text-slate-900 dark:text-white truncate max-w-[190px] group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors">
                                {emp.fullName}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{emp.department?.name || "Bo'limsiz"}</p>
                            </div>
                          </td>

                          {/* Calendar Cells */}
                          {/* ⚡ Oldindan hisoblangan dayCells — katak ichida dayjs chaqirilmaydi */}
                          {dayCells.map((c) => {
                            const sch = empSchedules?.get(c.dateStr);

                            return (
                              <td
                                key={c.dateStr}
                                className={cn(
                                  "text-center p-1 border-r border-[var(--border)] relative transition-all",
                                  c.isWeekend && "bg-slate-50/50 dark:bg-white/[0.01]",
                                  c.isToday && "bg-indigo-500/5",
                                  sch && !sch.sourcePlanId && "cursor-pointer hover:bg-slate-100 dark:hover:bg-white/[0.04]",
                                  sch?.sourcePlanId && "cursor-not-allowed bg-indigo-500/[0.03]"
                                )}
                                onClick={() => {
                                  if (!sch) return;
                                  if (sch.sourcePlanId) {
                                    toast.info("Bu kun tasdiqlangan post rejasidan kelgan. O‘zgarishni Post reja orqali kiriting.");
                                    return;
                                  }
                                  setEditEntry({
                                    id: sch.id,
                                    status: sch.status,
                                    shiftId: sch.shiftId,
                                    employeeName: emp.fullName,
                                    date: c.dateStr,
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

              {/* Infinite Scroll Loading Indicator */}
              {isFetchingNextPage && (
                <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2 bg-slate-50/50 dark:bg-white/[0.01]">
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  Keyingi xodimlar yuklanmoqda...
                </div>
              )}
            </div>

            {/* ── Mobil ko'rinish: har xodim uchun kartochka ──
                Kun tasmasi gorizontal scroll bo'ladi, sahifa esa vertikal.
                Ism ustiga bosilsa grafik yaratish, kun ustiga bosilsa
                o'sha kunni tahrirlash oynasi ochiladi. */}
            <div className="divide-y divide-[var(--border)] sm:hidden">
              {isLoading && [...Array(4)].map((_, i) => (
                <div key={i} className="p-4 space-y-2">
                  <div className="h-4 w-40 rounded bg-slate-100 dark:bg-white/5 animate-pulse" />
                  <div className="h-10 w-full rounded bg-slate-100 dark:bg-white/5 animate-pulse" />
                </div>
              ))}

              {!isLoading && employees.length === 0 && (
                <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                  Xodimlar topilmadi
                </div>
              )}

              {!isLoading && employees.map((emp: any) => {
                const empSchedules = scheduleMap.get(emp.id);
                const hasProtectedPostSchedules = empSchedules
                  ? Array.from(empSchedules.values()).some((schedule: any) => Boolean(schedule.sourcePlanId))
                  : false;
                let ish = 0, dam = 0;
                if (empSchedules) {
                  // Array.from — tsconfig target ES5 bo'lgani uchun
                  // Map iteratorini to'g'ridan-to'g'ri aylantirib bo'lmaydi
                  Array.from(empSchedules.values()).forEach((sch: any) => {
                    if (sch.status === "WORKING") ish++;
                    else dam++;
                  });
                }

                return (
                  <div key={emp.id} className="py-3">
                    {/* Xodim sarlavhasi */}
                    <div
                      className="flex items-center justify-between gap-2 px-4 mb-2 cursor-pointer"
                      onClick={() => {
                        if (hasProtectedPostSchedules) {
                          toast.info("Bu xodimda tasdiqlangan post rejasi mavjud. O‘zgarishni Post reja orqali kiriting.");
                          return;
                        }
                        setGenerateEmpId(emp.id);
                        setModalOpen(true);
                      }}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                          {emp.fullName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {emp.department?.name || "Bo'limsiz"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                          Ish {ish}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
                          Dam {dam}
                        </span>
                        <Edit3 className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      </div>
                    </div>

                    {/* Kun tasmasi — gorizontal scroll */}
                    <div className="flex gap-1 overflow-x-auto px-4 pb-1 scrollbar-none">
                      {dayCells.map((c) => {
                        const sch = empSchedules?.get(c.dateStr);
                        return (
                          <button
                            key={c.dateStr}
                            type="button"
                            onClick={() => {
                              if (!sch) return;
                              if (sch.sourcePlanId) {
                                toast.info("Bu kun tasdiqlangan post rejasidan kelgan. O‘zgarishni Post reja orqali kiriting.");
                                return;
                              }
                              setEditEntry({
                                id: sch.id,
                                status: sch.status,
                                shiftId: sch.shiftId,
                                employeeName: emp.fullName,
                                date: c.dateStr,
                              });
                            }}
                            className={cn(
                              "flex-shrink-0 w-[46px] rounded-lg border p-1 text-center transition-colors",
                              c.isToday
                                ? "border-indigo-500/60 bg-indigo-500/10"
                                : c.isWeekend
                                  ? "border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]"
                                  : "border-slate-200 dark:border-white/5",
                              sch && !sch.sourcePlanId && "active:bg-slate-100 dark:active:bg-white/5",
                              sch?.sourcePlanId && "cursor-not-allowed bg-indigo-500/[0.03]"
                            )}
                          >
                            <span className={cn(
                              "block text-[10px] font-bold leading-none mb-1",
                              c.isToday
                                ? "text-indigo-600 dark:text-indigo-400"
                                : c.isWeekend
                                  ? "text-rose-500 dark:text-rose-400"
                                  : "text-slate-500 dark:text-slate-400"
                            )}>
                              {c.day}
                            </span>
                            <CellBadge sch={sch} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Mobil sentinel — keyingi xodimlar sahifa scrolli bilan yuklanadi */}
              {!isLoading && hasNextPage && (
                <div ref={mobileLoadRef} className="py-4 text-center text-xs text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                    Keyingi xodimlar yuklanmoqda...
                  </span>
                </div>
              )}
            </div>


            {/* Table Footer / Legend */}
            <div className="flex flex-wrap items-center gap-6 border-t border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-3.5 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-2 font-medium">
                <span className="bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold px-2 py-0.5 rounded-lg border border-sky-500/20 text-[10px]">K</span> Kunduzgi smen
              </span>
              <span className="flex items-center gap-2 font-medium">
                <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold px-2 py-0.5 rounded-lg border border-purple-500/20 text-[10px]">Tu</span> Tungi smen
              </span>
              <span className="flex items-center gap-2 font-medium">
                <span className="inline-flex flex-col items-center leading-none font-mono text-[9px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">08:00</span>
                  <span className="opacity-70">20:00</span>
                </span>
                Kelish / ketish vaqti
              </span>
              <span className="flex items-center gap-2 font-medium">
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">+1</span> Ertangi kunga o&apos;tadi
              </span>
              <span className="flex items-center gap-2 font-medium">
                <span className="font-bold text-slate-400 dark:text-slate-500">○</span> Dam olish
              </span>
              <span className="flex items-center gap-2 font-medium">
                <span className="font-bold text-teal-600 dark:text-teal-400 text-[10px]">Ta</span> Ta&apos;til
              </span>
              <span className="flex items-center gap-2 font-medium">
                <span className="font-bold text-pink-600 dark:text-pink-400 text-[10px]">Ka</span> Kasallik
              </span>
              <span className="flex items-center gap-2 font-medium text-indigo-600 dark:text-indigo-400">
                <span className="rounded-full bg-indigo-600 p-1 text-white"><Lock className="h-2.5 w-2.5" /></span> Post rejasidan — shu yerda tahrirlanmaydi
              </span>
              <span className="flex items-center gap-1.5 ml-auto text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                <Edit3 className="w-3.5 h-3.5" /> Oddiy katak ustiga bosib grafikni o&apos;zgartiring
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Modals */}
      <GenerateModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setGenerateEmpId(undefined); }}
        employees={allEmployees}
        shifts={shifts}
        departments={departments}
        targetHospitalId={targetHospitalId}
        preEmployeeId={generateEmpId}
        onMonthChange={(m, y) => {
          setMonth(m);
          setYear(y);
          qc.invalidateQueries({ queryKey: ["staff-schedule-paginated"] });
          qc.invalidateQueries({ queryKey: ["schedule-statistics"] });
        }}
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
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["staff-schedule-paginated"] });
          qc.invalidateQueries({ queryKey: ["schedule-statistics"] });
        }}
      />
      <ConfirmDialog
        open={rolloverConfirmOpen}
        onClose={() => setRolloverConfirmOpen(false)}
        onConfirm={handleRollover}
        title="Oldingi oy grafigi nusxalansinmi?"
        description={`${dayjs(`${year}-${String(month).padStart(2, "0")}-01`).subtract(1, "month").format("MMMM YYYY")} grafigi ${dayjs(`${year}-${String(month).padStart(2, "0")}-01`).format("MMMM YYYY")} oyiga ko‘chiriladi.`}
        confirmLabel="Nusxa olish"
        loading={rollingOver}
      />
    </div>
  );
}
