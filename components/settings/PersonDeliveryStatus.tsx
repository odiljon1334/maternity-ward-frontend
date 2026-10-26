"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hikvisionApi, type TerminalSyncJob } from "@/lib/api";
import { toast } from "sonner";

const states: Record<string, string> = {
  WAITING: "Kutmoqda", ACTIVE: "Yuborilmoqda", DELIVERED: "Tasdiqlandi", ERROR: "Xato",
};
const actions: Record<string, string> = { UPSERT: "Qo‘shish / yangilash", BLOCK: "Bloklash", DELETE: "O‘chirish" };

/** One live summary; device-level details are fetched only when requested. */
export function PersonDeliveryStatus({ hospitalId, employeeId, job }: { hospitalId?: string; employeeId?: string; job?: TerminalSyncJob | null }) {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const key = ["person-deliveries", hospitalId, employeeId, page, expanded];
  const query = useQuery({
    queryKey: key,
    queryFn: () => hikvisionApi.personDeliveries(hospitalId!, employeeId, page, !expanded),
    enabled: !!hospitalId,
    refetchInterval: (q) => {
      const c = q.state.data?.counts;
      return job?.state === "RUNNING" || (c?.WAITING ?? 0) + (c?.ACTIVE ?? 0) > 0 ? 3000 : false;
    },
    retry: 1,
  });
  const retry = useMutation({
    mutationFn: (id: string) => hikvisionApi.retryPersonDelivery(hospitalId!, id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["person-deliveries", hospitalId] }); },
    onError: () => toast.error("Qayta navbatga qo‘yib bo‘lmadi"),
  });
  if (!hospitalId) return null;
  const data = query.data;
  const delivered = data?.counts.DELIVERED ?? 0;
  const pending = (data?.counts.WAITING ?? 0) + (data?.counts.ACTIVE ?? 0);
  const errors = data?.counts.ERROR ?? 0;
  return (
    <section className="rounded-xl border border-[var(--border)] p-3 space-y-2" aria-label="Terminalga yuklash holati">
      <div className="flex items-center justify-between gap-3 text-xs">
        <p className="font-semibold">Terminalga yuklash</p>
        <button type="button" className="text-[var(--text-muted)] underline" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
          {expanded ? "Yopish" : "Tafsilotlar"}
        </button>
      </div>
      {query.isLoading && <p role="status" className="text-xs">Holat yuklanmoqda…</p>}
      {query.isError && <p role="alert" className="text-xs text-red-400">Holatni olib bo‘lmadi. <button type="button" className="underline" onClick={() => void query.refetch()}>Qayta tekshirish</button></p>}
      {job?.state === "RUNNING" && <p className="text-xs text-[var(--text-muted)]">Vazifalar navbatga tayyorlanmoqda. Oynani yopish mumkin.</p>}
      {job?.state === "FAILED" && <p role="alert" className="text-xs text-red-400">{job.message || "Vazifalarni navbatga qo‘yib bo‘lmadi."}</p>}
      {data && <>
        <p className="text-xs text-[var(--text-muted)]" role="status">
          Tasdiqlandi: {delivered}/{data.total} · Kutmoqda: {pending} · Xato: {errors}
        </p>
        {pending > 0 && <progress className="h-1.5 w-full accent-indigo-500" value={delivered} max={data.total || 1} aria-label="Terminalda tasdiqlangan vazifalar" />}
        {data.withoutPhoto > 0 && <p className="text-xs text-amber-400">Rasmsiz: {data.withoutPhoto} — yuborilmaydi. Surat qo‘shilgach avtomatik yuboriladi.</p>}
        {expanded && <>
          <p className="text-xs text-[var(--text-muted)]">Offline terminaldagi vazifa ulanish tiklangach bajariladi. Bloklash va o‘chirish terminalda tasdiqlangach kuchga kiradi.</p>
          {!data.total && !data.withoutPhoto && <p className="text-xs text-[var(--text-muted)]">Yuborish vazifasi yo‘q.</p>}
          <div className="max-h-64 overflow-y-auto divide-y divide-[var(--border)]">
            {data.items.map(item => <div key={item.id} className="py-2 text-xs space-y-1">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 break-words">{!employeeId && `${item.fullName} · `}{item.terminalName} · {actions[item.action] ?? item.action}</p>
                <span className={item.state === "DELIVERED" ? "text-emerald-400" : item.state === "ERROR" ? "text-red-400" : "text-amber-400"}>{states[item.state] ?? "Kutmoqda"}</span>
              </div>
              {item.lastError && <p className="text-[var(--text-muted)] break-words">{item.lastError.replace(/^(WAIT|ERROR):/, "")}</p>}
              {item.state === "ERROR" && <button type="button" className="underline" disabled={retry.isPending} onClick={() => retry.mutate(item.id)}>Qayta yuborish</button>}
            </div>)}
          </div>
          {data.total > 30 && <div className="flex items-center justify-between text-xs">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Oldingi</button>
            <span>{page} / {Math.ceil(data.total / 30)}</span>
            <button type="button" disabled={page * 30 >= data.total} onClick={() => setPage(page + 1)}>Keyingi</button>
          </div>}
        </>}
      </>}
    </section>
  );
}
