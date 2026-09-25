/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock3, Loader2, MessageSquare, XCircle } from "lucide-react";
import dayjs from "dayjs";
import { noticeApi, photoUrl } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { cn, isSuperLike } from "@/lib/utils";

const REASONS: Record<string, { label: string; emoji: string }> = {
  TRAFFIC: { label: "Yo'l tirband", emoji: "🚦" },
  TRANSPORT: { label: "Transport (taksi, avtobus)", emoji: "🚕" },
  FAMILY: { label: "Oilaviy sabab", emoji: "🏠" },
  HEALTH: { label: "Sog'liq", emoji: "🩺" },
  OTHER: { label: "Boshqa sabab", emoji: "📝" },
};

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Kutilmoqda", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" },
  APPROVED: { label: "Uzrli", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" },
  REJECTED: { label: "Rad etildi", cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" },
  CANCELLED: { label: "Bekor qilindi", cls: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10" },
};

const FILTERS = [
  { value: "PENDING", label: "Kutilmoqda" },
  { value: "ALL", label: "So'nggi 14 kun" },
];

function NoticeCard({ n, canReview, targetHospitalId }: { n: any; canReview: boolean; targetHospitalId?: string }) {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reason = REASONS[n.reason] ?? { label: n.reason, emoji: "📝" };
  const st = STATUS[n.status] ?? STATUS.PENDING;
  const photo = n.employee?.photoUrl ? photoUrl(n.employee.photoUrl) : null;

  const mutation = useMutation({
    mutationFn: (decision: "APPROVED" | "REJECTED") =>
      noticeApi.review(n.id, { decision, note: note.trim() || undefined }, targetHospitalId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance-notices"] }),
    onError: (e: any) => setError(e?.response?.data?.message ?? "Xatolik yuz berdi"),
  });

  return (
    <div className="rounded-2xl bg-white dark:bg-[#131929] border border-slate-200 dark:border-white/10 p-4 space-y-3 shadow-sm">
      <div className="flex items-start gap-3">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="w-11 h-11 rounded-xl object-cover" />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            {(n.employee?.fullName ?? "?").charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{n.employee?.fullName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {n.employee?.department?.name || "—"} · {n.employee?.position?.name || "—"}
          </p>
        </div>
        <span className={cn("px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap", st.cls)}>{st.label}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-slate-50 dark:bg-[#0f1422] border border-slate-200 dark:border-white/10 p-2.5">
          <span className="block text-[10px] text-slate-500 dark:text-slate-400">Taxminiy kechikish</span>
          <span className="font-semibold text-slate-900 dark:text-white">{n.delayMinutes} daqiqa</span>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-[#0f1422] border border-slate-200 dark:border-white/10 p-2.5">
          <span className="block text-[10px] text-slate-500 dark:text-slate-400">Sana</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {dayjs(n.workDate).format("DD.MM.YYYY")} · {dayjs(n.createdAt).format("HH:mm")} da yuborgan
          </span>
        </div>
      </div>

      <p className="text-sm text-slate-700 dark:text-slate-200">
        {reason.emoji} <span className="font-medium">{reason.label}</span>
        {n.comment ? <span className="text-slate-500 dark:text-slate-400"> — «{n.comment}»</span> : null}
      </p>
      {n.reviewNote ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">💬 Rahbar izohi: {n.reviewNote}</p>
      ) : null}

      {canReview && n.status === "PENDING" ? (
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
              Uzrli
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
        </div>
      ) : null}
    </div>
  );
}

export default function AttendanceNoticesPage() {
  const router = useRouter();
  const { user, selectedHospital } = useAuthStore();
  const targetHospitalId = isSuperLike(user?.role) ? selectedHospital?.id : undefined;
  const canReview = user?.role !== "DEPARTMENT_HEAD";
  const [filter, setFilter] = useState("PENDING");

  const { data, isLoading } = useQuery({
    queryKey: ["attendance-notices", filter, targetHospitalId],
    queryFn: () =>
      noticeApi.list({ status: filter === "ALL" ? undefined : filter, days: 14, targetHospitalId }),
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
            <Clock3 className="w-4 h-4 text-indigo-500" /> Kechikish xabarlari
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Xodimlar mobil ilovadan yuboradi. «Uzrli» — o&apos;sha kungi kechikish hisobot va oylikda hisoblanmaydi.
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
                filter === f.value
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5",
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
            {filter === "PENDING" ? "Ko'rib chiqilmagan xabar yo'q" : "So'nggi 14 kunda xabar bo'lmagan"}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((n) => (
              <NoticeCard key={n.id} n={n} canReview={canReview} targetHospitalId={targetHospitalId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
