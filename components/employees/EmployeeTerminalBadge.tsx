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
  const status: TerminalPhotoStatus = query.isError
    ? "UNCONFIRMED"
    : (counts?.ERROR ?? 0) > 0
      ? "ERROR"
      : (counts?.WAITING ?? 0) > 0
        ? "WAITING"
        : counts?.DELIVERED === 1
          ? "DELIVERED"
          : "UNCONFIRMED";
  return (
    <EmployeeTerminalBadgeIcon status={status} loading={query.isLoading} />
  );
}

export type TerminalPhotoStatus =
  "DELIVERED" | "WAITING" | "ERROR" | "UNCONFIRMED" | "NO_PHOTO";

/** Pure icon for list rows: uses their batched API status, never fetches. */
export function EmployeeTerminalBadgeIcon({
  status,
  loading = false,
  compact = false,
}: {
  status?: TerminalPhotoStatus;
  loading?: boolean;
  compact?: boolean;
}) {
  if (status === "NO_PHOTO") return null;
  const uploaded = status === "DELIVERED";
  const failed = status === "ERROR";
  const waiting = status === "WAITING";
  const label = uploaded
    ? "Surat barcha tegishli terminallarga yuklangan"
    : failed
      ? "Suratni terminalga yuklashda xatolik"
      : waiting
        ? "Surat terminalga yuklanmoqda"
        : loading
          ? "Terminal holati tekshirilmoqda"
          : "Surat terminalga yuklangani tasdiqlanmagan";
  const Icon = uploaded
    ? Check
    : failed
      ? AlertCircle
      : waiting
        ? Clock3
        : loading
          ? Loader2
          : CloudUpload;
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`inline-flex rounded-full ${compact ? "p-0.5" : "p-1"} bg-[var(--bg-card)] ring-2 ring-[var(--bg-card)] shadow ${uploaded ? "text-emerald-500" : failed ? "text-red-400" : waiting ? "text-amber-400" : "text-[var(--text-muted)]"}`}
    >
      <Icon
        aria-hidden="true"
        className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"} ${loading ? "animate-spin" : ""}`}
      />
    </span>
  );
}
