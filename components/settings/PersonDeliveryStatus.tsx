"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hikvisionApi } from "@/lib/api";
import { tzTime } from "@/lib/time";
import { toast } from "sonner";

const states: Record<string, string> = {
  WAITING: "Kutmoqda", ACTIVE: "Yuborilmoqda", DELIVERED: "Terminalda tasdiqlandi", ERROR: "Tekshirish kerak",
};
const actions: Record<string, string> = { UPSERT: "Qo‘shish / yangilash", BLOCK: "Kirishni bloklash", DELETE: "Terminaldan o‘chirish" };

export function PersonDeliveryStatus({ hospitalId, employeeId }: { hospitalId?: string; employeeId?: string }) {
  const [expanded, setExpanded] = useState(!!employeeId);
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const key = ["person-deliveries", hospitalId, employeeId, page];
  const query = useQuery({
    queryKey: key,
    queryFn: () => hikvisionApi.personDeliveries(hospitalId!, employeeId, page),
    enabled: !!hospitalId && expanded,
    refetchInterval: expanded ? 5000 : false,
  });
  const retry = useMutation({
    mutationFn: (id: string) => hikvisionApi.retryPersonDelivery(hospitalId!, id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["person-deliveries", hospitalId] }); },
    onError: () => toast.error("Qayta navbatga qo‘yib bo‘lmadi"),
  });
  if (!hospitalId) return null;
  return (
    <section className="rounded-xl border border-[var(--border)] p-3 space-y-3">
      <button type="button" className="w-full text-left text-sm font-semibold" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
        Xodimlarning terminalga yetkazilishi {expanded ? "▴" : "▾"}
      </button>
      {expanded && <>
        <p className="text-xs text-[var(--text-muted)]">Bloklash terminaldan xodimni olib tashlaydi. Offline qurilmada amal internet qaytganda bajariladi; ungacha kirish cheklovi yetkazilgan hisoblanmaydi.</p>
        {query.isLoading && <p role="status" className="text-xs">Yuklanmoqda…</p>}
        {query.isError && <p role="alert" className="text-xs text-red-400">Holatni olib bo‘lmadi. <button type="button" className="underline" onClick={() => void query.refetch()}>Qayta tekshirish</button></p>}
        {query.data && <>
          <p className="text-xs text-[var(--text-muted)]">{Object.entries(states).map(([k, label]) => `${label}: ${query.data.counts[k] ?? 0}`).join(" · ")}</p>
          {query.data.withoutPhoto > 0 && <p className="text-xs text-amber-400">Rasmsiz xodimlar: {query.data.withoutPhoto}. Ular terminalga yuborilmaydi. Surat yuklangach avtomatik navbatga tushadi.</p>}
          {!query.data.items.length && !(employeeId && query.data.withoutPhoto > 0) && <p className="text-xs text-[var(--text-muted)]">Hali yetkazish yozuvi yo‘q. Yangi o‘zgarishlar avtomatik navbatga tushadi; avvalgi xodimlar uchun Sinxronlash tugmasini bosing.</p>}
          <div className="space-y-2" aria-live="polite">
            {query.data.items.map(item => {
              const delivered = item.state === "DELIVERED" && item.revision === item.deliveredRevision;
              return <div key={item.id} className="rounded-lg bg-[var(--bg-hover)] p-3 text-xs space-y-1">
                <p className="font-medium break-words">{item.fullName} · {item.employeeNo}</p>
                <p>{item.terminalName} — {actions[item.action] ?? item.action}</p>
                <p className={delivered ? "text-emerald-400" : item.state === "ERROR" ? "text-red-400" : "text-amber-400"}>{delivered ? states.DELIVERED : states[item.state] ?? "Kutmoqda"} · Urinish: {item.attempts}</p>
                {item.lastError && <p className="text-[var(--text-muted)] break-words">{item.lastError.replace(/^(WAIT|ERROR):/, "")}</p>}
                {item.confirmedAt && <p className="text-[var(--text-muted)]">Oxirgi tasdiq: {tzTime(item.confirmedAt).format("DD.MM.YYYY HH:mm:ss")}{!delivered ? " (avvalgi amal)" : ""}</p>}
                {(item.state === "ERROR" || item.state === "WAITING") && <button type="button" className="underline" disabled={retry.isPending} onClick={() => retry.mutate(item.id)}>Qayta yuborish</button>}
              </div>;
            })}
          </div>
          {query.data.total > 30 && <div className="flex items-center justify-between text-xs">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Oldingi</button>
            <span>{page} / {Math.ceil(query.data.total / 30)}</span>
            <button type="button" disabled={page * 30 >= query.data.total} onClick={() => setPage(page + 1)}>Keyingi</button>
          </div>}
        </>}
      </>}
    </section>
  );
}
