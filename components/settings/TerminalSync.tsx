"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hikvisionApi, type TerminalSyncJob } from "@/lib/api";
import { tzTime } from "@/lib/time";

/**
 * Terminal sinxronizatsiyasi — serverda fon vazifasi.
 *
 * Ilgari bitta uzun so'rov edi: oyna yopilsa, internet uzilsa yoki proxy
 * kutishdan charchasa "xatolik" chiqib, natija yo'qolardi. Endi sync
 * boshlanadi va holat har 2 soniyada so'raladi — sahifani yangilasangiz
 * yoki qaytib kelsangiz ham progress va oxirgi natija ko'rinadi.
 */
export function useTerminalSync(hospitalId?: string) {
  const qc = useQueryClient();
  const key = ["terminal-sync", hospitalId];

  const status = useQuery({
    queryKey: key,
    queryFn: () => hikvisionApi.syncStatus(hospitalId as string),
    enabled: !!hospitalId,
    refetchInterval: (q) => (q.state.data?.state === "RUNNING" ? 2000 : false),
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const start = useMutation({
    mutationFn: () => hikvisionApi.syncHospital(hospitalId as string),
    onSuccess: (job) => qc.setQueryData(key, job),
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message || "Sinxronlashni boshlab bo'lmadi"),
  });

  const job = status.data ?? null;

  // Shu oynada kuzatilgan ish tugaganda — bir marta xabar
  const seenRunning = useRef<string | null>(null);
  useEffect(() => {
    if (!job) return;
    if (job.state === "RUNNING") {
      seenRunning.current = job.id;
      return;
    }
    if (seenRunning.current === job.id) {
      seenRunning.current = null;
      if (job.state === "FAILED") toast.error(job.message || "Sinxronlash xato bilan to'xtadi");
      else if (job.failed > 0)
        toast.warning(`Sync tugadi: ${job.created} yangi, ${job.skipped} mavjud, ${job.failed} xato`);
      else toast.success(`Sync tugadi: ${job.created} yangi, ${job.skipped} mavjud`);
      // Terminal holatlari (online/offline) ham yangilansin
      void qc.invalidateQueries({ queryKey: ["settings-terminals", hospitalId] });
      void qc.invalidateQueries({ queryKey: ["terminals", hospitalId] });
    }
  }, [job, qc, hospitalId]);

  return {
    job,
    running: job?.state === "RUNNING" || start.isPending,
    start: () => start.mutate(),
  };
}

export function TerminalSyncStatus({ job }: { job: TerminalSyncJob | null }) {
  if (!job) return null;

  if (job.state === "RUNNING") {
    const pct = job.units > 0 ? Math.round((job.done / job.units) * 100) : 0;
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-hover)] p-4 space-y-2" aria-live="polite">
        <div className="flex items-center justify-between text-xs">
          <p className="font-semibold text-[var(--text-primary)]">Sinxronlanmoqda…</p>
          <p className="font-mono text-[var(--text-muted)]">
            {job.units > 0 ? `${job.done} / ${job.units}` : "tayyorlanmoqda"}
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-card)]">
          <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">
          {job.created} yangi · {job.skipped} mavjud · {job.failed} xato. Oynani yopsangiz ham jarayon serverda davom etadi.
        </p>
      </div>
    );
  }

  if (job.state === "FAILED") {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400" role="alert">
        {job.message || "Sinxronlash xato bilan to'xtadi. Qayta urinib ko'ring."}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-hover)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--text-primary)]">Oxirgi sync natijasi</p>
        {job.finishedAt && (
          <p className="text-[10px] text-[var(--text-muted)]">{tzTime(job.finishedAt).format("DD.MM HH:mm")}</p>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { label: "Xodim", val: job.total, cls: "bg-[var(--bg-card)]", color: "text-[var(--text-primary)]" },
          { label: "Yangi", val: job.created, cls: "bg-emerald-500/10", color: "text-emerald-400" },
          { label: "Mavjud", val: job.skipped, cls: "bg-sky-500/10", color: "text-sky-400" },
          { label: "Xato", val: job.failed, cls: "bg-red-500/10", color: "text-red-400" },
        ].map(({ label, val, cls, color }) => (
          <div key={label} className={`rounded-lg ${cls} py-2`}>
            <p className={`text-sm font-bold ${color}`}>{val}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
          </div>
        ))}
      </div>
      {job.perTerminal.length > 1 && (
        <div className="space-y-1 text-[11px] text-[var(--text-muted)]">
          {job.perTerminal.map((t) => (
            <p key={t.terminalId}>
              <span className="font-medium text-[var(--text-primary)]">{t.terminalName}</span>: {t.created} yangi, {t.skipped} mavjud, {t.failed} xato
              {t.aborted && <span className="text-amber-400"> — javob bermadi</span>}
            </p>
          ))}
        </div>
      )}
      {job.withoutPhoto > 0 && (
        <p className="text-[11px] text-amber-400">
          {job.withoutPhoto} ta xodimning profil rasmi yo&apos;q — ular terminalga yuborilmadi.
        </p>
      )}
      {job.errors.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-y-auto pt-1 border-t border-[var(--border)]">
          {job.errors.map((e, i) => (
            <div key={i} className="text-xs px-2 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10">
              <span className="font-medium text-[var(--text-primary)]">{e.name || e.employeeNo}</span>
              <span className="text-[var(--text-muted)]"> — {e.reason}</span>
            </div>
          ))}
          {job.errorsTruncated > 0 && (
            <p className="text-[11px] text-[var(--text-muted)]">… va yana {job.errorsTruncated} ta xato (server logida)</p>
          )}
        </div>
      )}
    </div>
  );
}
