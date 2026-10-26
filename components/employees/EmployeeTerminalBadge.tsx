"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, Clock3, AlertCircle, CloudUpload, Loader2 } from "lucide-react";
import { hikvisionApi } from "@/lib/api";

export function EmployeeTerminalBadge({
  hospitalId,
  employeeId,
  photoUrl,
}: {
  hospitalId?: string;
  employeeId: string;
  photoUrl?: string | null;
}) {
  const query = useQuery({
    queryKey: [
      "person-deliveries",
      hospitalId,
      employeeId,
      "photo-badge",
      photoUrl,
    ],
    queryFn: () =>
      hikvisionApi.personDeliveryPeople(
        hospitalId!,
        employeeId,
        "ALL",
        1,
        true,
      ),
    enabled: !!hospitalId && !!photoUrl,
    staleTime: 10000,
    refetchInterval: (q) =>
      (q.state.data?.counts.WAITING ?? 0) > 0 ? 5000 : false,
    retry: 1,
  });
  if (!hospitalId || !photoUrl) return null;
  const counts = query.data?.counts;
  const uploaded = !query.isError && (counts?.DELIVERED ?? 0) === 1;
  const failed = !query.isError && (counts?.ERROR ?? 0) > 0;
  const waiting = !query.isError && (counts?.WAITING ?? 0) > 0;
  const label = uploaded
    ? "Surat barcha tegishli terminallarga yuklangan"
    : failed
      ? "Suratni terminalga yuklashda xatolik"
      : waiting
        ? "Surat terminalga yuklanmoqda"
        : query.isLoading
          ? "Terminal holati tekshirilmoqda"
          : "Surat terminalga yuklangani tasdiqlanmagan";
  const Icon = uploaded
    ? Check
    : failed
      ? AlertCircle
      : waiting
        ? Clock3
        : query.isLoading
          ? Loader2
          : CloudUpload;
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`inline-flex rounded-full p-1 bg-[var(--bg-card)] ring-2 ring-[var(--bg-card)] shadow ${uploaded ? "text-emerald-500" : failed ? "text-red-400" : waiting ? "text-amber-400" : "text-[var(--text-muted)]"}`}
    >
      <Icon
        aria-hidden="true"
        className={`w-3.5 h-3.5 ${query.isLoading ? "animate-spin" : ""}`}
      />
    </span>
  );
}
