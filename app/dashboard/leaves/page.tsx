"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays, CheckCircle2, XCircle, Clock,
  X, Loader2, AlertTriangle, RotateCcw,
} from "lucide-react";
import { leaveApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { cn, isSuperLike } from "@/lib/utils";
import dayjs from "dayjs";

// ─── Konstantalar ─────────────────────────────────────────────────────────────

const LEAVE_TYPES: Record<string, { label: string; emoji: string }> = {
  VACATION:  { label: "Yillik ta'til",    emoji: "🏖" },
  SICK:      { label: "Kasallik",          emoji: "🤒" },
  PERSONAL:  { label: "Shaxsiy sabab",     emoji: "🏠" },
  MATERNITY: { label: "Tug'ruq ta'tili",   emoji: "🤱" },
  UNPAID:    { label: "Haqsiz ta'til",     emoji: "📋" },
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: "Kutilmoqda",  cls: "bg-amber-500/20 text-amber-400"   },
  APPROVED:  { label: "Tasdiqlandi", cls: "bg-emerald-500/20 text-emerald-400" },
  REJECTED:  { label: "Rad etildi",  cls: "bg-red-500/20 text-red-400"       },
  CANCELLED: { label: "Bekor",       cls: "bg-slate-500/20 text-slate-400"   },
};

// ─── Review Modal ──────────────────────────────────────────────────────────────

