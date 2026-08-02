"use client";

import { GenerateModal } from "@/components/schedules/GenerateModal";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { schedulesApi, employeesApi, shiftsApi, departmentsApi, api } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import { 
  ChevronLeft, ChevronRight, Zap, X, Edit3, Check, Clock, Sun, Moon, 
  Plus, Edit2, Trash2, Search, Copy, Upload, FileSpreadsheet,
  Calendar, Users, UserCheck, UserX, Sparkles, AlertCircle
} from "lucide-react";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import { useAuthStore } from "@/stores/auth";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/5 p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
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
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Smen nomi *</label>
            <input {...register("name", { required: "Nomini kiritish majburiy" })} className="w-full rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all" placeholder="Masalan: Kunduzgi 12 soat" />
            {errors.name && <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Smen turi *</label>
            <select {...register("type", { required: true })} className="w-full rounded-xl bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all">
              <option value="DAYTIME">☀️ Kunduzgi</option>
              <option value="NIGHTTIME">🌙 Tungi</option>
              <option value="CUSTOM">⚙️ Maxsus (Moslashuvchan)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Boshlanish vaqti</label>
              <input {...register("startTime", { required: true })} type="time" className="w-full rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tugash vaqti</label>
              <input {...register("endTime", { required: true })} type="time" className="w-full rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all" />
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
            <input {...register("graceMinutes", { min: 0, max: 60 })} type="number" min={0} max={60} className="w-full rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all" placeholder="15" />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/5 p-4 space-y-3 bg-slate-50/50 dark:bg-white/[0.01]">
            <p className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              🍽️ Tushlik vaqti <span className="text-slate-400 font-normal">(ixtiyoriy)</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Boshlanishi</label>
                <input {...register("lunchStart")} type="time" className="w-full rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Tugashi</label>
                <input {...register("lunchEnd")} type="time" className="w-full rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 transition-all">Bekor qilish</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all">
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
      <div className="bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/5 shadow-xl rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0e1017]">
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
          <button onClick={() => setShiftModal({ open: true })} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" /> Smen qo&apos;shish
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-white/[0.03]">
          {isLoading && (
            <div className="px-4 py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              Smenlar yuklanmoqda...
            </div>
          )}

          {(shifts as any[]).map((s) => (
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
                  <button onClick={() => setShiftModal({ open: true, shift: s })} className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => confirm("Smenni o'chirishni tasdiqlaysizmi?") && deleteMut.mutate(s.id)} className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!isLoading && (shifts as any[]).length === 0 && (
            <div className="px-4 py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-400 border border-slate-200 dark:border-white/5">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Hozircha hech qanday smen yo&apos;q</p>
              <button onClick={() => seedMut.mutate()} disabled={seedMut.isPending} className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all mx-auto flex items-center gap-2">
                <Zap className="w-4 h-4" />
                {seedMut.isPending ? "Yaratilmoqda..." : "Standart smenlarni yaratish"}
              </button>
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

// ─── Cell Badge Component ────────────────────────────────────────────────     
function CellBadge({ sch }: { sch?: any }) {
  if (!sch) return <span className="text-slate-300 dark:text-slate-600 text-xs font-light">—</span>;
  if (sch.status === "DAY_OFF") return <span className="text-slate-400 dark:text-slate-500 text-[11px] font-semibold">○</span>;
  
  const type = sch.shift?.type;
  const startTime = sch.shift?.startTime?.substring(0, 5);

  if (type === "DAYTIME") return (
    <div className="inline-flex flex-col items-center justify-center w-full py-1 px-0.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 group-hover:scale-105 transition-transform" title={`Kunduzgi smen (${sch.shift?.startTime} - ${sch.shift?.endTime})`}>
      <span className="font-bold text-[10px] leading-tight">K</span>
      {startTime && <span className="text-[9px] font-mono opacity-80 leading-none">{startTime}</span>}
    </div>
  );
  
  if (type === "NIGHTTIME") return (
    <div className="inline-flex flex-col items-center justify-center w-full py-1 px-0.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 group-hover:scale-105 transition-transform" title={`Tungi smen (${sch.shift?.startTime} - ${sch.shift?.endTime})`}>
      <span className="font-bold text-[10px] leading-tight">Tu</span>
      {startTime && <span className="text-[9px] font-mono opacity-80 leading-none">{startTime}</span>}
    </div>
  );

  return (
    <div className="inline-flex flex-col items-center justify-center w-full py-1 px-0.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
      <span className="font-bold text-[10px] leading-tight">✓</span>
      {startTime && <span className="text-[9px] font-mono opacity-80 leading-none">{startTime}</span>}
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
      qc.invalidateQueries({ queryKey: ["schedules-monthly-paginated"] });
      toast.success("Grafik yangilandi");
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  if (!entry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/5 p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Grafikni tahrirlash</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{entry.employeeName} • {dayjs(entry.date).format("DD.MM.YYYY")}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"><X className="w-4 h-4" /></button>
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
              <select
                value={shiftId}
                onChange={(e) => setShiftId(e.target.value)}
                className="w-full rounded-xl bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value="">Smen tanlanmagan</option>
                {shifts.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.type === "DAYTIME" ? "Kunduzgi" : "Tungi"})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 transition-all">Bekor qilish</button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              {mutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/5 p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-base">XLSX Import</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"><X className="w-4 h-4" /></button>
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
              <select value={importMonth} onChange={(e) => setImportMonth(+e.target.value)} className="w-full rounded-xl bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{dayjs().month(m - 1).format("MMMM")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Yil</label>
              <select value={importYear} onChange={(e) => setImportYear(+e.target.value)} className="w-full rounded-xl bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all">
                {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
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
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 transition-all">Bekor qilish</button>
            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {loading ? "Yuklanmoqda..." : "Import qilish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Normalizer ─────────────────────────────────────────────────────────────
function normalizeStr(str: string): string {
  const cyr: Record<string, string> = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'j','з':'z',
    'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
    'с':'s','т':'t','у':'u','ф':'f','х':'x','ц':'c','ч':'ch','ш':'sh',
    'ъ':"'",'ь':"'",'э':'e','ю':'yu','я':'ya', 'ғ':'g','қ':'q','ҳ':'h','ў':'o',
  };
  return str.toLowerCase().split('').map(c => cyr[c] || c).join('');
}

// ─── Main Page Component ──────────────────────────────────────────────────
export default function SchedulesPage() {
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [year, setYear] = useState(dayjs().year());
  const [deptFilter, setDeptFilter] = useState("");
  const [empSearch, setEmpSearch] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState<"all" | "with" | "without">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [generateEmpId, setGenerateEmpId] = useState<string | undefined>(undefined);
  const [editEntry, setEditEntry] = useState<any>(null);
  const [view, setView] = useState<"grafik" | "smenlar">("grafik");
  const [rollingOver, setRollingOver] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { selectedHospital } = useAuthStore();
  const targetHospitalId = selectedHospital?.id;
  const qc = useQueryClient();

  // Scroll konteyner ref'i Infinite Scroll uchun
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDeptFilter("");
    setEmpSearch("");
    setScheduleFilter("all");
  }, [targetHospitalId]);

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
  isLoading: schedLoading 
} = useInfiniteQuery({
  queryKey: ['staff-schedule-paginated', month, year, targetHospitalId],
  queryFn: async ({ pageParam = 1 }) => {
    const res = await api.get(`/schedules/monthly-paginated`, {
      params: {
        page: pageParam,
        limit: 30,
        month: month, // 👈 Sizdagi state nomi
        year: year,   // 👈 Sizdagi state nomi
        targetHospitalId: targetHospitalId,
      },
    });
    return res.data;
  },
  initialPageParam: 1,
  getNextPageParam: (lastPage, allPages) => {
    const items = Array.isArray(lastPage) ? lastPage : (lastPage?.data ?? lastPage?.items ?? []);
    if (items.length < 30) {
      return undefined;
    }
    return allPages.length + 1;
  },
});

  // Infinite scroll hodisasini kuzatish
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    
    // 100px qolgandayoq keyingi sahifani fetch qilishni boshlaydi
    const isBottom = scrollHeight - scrollTop - clientHeight <= 100;
  
    if (isBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const { data: employeesResp, isLoading: empLoading } = useQuery({
    queryKey: ["employees-all", targetHospitalId],
    queryFn: () => employeesApi.list({ limit: 1000, ...(targetHospitalId ? { targetHospitalId } : {}) }),
    staleTime: 30_000,
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
    const seenNames = new Set(); // Ismlar bo'yicha tekshiramiz
  
    for (const page of paginatedData.pages) {
      const items = Array.isArray(page) ? page : (page?.data ?? page?.items ?? page?.result ?? []);
  
      if (Array.isArray(items)) {
        for (const item of items) {
          // Xodimning to'liq ismi (fullName yoki name)
          const fullName = (item.fullName || item.name || item.employee?.fullName || "").trim().toLowerCase();
          
          if (fullName) {
            if (!seenNames.has(fullName)) {
              seenNames.add(fullName);
              list.push(item);
            }
          } else {
            list.push(item);
          }
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
          const dateKey = dayjs(s.date).format("YYYY-MM-DD");
          map.get(emp.id)!.set(dateKey, s);
        }
      }
    }
    return map;
  }, [employeesWithSchedules]);

  // Frontend filtrlash (Bo'lim, Qidiruv, Grafik mavjudligi bo'yicha)
  const employees = useMemo(() => {
    let list = deptFilter
      ? employeesWithSchedules.filter((e) => e.department?.id === deptFilter || e.departmentId === deptFilter)
      : [...employeesWithSchedules];

    if (scheduleFilter === "with") {
      list = list.filter((e) => {
        const empSch = scheduleMap.get(e.id);
        if (!empSch) return false;
        return Array.from(empSch.values()).some((s: any) => s.status === "WORKING");
      });
    } else if (scheduleFilter === "without") {
      list = list.filter((e) => {
        const empSch = scheduleMap.get(e.id);
        if (!empSch) return true;
        return !Array.from(empSch.values()).some((s: any) => s.status === "WORKING");
      });
    }

    if (empSearch.trim()) {
      const q = normalizeStr(empSearch.trim());
      list = list.filter((e) => normalizeStr(e.fullName).includes(q));
    }
    return list;
  }, [employeesWithSchedules, deptFilter, scheduleFilter, empSearch, scheduleMap]);

  const isLoading = schedLoading || empLoading;
  const daysInMonth = dayjs(`${year}-${String(month).padStart(2, "0")}-01`).daysInMonth();

  const navMonth = (dir: number) => {
    const next = dayjs(`${year}-${String(month).padStart(2, "0")}-01`).add(dir, "month");
    setMonth(next.month() + 1);
    setYear(next.year());
  };

  const handleRollover = async () => {
    const cur = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
    const prev = cur.subtract(1, "month");
    if (!window.confirm(`${prev.format("MMMM YYYY")} oyidagi grafiklarni ${cur.format("MMMM YYYY")} oyiga ko'chirasizmi?`)) return;

    setRollingOver(true);
    const tid = toast.loading("Grafiklar ko'chirilmoqda...");
    try {
      const params = targetHospitalId ? { targetHospitalId } : undefined;
      const res = await schedulesApi.rollover({ fromMonth: prev.month() + 1, fromYear: prev.year(), toMonth: month, toYear: year }, params);
      toast.success(res?.message || "Grafiklar muvaffaqiyatli ko'chirildi", { id: tid });
      qc.invalidateQueries({ queryKey: ["schedules-monthly-paginated"] });
      qc.invalidateQueries({ queryKey: ["schedule-statistics"] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Ko'chirishda xatolik", { id: tid });
    } finally {
      setRollingOver(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d14] text-slate-900 dark:text-slate-100 pb-12">
      <Topbar title="Ish Grafigi" subtitle="Xodimlarning oylik smena jadvallarini boshqarish" />

      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1700px] mx-auto">
        
        {/* Navigation & Controls Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center p-1 bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl">
              <button
                onClick={() => setView("grafik")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2",
                  view === "grafik" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5"
                )}
              >
                <Calendar className="w-3.5 h-3.5" /> Grafik
              </button>
              <button
                onClick={() => setView("smenlar")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2",
                  view === "smenlar" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5"
                )}
              >
                <Clock className="w-3.5 h-3.5" /> Smenlar
              </button>
            </div>

            {view === "grafik" && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-1 shadow-sm">
                <button onClick={() => navMonth(-1)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-xs font-bold text-slate-900 dark:text-white min-w-[120px] text-center">
                  {dayjs(`${year}-${String(month).padStart(2, "0")}-01`).format("MMMM YYYY")}
                </span>
                <button onClick={() => navMonth(1)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {(month !== dayjs().month() + 1 || year !== dayjs().year()) && view === "grafik" && (
              <button onClick={() => { setMonth(dayjs().month() + 1); setYear(dayjs().year()); }} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5 text-xs font-semibold transition-all">
                Joriy oy
              </button>
            )}
          </div>

          {view === "grafik" && (
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="rounded-xl bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-white/10 px-3.5 h-9 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all min-w-[160px]"
              >
                <option value="">Barcha bo&apos;limlar</option>
                {(departments as any[]).map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              <button onClick={handleRollover} disabled={rollingOver} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5 text-xs font-semibold transition-all flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline">Nusxa olish</span>
              </button>

              <button onClick={() => setImportOpen(true)} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5 text-xs font-semibold transition-all flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline">Import</span>
              </button>

              <button onClick={() => { setGenerateEmpId(undefined); setModalOpen(true); }} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> Grafik yaratish
              </button>
            </div>
          )}
        </div>

        {/* Stats Cards (Scroll qilinganda o'zgarmaydigan umumiy statistika) */}
        {view === "grafik" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3.5 shadow-xl">
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

            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3.5 shadow-xl">
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

            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3.5 shadow-xl">
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

            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3.5 shadow-xl">
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-xl">
            <div className="relative w-full sm:w-80">
              {!empSearch && (
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              )}
              <input
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                placeholder="Xodim ismini izlash..."
                className="w-full rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 px-3.5 h-9 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
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
                <button
                  key={f.v}
                  onClick={() => setScheduleFilter(f.v)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border",
                    scheduleFilter === f.v
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  {f.l}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Smenlar ko'rinishi */}
        {view === "smenlar" && <ShiftsView targetHospitalId={targetHospitalId} />}

        {/* Main Grid Calendar with Infinite Scroll */}
        {view === "grafik" && (
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] relative"
            >
              <table className="w-full border-collapse text-xs table-fixed">
                <thead className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xl">
                  <tr>
                    <th className="sticky left-0 z-40 bg-white dark:bg-slate-900 text-left px-4 py-3.5 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider w-[220px] min-w-[220px] border-r border-slate-200 dark:border-slate-800 shadow-[4px_0_12px_-2px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-2px_rgba(0,0,0,0.5)]">
                      Xodimlarning F.I.Sh
                    </th>
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const d = dayjs(`${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`);
                      const isWeekend = d.day() === 0 || d.day() === 6;
                      const isToday = d.isSame(dayjs(), "day");
                      return (
                        <th
                          key={i}
                          className={cn(
                            "text-center py-2.5 px-1 w-[46px] min-w-[46px] border-r border-slate-200 dark:border-white/5 font-medium transition-colors",
                            isWeekend ? "bg-slate-50 dark:bg-white/[0.02] text-rose-500 dark:text-rose-400" : "text-slate-500 dark:text-slate-400",
                            isToday && "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold"
                          )}
                        >
                          <div className="text-xs font-bold">{i + 1}</div>
                          <div className="text-[9px] uppercase tracking-tighter opacity-70">{d.format("dd")}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                  {isLoading &&
                    [...Array(8)].map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 sticky left-0 bg-white dark:bg-[#12141c] z-20 border-r border-slate-200 dark:border-white/5">
                          <div className="h-4 w-32 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
                        </td>
                        {[...Array(daysInMonth)].map((_, j) => (
                          <td key={j} className="p-2 border-r border-slate-200 dark:border-white/5">
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
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                          {/* Left Sticky Column */}
                          <td className="sticky left-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 dark:group-hover:bg-[#161821] z-20 px-4 py-2 border-r shadow-[4px_0_12px_-2px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-2px_rgba(0,0,0,0.5)] transition-colors">
                            <div
                              className="cursor-pointer group/item"
                              onClick={() => { setGenerateEmpId(emp.id); setModalOpen(true); }}
                            >
                              <p className="font-semibold text-slate-900 dark:text-white truncate max-w-[190px] group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors">
                                {emp.fullName}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{emp.department?.name || "Bo'limsiz"}</p>
                            </div>
                          </td>

                          {/* Calendar Cells */}
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
                                  "text-center p-1 border-r border-slate-200 dark:border-white/5 relative transition-all",
                                  isWeekend && "bg-slate-50/50 dark:bg-white/[0.01]",
                                  isToday && "bg-indigo-500/5",
                                  sch && "cursor-pointer hover:bg-slate-100 dark:hover:bg-white/[0.04]"
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

              {/* Infinite Scroll Loading Indicator */}
              {isFetchingNextPage && (
                <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2 bg-slate-50/50 dark:bg-white/[0.01]">
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  Keyingi xodimlar yuklanmoqda...
                </div>
              )}
            </div>

            {/* Table Footer / Legend */}
            <div className="flex flex-wrap items-center gap-6 px-6 py-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-2 font-medium">
                <span className="bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold px-2 py-0.5 rounded-lg border border-sky-500/20 text-[10px]">K</span> Kunduzgi smen
              </span>
              <span className="flex items-center gap-2 font-medium">
                <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold px-2 py-0.5 rounded-lg border border-purple-500/20 text-[10px]">Tu</span> Tungi smen
              </span>
              <span className="flex items-center gap-2 font-medium">
                <span className="font-bold text-slate-400 dark:text-slate-500">○</span> Dam olish kuni
              </span>
              <span className="flex items-center gap-1.5 ml-auto text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                <Edit3 className="w-3.5 h-3.5" /> Katak ustiga bosib grafikni o&apos;zgartirishingiz mumkin
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
          qc.invalidateQueries({ queryKey: ["schedules-monthly-paginated"] });
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
          qc.invalidateQueries({ queryKey: ["schedules-monthly-paginated"] });
          qc.invalidateQueries({ queryKey: ["schedule-statistics"] });
        }}
      />
    </div>
  );
}