/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowLeftRight, CheckCircle2, Loader2, MessageSquare, UserRoundCheck, XCircle } from "lucide-react";
import { photoUrl, swapApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { cn, isSuperLike } from "@/lib/utils";

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const dayLabel = (key?: string | null) => {
  if (!key) return "—";
  const [, m, d] = key.split("-").map(Number);
  return `${d}-${MONTHS[m - 1]}`;
};
const shiftLabel = (s?: { name?: string; startTime: string; endTime: string } | null) =>
  s ? `${s.startTime}–${s.endTime}` : "dam olish";

const STATUS: Record<string, { label: string; cls: string }> = {
  REQUESTED: { label: "Hamkasb javobi kutilmoqda", cls: "bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10" },
  ACCEPTED: { label: "Tasdiqlash kutilmoqda", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" },
  DECLINED: { label: "Hamkasb rad etdi", cls: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10" },
  APPROVED: { label: "Tasdiqlandi", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" },
  REJECTED: { label: "Rad etildi", cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" },
  CANCELLED: { label: "Bekor qilindi", cls: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10" },
};

const FILTERS = [
  { value: "ACCEPTED", label: "Tasdiqlash kutilmoqda" },
  { value: "ALL", label: "So'nggi 30 kun" },
];

function Person({ p, caption }: { p: any; caption: string }) {
  const photo = p?.photoUrl ? photoUrl(p.photoUrl) : null;
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="w-10 h-10 rounded-xl object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
          {(p?.fullName ?? "?").charAt(0)}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{caption}</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{p?.fullName}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{p?.position || p?.department || "—"}</p>
      </div>
    </div>
  );
}

function Plan({ s }: { s: any }) {
  const box = "rounded-xl bg-slate-50 dark:bg-[#0f1422] border border-slate-200 dark:border-white/10 p-2.5 text-xs";
  if (s.type === "COVER") {
    return (
      <div className={box}>
        <span className="block text-[10px] text-slate-500 dark:text-slate-400">O&apos;rniga chiqish</span>
        <span className="font-semibold text-slate-900 dark:text-white">
          {dayLabel(s.requesterDate)} ({shiftLabel(s.requesterShift)}): {s.target.fullName} ishlaydi, {s.requester.fullName} dam oladi
        </span>
      </div>
    );
  }
  const same = s.targetDate === s.requesterDate;
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className={box}>
        <span className="block text-[10px] text-slate-500 dark:text-slate-400">{s.requester.fullName.split(" ")[1] ?? s.requester.fullName}</span>
        <span className="font-semibold text-slate-900 dark:text-white">
          {same ? `${dayLabel(s.requesterDate)}: ${shiftLabel(s.requesterShift)} → ${shiftLabel(s.targetShift)}` : `${dayLabel(s.requesterDate)} o'rniga ${dayLabel(s.targetDate)}`}
        </span>
      </div>
      <div className={box}>
        <span className="block text-[10px] text-slate-500 dark:text-slate-400">{s.target.fullName.split(" ")[1] ?? s.target.fullName}</span>
        <span className="font-semibold text-slate-900 dark:text-white">
          {same ? `${dayLabel(s.requesterDate)}: ${shiftLabel(s.targetShift)} → ${shiftLabel(s.requesterShift)}` : `${dayLabel(s.targetDate)} o'rniga ${dayLabel(s.requesterDate)}`}
        </span>
      </div>
    </div>
  );
}

function SwapCard({ s, canReview, targetHospitalId }: { s: any; canReview: boolean; targetHospitalId?: string }) {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const st = STATUS[s.status] ?? STATUS.REQUESTED;

  const mutation = useMutation({
    mutationFn: (decision: "APPROVED" | "REJECTED") =>
      swapApi.review(s.id, { decision, note: note.trim() || undefined }, targetHospitalId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shift-swaps"] }),
    onError: (e: any) => setError(e?.response?.data?.message ?? "Xatolik yuz berdi"),
  });

  return (
    <div className="rounded-2xl bg-white dark:bg-[#131929] border border-slate-200 dark:border-white/10 p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          {s.type === "COVER" ? <UserRoundCheck className="w-4 h-4" /> : <ArrowLeftRight className="w-4 h-4" />}
          {s.type === "COVER" ? "O'rniga chiqish" : "Smena almashish"}
        </span>
        <span className={cn("px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap", st.cls)}>{st.label}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Person p={s.requester} caption="So'radi" />
        <Person p={s.target} caption={s.type === "COVER" ? "O'rniga chiqadi" : "Almashadi"} />
      </div>
      <Plan s={s} />
      {s.reason ? <p className="text-sm text-slate-600 dark:text-slate-300">📝 {s.reason}</p> : null}
      {s.reviewNote ? <p className="text-xs text-slate-500 dark:text-slate-400">💬 Rahbar izohi: {s.reviewNote}</p> : null}

      {canReview && s.status === "ACCEPTED" ? (
        <div className="space-y-2 pt-1">
          {showNote ? (
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              placeholder="Izoh (ixtiyoriy)"
              className="w-full rounded-xl bg-slate-50 dark:bg-[#0f1422] border border-slate-200 dark:border-white/10 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          ) : null}
          {error ? <p className="text-xs text-rose-600">{error}</p> : null}
          <div className="flex gap-2">
            <button
              disabled={mutation.isPending}
              onClick={() => mutation.mutate("APPROVED")}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 disabled:opacity-60"
            >
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Tasdiqlash
            </button>
            <button
              disabled={mutation.isPending}
              onClick={() => mutation.mutate("REJECTED")}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-semibold py-2.5 disabled:opacity-60"
            >
              <XCircle className="w-4 h-4" />
              Rad etish
            </button>
            <button
              onClick={() => setShowNote((v) => !v)}
              title="Izoh qo'shish"
              className="px-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Tasdiqlansa, ikkala xodimning grafigi avtomatik yangilanadi.</p>
        </div>
      ) : null}
    </div>
  );
}

export default function ShiftSwapsPage() {
  const router = useRouter();
  const { user, selectedHospital } = useAuthStore();
  const targetHospitalId = isSuperLike(user?.role) ? selectedHospital?.id : undefined;
  const canReview = user?.role !== "DEPARTMENT_HEAD";
  const [filter, setFilter] = useState("ACCEPTED");

  const { data, isLoading } = useQuery({
    queryKey: ["shift-swaps", filter, targetHospitalId],
    queryFn: () => swapApi.list({ status: filter === "ALL" ? undefined : filter, targetHospitalId }),
    refetchInterval: 60_000,
  });
  const items: any[] = Array.isArray(data) ? data : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b101d] text-slate-900 dark:text-slate-100">
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-[#0f1422]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-6 py-3.5 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
          title="Orqaga qaytish"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-base font-bold flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-indigo-500" /> Smena almashish
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Xodimlar mobil ilovadan so&apos;raydi, hamkasb rozi bo&apos;lgach shu yerda tasdiqlanadi.
          </p>
        </div>
      </div>

      <div className="p-6 space-y-5 max-w-5xl mx-auto pb-12">
        <div className="flex gap-1.5 bg-white dark:bg-[#131929] border border-slate-200 dark:border-white/10 p-1.5 rounded-2xl w-fit">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                filter === f.value ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 p-12 text-center text-sm text-slate-500 dark:text-slate-400">
            {filter === "ACCEPTED" ? "Tasdiqlash kutayotgan so'rov yo'q" : "So'nggi 30 kunda so'rov bo'lmagan"}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((s) => (
              <SwapCard key={s.id} s={s} canReview={canReview} targetHospitalId={targetHospitalId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