function ReviewModal({
  leave,
  onClose,
}: {
  leave: any;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { user, selectedHospital } = useAuthStore();
  const targetHospitalId = isSuperLike(user?.role) ? selectedHospital?.id : undefined;

  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const tp = LEAVE_TYPES[leave.type] ?? { label: leave.type, emoji: "📋" };

  const mutation = useMutation({
    mutationFn: (decision: "APPROVED" | "REJECTED") =>
      leaveApi.review(leave.id, { decision, reviewNote: note || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leaves"] });
      onClose();
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? "Xatolik"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-5 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            So'rovni ko'rib chiqish
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info */}
        <div className="rounded-xl bg-[var(--bg-main)] p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{tp.emoji}</span>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {leave.employee?.fullName}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {leave.employee?.department?.name} · {leave.employee?.position?.name}
              </p>
            </div>
          </div>
          <div className="text-xs text-[var(--text-muted)] space-y-1 pt-1 border-t border-[var(--border)]">
            <p>📋 Tur: <span className="text-[var(--text-primary)]">{tp.label}</span></p>
            <p>
              📅 Muddat:{" "}
              <span className="text-[var(--text-primary)] font-medium">
                {dayjs(leave.startDate).format("DD.MM.YYYY")} – {dayjs(leave.endDate).format("DD.MM.YYYY")}
                {" "}({leave.daysCount} kun)
              </span>
            </p>
            {leave.reason && <p>💬 Sabab: <span className="text-[var(--text-primary)]">{leave.reason}</span></p>}
          </div>
        </div>

        {/* Izoh */}
        <div className="space-y-1.5">
          <label className="text-xs text-[var(--text-muted)] font-medium">
            Izoh <span className="opacity-50">(ixtiyoriy)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Xodimga izoh qoldiring..."
            className="w-full resize-none bg-[var(--bg-main)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Tugmalar */}
        <div className="flex gap-2">
          <button
            onClick={() => mutation.mutate("APPROVED")}
            disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition-colors"
          >
            {mutation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <CheckCircle2 className="w-4 h-4" />
            }
            Tasdiqlash
          </button>
          <button
            onClick={() => mutation.mutate("REJECTED")}
            disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Rad etish
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Leave row (desktop table) ─────────────────────────────────────────────────

function LeaveRow({
  leave,
  onReview,
  onRevoke,
}: {
  leave:    any;
  onReview: (leave: any) => void;
  onRevoke: (id: string) => void;
}) {
  const st = STATUS_CONFIG[leave.status] ?? STATUS_CONFIG.PENDING;
  const tp = LEAVE_TYPES[leave.type]     ?? { label: leave.type, emoji: "📋" };

  return (
    <tr className="border-b border-[var(--border)] table-row-hover">
      {/* Xodim */}
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-[var(--text-primary)]">{leave.employee?.fullName}</p>
        <p className="text-xs text-[var(--text-muted)]">{leave.employee?.department?.name}</p>
      </td>
      {/* Tur */}
      <td className="px-4 py-3 text-sm">
        {tp.emoji} {tp.label}
      </td>
      {/* Muddat */}
      <td className="px-4 py-3 text-sm text-[var(--text-muted)] whitespace-nowrap">
        {dayjs(leave.startDate).format("DD.MM")} – {dayjs(leave.endDate).format("DD.MM.YYYY")}
        <span className="ml-1 text-indigo-400 font-medium">({leave.daysCount}k)</span>
      </td>
      {/* Holat */}
      <td className="px-4 py-3">
        <span className={cn("inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-full", st.cls)}>
          {st.label}
        </span>
      </td>
      {/* Amallar */}
      <td className="px-4 py-3">
        {leave.status === "PENDING" && (
          <button
            onClick={() => onReview(leave)}
            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors font-medium"
          >
            Ko'rib chiqish
          </button>
        )}
        {leave.status === "APPROVED" && (
          <button
            onClick={() => onRevoke(leave.id)}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Qaytarish
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── Leave card (mobile) ───────────────────────────────────────────────────────

function LeaveCard({
  leave,
  onReview,
  onRevoke,
}: {
  leave:    any;
  onReview: (leave: any) => void;
  onRevoke: (id: string) => void;
}) {
  const st = STATUS_CONFIG[leave.status] ?? STATUS_CONFIG.PENDING;
  const tp = LEAVE_TYPES[leave.type]     ?? { label: leave.type, emoji: "📋" };

  return (
    <div className="card p-4 space-y-3">
      {/* Top row: name + status */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {leave.employee?.fullName}
          </p>
          <p className="text-xs text-[var(--text-muted)]">{leave.employee?.department?.name}</p>
        </div>
        <span className={cn("flex-shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full", st.cls)}>
          {st.label}
        </span>
      </div>

      {/* Leave type + dates */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--text-muted)]">
          {tp.emoji} {tp.label}
        </span>
        <span className="text-[var(--text-muted)]">
          {dayjs(leave.startDate).format("DD.MM")} – {dayjs(leave.endDate).format("DD.MM.YYYY")}
          <span className="ml-1 text-indigo-400 font-medium">({leave.daysCount} kun)</span>
        </span>
      </div>

      {/* Reason if any */}
      {leave.reason && (
        <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-main)] rounded-lg px-3 py-2">
          💬 {leave.reason}
        </p>
      )}

      {/* Action buttons */}
      {leave.status === "PENDING" && (
        <button
          onClick={() => onReview(leave)}
          className="w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
        >
          Ko'rib chiqish
        </button>
      )}
      {leave.status === "APPROVED" && (
        <button
          onClick={() => onRevoke(leave.id)}
          className="w-full py-2.5 rounded-xl text-xs font-medium bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Qaytarish
        </button>
      )}

      {/* Date submitted */}
      <p className="text-[10px] text-[var(--text-muted)] opacity-50">
        {dayjs(leave.createdAt).format("DD.MM.YYYY HH:mm")} da yuborilgan
      </p>
    </div>
  );
}

// ─── PAGE ──────────────────────────────────────────────────────────────────────

export default function LeavesPage() {
  const { user, selectedHospital } = useAuthStore();
  const qc = useQueryClient();
  const targetHospitalId = isSuperLike(user?.role) ? selectedHospital?.id : undefined;

  const [filter,      setFilter]      = useState("ALL");
  const [reviewLeave, setReviewLeave] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["leaves", filter, targetHospitalId],
    queryFn:  () => leaveApi.list({ status: filter, limit: 100, targetHospitalId }),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => leaveApi.revoke(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["leaves"] }),
  });

  const records: any[]    = data?.records     ?? [];
  const pendingCount: number = data?.pendingCount ?? 0;

  const FILTERS = [
    { value: "ALL",       label: "Barchasi" },
    { value: "PENDING",   label: `Kutilmoqda${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
    { value: "APPROVED",  label: "Tasdiqlangan" },
    { value: "REJECTED",  label: "Rad etilgan" },
    { value: "CANCELLED", label: "Bekor" },
  ];

  return (
    <div>
      {/* Review modal */}
      {reviewLeave && (
        <ReviewModal
          leave={reviewLeave}
          onClose={() => setReviewLeave(null)}
        />
      )}

      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">Ta'til so'rovlari</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {pendingCount > 0
              ? <span className="text-amber-400 font-medium">{pendingCount} ta yangi so'rov kutilmoqda</span>
              : "Barcha so'rovlar ko'rib chiqilgan"
            }
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
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
          <div className="card p-10 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
          </div>
        ) : records.length === 0 ? (
          <div className="card p-10 text-center">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
            <p className="text-sm text-[var(--text-muted)]">So'rovlar yo'q</p>
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="md:hidden space-y-3">
              {records.map((leave) => (
                <LeaveCard
                  key={leave.id}
                  leave={leave}
                  onReview={setReviewLeave}
                  onRevoke={(id) => revokeMutation.mutate(id)}
                />
              ))}
            </div>

            {/* Desktop: table */}
            <div className="card overflow-hidden hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      {["Xodim", "Tur", "Muddat", "Holat", "Amal"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((leave) => (
                      <LeaveRow
                        key={leave.id}
                        leave={leave}
                        onReview={setReviewLeave}
                        onRevoke={(id) => revokeMutation.mutate(id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
