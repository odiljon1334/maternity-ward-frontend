"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hikvisionApi, type TerminalSyncJob } from "@/lib/api";
import { PersonDeliveryStatus } from "./PersonDeliveryStatus";

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
    onSuccess: (job) => { qc.setQueryData(key, job); void qc.invalidateQueries({ queryKey: ["person-deliveries", hospitalId] }); },
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
      else toast.success(job.message || `Sync tugadi: ${job.created} yangi, ${job.skipped} mavjud`);
      void qc.invalidateQueries({ queryKey: ["person-deliveries", hospitalId] });
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

export function TerminalSyncStatus({ job, hospitalId }: { job: TerminalSyncJob | null; hospitalId?: string }) {
  return <PersonDeliveryStatus hospitalId={hospitalId} job={job} />;
}
