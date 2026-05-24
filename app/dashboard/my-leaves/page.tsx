"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus, CalendarDays, Clock, CheckCircle2, XCircle,
  AlertTriangle, Loader2, ChevronDown, X,
} from "lucide-react";
import { leaveApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import "dayjs/locale/uz";
dayjs.locale("uz");

// ─── Konstantalar ─────────────────────────────────────────────────────────────

const LEAVE_TYPES = [
  { value: "VACATION",  label: "Yillik ta'til",     emoji: "🏖" },
  { value: "SICK",      label: "Kasallik",           emoji: "🤒" },
  { value: "PERSONAL",  label: "Shaxsiy sabab",      emoji: "🏠" },
  { value: "MATERNITY", label: "Tug'ruq ta'tili",    emoji: "🤱" },
  { value: "UNPAID",    label: "Haqsiz ta'til",      emoji: "📋" },
];

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
  PENDING:   { label: "Kutilmoqda", cls: "bg-amber-500/20 text-amber-400",   icon: Clock },
  APPROVED:  { label: "Tasdiqlandi", cls: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle2 },
  REJECTED:  { label: "Rad etildi", cls: "bg-red-500/20 text-red-400",      icon: XCircle },
  CANCELLED: { label: "Bekor",      cls: "bg-slate-500/20 text-slate-400",   icon: X },
};

function leaveTypeLabel(type: string) {
  return LEAVE_TYPES.find((t) => t.value === type) ?? { label: type, emoji: "📋" };
}

function formatDate(d: string | Date) {
  return dayjs(d).format("DD.MM.YYYY");
}

// ─── Yangi so'rov formasi ──────────────────────────────────────────────────────

function NewLeaveForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    type:      "VACATION",
    startDate: "",
    endDate:   "",
    reason:    "",
  });
  const [error, setError] = useState<string | null>(null);

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

  // Kunlar sonini hisoblash
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-5 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Yangi ta'til so'rovi
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ta'til turi */}
        <div className="space-y-1.5">
          <label className="text-xs text-[var(--text-muted)] font-medium">Ta'til turi</label>
          <div className="relative">
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full appearance-none bg-[var(--bg-main)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.emoji} {t.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>

        {/* Sanalar */}
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-muted)] font-medium">📅 Boshlanish sanasi</label>
            <input
              type="date"
              value={form.startDate}
              min={dayjs().format("YYYY-MM-DD")}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full bg-[var(--bg-main)] border border-[var(--border)] rounded-xl px-3 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-muted)] font-medium">📅 Tugash sanasi</label>
            <input
              type="date"
              value={form.endDate}
              min={form.startDate || dayjs().format("YYYY-MM-DD")}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full bg-[var(--bg-main)] border border-[var(--border)] rounded-xl px-3 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
        </div>

        {/* Kunlar soni */}
        {daysCount > 0 && (
          <p className={cn(
            "text-xs font-medium",
            daysCount > 365 ? "text-red-400" : "text-indigo-400",
          )}>
            📅 Jami: {daysCount} kun
          </p>
        )}

        {/* Sabab */}
        <div className="space-y-1.5">
          <label className="text-xs text-[var(--text-muted)] font-medium">
            Sabab <span className="opacity-50">(ixtiyoriy)</span>
          </label>
          <textarea
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            rows={3}
            placeholder="Qo'shimcha izoh..."
            className="w-full resize-none bg-[var(--bg-main)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        {/* Xato */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Tugmalar */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
              canSubmit
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-slate-700/50 text-slate-500 cursor-not-allowed",
            )}
          >
            {mutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Yuborilmoqda...</>
              : <><CalendarDays className="w-4 h-4" /> So'rov yuborish</>
            }
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          >
            Bekor
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── So'rov kartochkasi ────────────────────────────────────────────────────────

function LeaveCard({ leave, onCancel }: { leave: any; onCancel: (id: string) => void }) {
  const st  = STATUS_CONFIG[leave.status] ?? STATUS_CONFIG.PENDING;
  const StIcon = st.icon;
  const tp  = leaveTypeLabel(leave.type);

  return (
    <div className="card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{tp.emoji}</span>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{tp.label}</p>
            <p className="text-xs text-[var(--text-muted)]">
              {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
              <span className="ml-1.5 text-indigo-400 font-medium">({leave.daysCount} kun)</span>
            </p>
          </div>
        </div>
        <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full", st.cls)}>
          <StIcon className="w-3 h-3" />
          {st.label}
        </span>
      </div>

      {/* Sabab */}
      {leave.reason && (
        <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-main)] rounded-lg px-3 py-2">
          💬 {leave.reason}
        </p>
      )}

      {/* Direktor izohi */}
      {leave.reviewNote && (
        <p className={cn(
          "text-xs rounded-lg px-3 py-2",
          leave.status === "APPROVED"
            ? "text-emerald-400 bg-emerald-500/10"
            : "text-red-400 bg-red-500/10",
        )}>
          📝 {leave.reviewNote}
        </p>
      )}

      {/* Bekor qilish tugmasi */}
      {leave.status === "PENDING" && (
        <button
          onClick={() => onCancel(leave.id)}
          className="w-full py-2 rounded-lg text-xs font-medium bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors"
        >
          So'rovni bekor qilish
        </button>
      )}

      {/* Yaratilgan sana */}
      <p className="text-[10px] text-[var(--text-muted)] opacity-50">
        {dayjs(leave.createdAt).format("DD.MM.YYYY HH:mm")} da yuborilgan
      </p>
    </div>
  );
}

// ─── PAGE ──────────────────────────────────────────────────────────────────────

export default function MyLeavesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm]   = useState(false);
  const [filter,   setFilter]     = useState("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["my-leaves", filter],
    queryFn:  () => leaveApi.my({ status: filter, limit: 50 }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => leaveApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-leaves"] }),
  });

  const records: any[] = data?.records ?? [];

  const FILTERS = [
    { value: "ALL",       label: "Barchasi" },
    { value: "PENDING",   label: "Kutilmoqda" },
    { value: "APPROVED",  label: "Tasdiqlangan" },
    { value: "REJECTED",  label: "Rad etilgan" },
    { value: "CANCELLED", label: "Bekor" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Modal */}
      {showForm && <NewLeaveForm onClose={() => setShowForm(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Ta'til so'rovlari</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {data?.total ?? 0} ta so'rov
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Yangi so'rov</span>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              filter === f.value
                ? "bg-indigo-600 text-white"
                : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)]",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 h-28 animate-pulse bg-[var(--bg-hover)]" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="card p-10 text-center">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-sm text-[var(--text-muted)]">So'rovlar yo'q</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            + Birinchi so'rovni yarating
          </button>
        </div>
      ) : (
        <div className="space-y-3">
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
  );
}
