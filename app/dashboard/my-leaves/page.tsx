"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus, CalendarDays, Clock, CheckCircle2, XCircle,
  AlertTriangle, Loader2, ChevronDown, X, Sparkles, Umbrella,
  Calendar as CalendarIcon
} from "lucide-react";
import { leaveApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import "dayjs/locale/uz";
import { useAuthStore } from "@/stores/auth";
dayjs.locale("uz");

// ─── Konstantalar ─────────────────────────────────────────────────────────────

const LEAVE_TYPES = [
  { value: "VACATION",  label: "Yillik ta'til",     emoji: "🏖", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  { value: "SICK",      label: "Kasallik",           emoji: "🤒", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  { value: "PERSONAL",  label: "Shaxsiy sabab",      emoji: "🏠", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { value: "MATERNITY", label: "Tug'ruq ta'tili",    emoji: "🤱", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { value: "UNPAID",    label: "Haqsiz ta'til",      emoji: "📋", color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
];

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
  PENDING:   { label: "Kutilmoqda", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30",   icon: Clock },
  APPROVED:  { label: "Tasdiqlandi", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  REJECTED:  { label: "Rad etildi", cls: "bg-red-500/20 text-red-400 border-red-500/30",      icon: XCircle },
  CANCELLED: { label: "Bekor qilindi", cls: "bg-slate-500/20 text-slate-400 border-slate-500/30",   icon: X },
};

function leaveTypeConfig(type: string) {
  return LEAVE_TYPES.find((t) => t.value === type) ?? { label: type, emoji: "📋", color: "text-slate-400 bg-slate-500/10 border-slate-500/20" };
}

function formatDate(d: string | Date) {
  return dayjs(d).format("DD.MM.YYYY");
}

// ─── Yangi so'rov formasi (Modal) ─────────────────────────────────────────────

function NewLeaveForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    type:      "VACATION",
    startDate: "",
    endDate:   "",
    reason:    "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isOpenSelect, setIsOpenSelect] = useState(false);

  const mutation = useMutation({
    mutationFn: () => leaveApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-leaves"] });
      onClose();
    },
    onError: (e: any) => {
      setError(e?.response?.data?.message ?? "Xatolik yuz berdi");
    },
  });

  const daysCount =
    form.startDate && form.endDate
      ? dayjs(form.endDate).diff(dayjs(form.startDate), "day") + 1
      : 0;

  const canSubmit =
    !mutation.isPending &&
    form.type &&
    form.startDate &&
    form.endDate &&
    daysCount > 0 &&
    daysCount <= 365;

  const selectedType = LEAVE_TYPES.find((t) => t.value === form.type) ?? LEAVE_TYPES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      {/* Qat'iy dark ranglar berildi, shunda tema o'zgarsa ham fon va yozuvlar o'zgarmaydi */}
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-[2rem] bg-slate-950 border border-indigo-500/30 p-5 sm:p-6 shadow-2xl relative overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-shrink-0">
          <div>
            <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest">
              ARIZA TOPSHIRISH
            </span>
            <h2 className="text-lg font-black text-white tracking-tight">Yangi ta'til so'rovi</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 py-4">
          {/* Ta'til turi (Custom dropdown) */}
          <div className="space-y-1.5 relative">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ta'til turi</label>
            <button
              type="button"
              onClick={() => setIsOpenSelect(!isOpenSelect)}
              className="w-full flex items-center justify-between bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-all"
            >
              <span className="flex items-center gap-2.5">
                <span className="text-base">{selectedType.emoji}</span>
                <span>{selectedType.label}</span>
              </span>
              <ChevronDown className={cn("w-4 h-4 text-indigo-400 transition-transform", isOpenSelect && "rotate-180")} />
            </button>

            {isOpenSelect && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-2xl space-y-1">
                {LEAVE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, type: t.value });
                      setIsOpenSelect(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-left transition-all",
                      form.type === t.value ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <span className="text-base">{t.emoji}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sanalar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Boshlanish sanasi</label>
              <input
                type="date"
                value={form.startDate}
                min={dayjs().format("YYYY-MM-DD")}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tugash sanasi</label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate || dayjs().format("YYYY-MM-DD")}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Kunlar soni badge */}
          {daysCount > 0 && (
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300">
              <span className="text-xs font-bold">Tanlangan davomiyligi:</span>
              <span className="text-xs font-black text-indigo-300 bg-indigo-600/30 px-2.5 py-1 rounded-xl">
                {daysCount} kun
              </span>
            </div>
          )}

          {/* Sabab */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
              <span>Izoh yoki sabab</span>
              <span className="text-[10px] text-indigo-400 font-normal">ixtiyoriy</span>
            </label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={2}
              placeholder="Qisqacha izoh kiriting..."
              className="w-full resize-none bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Xato xabari */}
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-3 text-xs font-semibold text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Tugmalar */}
        <div className="flex items-center gap-2.5 pt-3 border-t border-slate-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-2xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 transition-all"
          >
            Bekor qilish
          </button>
          
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit}
            className={cn(
              "flex-1 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all",
              canSubmit
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800"
            )}
          >
            {mutation.isPending ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Yuborilmoqda...</>
            ) : (
              <><Sparkles className="w-3.5 h-3.5 text-indigo-300" /> So'rov yuborish</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── So'rov kartochkasi ────────────────────────────────────────────────────────

function LeaveCard({ leave, onCancel }: { leave: any; onCancel: (id: string) => void }) {
  const st = STATUS_CONFIG[leave.status] ?? STATUS_CONFIG.PENDING;
  const StIcon = st.icon;
  const tp = leaveTypeConfig(leave.type);

  return (
    <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] p-5 space-y-4 shadow-xl hover:border-indigo-500/30 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border", tp.color)}>
            {tp.emoji}
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[var(--text-primary)]">{tp.label}</h4>
            <p className="text-xs font-medium text-[var(--text-muted)] mt-0.5">
              {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
              <span className="ml-2 font-mono font-bold text-indigo-400">({leave.daysCount} kun)</span>
            </p>
          </div>
        </div>

        <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border", st.cls)}>
          <StIcon className="w-3.5 h-3.5" />
          {st.label}
        </span>
      </div>

      {/* Sabab */}
      {leave.reason && (
        <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-main)] rounded-2xl p-3 border border-[var(--border)]">
          <span className="font-bold text-[var(--text-primary)]">Izoh:</span> {leave.reason}
        </div>
      )}

      {/* Rahbar izohi */}
      {leave.reviewNote && (
        <div className={cn(
          "text-xs rounded-2xl p-3 border font-medium",
          leave.status === "APPROVED"
            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            : "text-red-400 bg-red-500/10 border-red-500/20",
        )}>
          <span className="font-bold">Rahbar izohi:</span> {leave.reviewNote}
        </div>
      )}

      {/* Pastki qism & Bekor qilish */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
        <span className="text-[11px] font-medium text-[var(--text-muted)]">
          Yuborildi: {dayjs(leave.createdAt).format("DD.MM.YYYY HH:mm")}
        </span>

        {leave.status === "PENDING" && (
          <button
            onClick={() => onCancel(leave.id)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
          >
            Bekor qilish
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ASOSIY SAHIFA ────────────────────────────────────────────────────────────

export default function MyLeavesPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("ALL");

  const empName = user?.employee?.fullName ?? user?.username ?? "Xodim";

  const { data, isLoading } = useQuery({
    queryKey: ["my-leaves", filter],
    queryFn: () => leaveApi.my({ status: filter, limit: 50 }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => leaveApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-leaves"] }),
  });

  const records: any[] = data?.records ?? [];

  const FILTERS = [
    { value: "ALL", label: "Barchasi" },
    { value: "PENDING", label: "Kutilmoqda" },
    { value: "APPROVED", label: "Tasdiqlangan" },
    { value: "REJECTED", label: "Rad etilgan" },
    { value: "CANCELLED", label: "Bekor qilingan" },
  ];

  return (
    <div className="pb-16">
      <Topbar
        title="Ta'til so'rovlari"
        subtitle={`${empName} · Ta'til va ruxsatnomalarni boshqarish`}
      />

      <div className="max-w-4xl mx-auto px-4 lg:px-6 pt-6 space-y-6">
        {/* Modal */}
        {showForm && <NewLeaveForm onClose={() => setShowForm(false)} />}

        {/* Header Panel */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-[var(--bg-card)] border dark:border-indigo-900/50 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Xodim imkoniyatlari
              </div>
              <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                Ta'til so'rovlari
              </h1>
              <p className="text-xs font-medium text-[var(--text-muted)] mt-0.5">
                Yillik va boshqa turdagi ta'tillar uchun so'rovlar yuboring va ularning holatini kuzatib boring.
              </p>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-lg shadow-indigo-500/25 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi so'rov</span>
            </button>
          </div>
        </div>

        {/* Statistika Kartalari: Birinchisi uzun, pastdagilar mobil va desktopda yonma-yon (grid-cols-2) */}
        <div className="space-y-4">
          {/* Uzun karta: Jami so'rovlar */}
          <div className="relative overflow-hidden rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] p-5 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-indigo-500/0 opacity-50 pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Jami so'rovlar</span>
              <div className="p-2.5 rounded-2xl bg-[var(--bg-hover)] border border-[var(--border)] text-indigo-400">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{data?.total ?? 0}</p>
          </div>

          {/* Pastdagi ikkita karta mobil va desktopda yonma-yon */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Tasdiqlangan", value: records.filter(r => r.status === "APPROVED").length, icon: CheckCircle2, color: "text-emerald-400", gradient: "from-emerald-500/20 to-emerald-500/0" },
              { label: "Kutilayotgan", value: records.filter(r => r.status === "PENDING").length, icon: Clock, color: "text-amber-400", gradient: "from-amber-500/20 to-amber-500/0" },
            ].map((s) => (
              <div key={s.label} className="relative overflow-hidden rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] p-5 shadow-sm">
                <div className={cn("absolute inset-0 bg-gradient-to-b opacity-50 pointer-events-none", s.gradient)} />
                <div className="relative z-10 flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-[var(--text-muted)] truncate">{s.label}</span>
                  <div className={cn("p-2.5 rounded-2xl bg-[var(--bg-hover)] border border-[var(--border)] flex-shrink-0", s.color)}>
                    <s.icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition-all border",
                filter === f.value
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20"
                  : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border-[var(--border)]",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl card p-5 h-32 animate-pulse bg-[var(--bg-hover)] border border-[var(--border)]" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] p-12 text-center space-y-3 shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
              <Umbrella className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-base text-[var(--text-primary)]">So'rovlar topilmadi</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              Sizda hali bu filtr bo'yicha ta'til so'rovlari mavjud emas. Yangi ariza yuborish uchun tugmani bosing.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 border border-indigo-500/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Birinchi so'rovni yaratish
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((leave) => (
              <LeaveCard
                key={leave.id}
                leave={leave}
                onCancel={(id) => cancelMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}