/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays, CheckCircle2, XCircle,
  X, Loader2, AlertTriangle, RotateCcw, ArrowLeft, FileText
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
  PENDING:   { label: "Kutilmoqda",  cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" },
  APPROVED:  { label: "Tasdiqlandi", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" },
  REJECTED:  { label: "Rad etildi",  cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" },
  CANCELLED: { label: "Bekor qilindi", cls: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10" },
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
    onError: (e: any) => setError(e?.response?.data?.message ?? "Xatolik yuz berdi"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#131929] border border-slate-200 dark:border-white/10 p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                So&apos;rovni ko&apos;rib chiqish
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Xodim ta&apos;til arizasini tasdiqlash yoki rad etish</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Card */}
        <div className="rounded-xl bg-slate-50 dark:bg-[#0f1422] border border-slate-200 dark:border-white/10 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">{tp.emoji}</span>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {leave.employee?.fullName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {leave.employee?.department?.name || "Bo'lim ko'rsatilmagan"} · {leave.employee?.position?.name || "Lavozim yo'q"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-white/10 text-xs">
            <div className="bg-white dark:bg-[#131929] p-2.5 rounded-xl border border-slate-200 dark:border-white/10">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Ta&apos;til turi</span>
              <span className="font-semibold text-slate-900 dark:text-white">{tp.label}</span>
            </div>
            <div className="bg-white dark:bg-[#131929] p-2.5 rounded-xl border border-slate-200 dark:border-white/10">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Davomiyligi</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{leave.daysCount} kun</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-1">
            <p className="flex items-center gap-1.5">
              📅 Muddat: <span className="text-slate-900 dark:text-white font-medium">{dayjs(leave.startDate).format("DD.MM.YYYY")} – {dayjs(leave.endDate).format("DD.MM.YYYY")}</span>
            </p>
            {leave.reason && (
              <p className="bg-white dark:bg-[#131929] p-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white mt-2">
                💬 <span className="font-medium text-slate-600 dark:text-slate-300">Sabab:</span> {leave.reason}
              </p>
            )}
          </div>
        </div>

        {/* Izoh inputi */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Izoh qoldirish <span className="text-slate-400 font-normal">(ixtiyoriy)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Xodimga yuboriladigan izoh..."
            className="w-full rounded-xl bg-slate-50 dark:bg-[#0f1422] border border-slate-200 dark:border-white/10 px-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none transition-all"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => mutation.mutate("REJECTED")}
            disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <XCircle className="w-4 h-4" /> Rad etish
          </button>
          <button
            onClick={() => mutation.mutate("APPROVED")}
            disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Tasdiqlash</>}
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
  highlighted,
}: {
  leave:    any;
  onReview: (leave: any) => void;
  onRevoke: (id: string) => void;
  highlighted?: boolean;
}) {
  const st = STATUS_CONFIG[leave.status] ?? STATUS_CONFIG.PENDING;
  const tp = LEAVE_TYPES[leave.type]     ?? { label: leave.type, emoji: "📋" };
  const ref = useRef<HTMLTableRowElement>(null);
  const [showHighlight, setShowHighlight] = useState(!!highlighted);

  useEffect(() => {
    if (!highlighted || !ref.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    setShowHighlight(true);
    const t = setTimeout(() => setShowHighlight(false), 3000);
    return () => clearTimeout(t);
  }, [highlighted]);

  return (
    <tr
      ref={ref}
      className={cn(
        "hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors duration-500 border-b border-slate-200 dark:border-white/10",
        showHighlight && "bg-indigo-50 dark:bg-indigo-500/10 border-l-4 border-l-indigo-500"
      )}
    >
      <td className="px-6 py-4 w-[25%]">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{leave.employee?.fullName}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{leave.employee?.department?.name || "Bo'lim yo'q"}</p>
      </td>
      <td className="px-6 py-4 w-[20%]">
        <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-200">
          <span>{tp.emoji}</span> {tp.label}
        </span>
      </td>
      <td className="px-6 py-4 w-[25%] text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap font-mono">
        {dayjs(leave.startDate).format("DD.MM.YYYY")} – {dayjs(leave.endDate).format("DD.MM.YYYY")}
        <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-bold">({leave.daysCount} kun)</span>
      </td>
      <td className="px-6 py-4 w-[15%]">
        <span className={cn("inline-flex items-center text-[11px] font-semibold px-3 py-1 rounded-full", st.cls)}>
          {st.label}
        </span>
      </td>
      <td className="px-6 py-4 w-[15%] text-right">
        {leave.status === "PENDING" && (
          <button
            onClick={() => onReview(leave)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            Ko&apos;rib chiqish
          </button>
        )}
        {leave.status === "APPROVED" && (
          <button
            onClick={() => onRevoke(leave.id)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-rose-500/10 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-white/10 transition-colors text-xs inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Qaytarish
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
  highlighted,
}: {
  leave:    any;
  onReview: (leave: any) => void;
  onRevoke: (id: string) => void;
  highlighted?: boolean;
}) {
  const st = STATUS_CONFIG[leave.status] ?? STATUS_CONFIG.PENDING;
  const tp = LEAVE_TYPES[leave.type]     ?? { label: leave.type, emoji: "📋" };
  const ref = useRef<HTMLDivElement>(null);
  const [showHighlight, setShowHighlight] = useState(!!highlighted);

  useEffect(() => {
    if (!highlighted || !ref.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    setShowHighlight(true);
    const t = setTimeout(() => setShowHighlight(false), 3000);
    return () => clearTimeout(t);
  }, [highlighted]);

  return (
    <div
      ref={ref}
      className={cn(
        "bg-white dark:bg-[#131929] border border-slate-200 dark:border-white/10 p-4 rounded-2xl space-y-3.5 shadow-lg transition-all duration-500",
        showHighlight && "ring-2 ring-indigo-500 border-indigo-500/50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {leave.employee?.fullName}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{leave.employee?.department?.name || "Bo'lim yo'q"}</p>
        </div>
        <span className={cn("shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full", st.cls)}>
          {st.label}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-[#0f1422] p-3 rounded-xl border border-slate-200 dark:border-white/10">
        <span className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
          <span>{tp.emoji}</span> {tp.label}
        </span>
        <span className="text-indigo-600 dark:text-indigo-400 font-bold">
          {leave.daysCount} kun
        </span>
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span>📅 Muddat:</span>
        <span className="font-mono text-slate-900 dark:text-white font-medium">
          {dayjs(leave.startDate).format("DD.MM.YYYY")} – {dayjs(leave.endDate).format("DD.MM.YYYY")}
        </span>
      </div>

      {leave.reason && (
        <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#0f1422] rounded-xl p-3 border border-slate-200 dark:border-white/10">
          💬 <span className="font-medium text-slate-500 dark:text-slate-400">Sabab:</span> {leave.reason}
        </p>
      )}

      {/* Action buttons */}
      <div className="pt-1">
        {leave.status === "PENDING" && (
          <button
            onClick={() => onReview(leave)}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            Ko&apos;rib chiqish
          </button>
        )}
        {leave.status === "APPROVED" && (
          <button
            onClick={() => onRevoke(leave.id)}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-rose-500/10 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-white/10 transition-colors text-xs font-medium flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Qaytarish
          </button>
        )}
      </div>

      <p className="text-[10px] text-slate-400 text-right">
        {dayjs(leave.createdAt).format("DD.MM.YYYY HH:mm")} da yuborilgan
      </p>
    </div>
  );
}

// ─── PAGE ──────────────────────────────────────────────────────────────────────

export default function LeavesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
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
    { value: "CANCELLED", label: "Bekor qilingan" },
  ];

  const userName = (user as any)?.name || (user as any)?.fullName || "Admin";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b101d] text-slate-900 dark:text-slate-100">
      {/* Review modal */}
      {reviewLeave && (
        <ReviewModal
          leave={reviewLeave}
          onClose={() => setReviewLeave(null)}
        />
      )}

      {/* Top Header Section */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-[#0f1422]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            title="Orqaga qaytish"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Ta&apos;til so&apos;rovlari
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {pendingCount > 0
                ? <span className="text-amber-600 dark:text-amber-400 font-semibold">{pendingCount} ta yangi so&apos;rov kutilmoqda</span>
                : "Barcha so'rovlar ko'rib chiqilgan"
              }
            </p>
          </div>
        </div>

        {/* Kasalxona va profil qismi */}
        <div className="flex items-center gap-3">
          {selectedHospital && (
            <span className="hidden sm:inline-flex px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-medium">
              {selectedHospital.name}
            </span>
          )}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10">
            <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              {userName.charAt(0)}
            </span>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">{userName}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-[1700px] mx-auto pb-12">
        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 bg-white dark:bg-[#131929] border border-slate-200 dark:border-white/10 p-1.5 rounded-2xl shadow-xl">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                filter === f.value
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-white/10 p-16 rounded-2xl text-center shadow-xl">
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-indigo-600 dark:text-indigo-500" />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Ma&apos;lumotlar yuklanmoqda...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-white/10 p-16 rounded-2xl text-center space-y-3 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-400 border border-slate-200 dark:border-white/10">
              <CalendarDays className="w-6 h-6 opacity-60" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Hozircha so&apos;rovlar mavjud emas</p>
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
                  highlighted={leave.id === highlightId}
                />
              ))}
            </div>

            {/* Desktop: table */}
            <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden hidden md:block shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0f1422]">
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-left w-[25%]">Xodim</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-left w-[20%]">Ta&apos;til turi</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-left w-[25%]">Muddat</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-left w-[15%]">Holat</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right w-[15%]">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                    {records.map((leave) => (
                      <LeaveRow
                        key={leave.id}
                        leave={leave}
                        onReview={setReviewLeave}
                        onRevoke={(id) => revokeMutation.mutate(id)}
                        highlighted={leave.id === highlightId}
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
