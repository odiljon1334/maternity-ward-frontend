"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
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
    <EmployeeTerminalBadgeIcon
      status={status}
      loading={query.isLoading}
      hospitalId={hospitalId}
      employeeId={employeeId}
    />
  );
}

export type TerminalPhotoStatus =
  "DELIVERED" | "WAITING" | "ERROR" | "UNCONFIRMED" | "NO_PHOTO";

/** List status comes from the batch; error details load only after a click. */
export function EmployeeTerminalBadgeIcon({
  status,
  loading = false,
  compact = false,
  hospitalId,
  employeeId,
}: {
  status?: TerminalPhotoStatus;
  loading?: boolean;
  compact?: boolean;
  hospitalId?: string;
  employeeId?: string;
}) {
  const [open, setOpen] = useState(false);
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
  const clickable = failed && !!hospitalId && !!employeeId;
  return (
    <>
      <span
        onClick={
          clickable
            ? (e) => {
                e.stopPropagation();
                setOpen(true);
              }
            : undefined
        }
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(true);
                }
              }
            : undefined
        }
        tabIndex={clickable ? 0 : undefined}
        role={clickable ? "button" : "img"}
        aria-haspopup={clickable ? "dialog" : undefined}
        aria-label={clickable ? `${label}. Sababini ko‘rish` : label}
        title={label}
        className={`inline-flex ${clickable ? "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400" : ""} rounded-full ${compact ? "p-0.5" : "p-1"} bg-[var(--bg-card)] ring-2 ring-[var(--bg-card)] shadow ${uploaded ? "text-emerald-500" : failed ? "text-red-400" : waiting ? "text-amber-400" : "text-[var(--text-muted)]"}`}
      >
        <Icon
          aria-hidden="true"
          className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"} ${loading ? "animate-spin" : ""}`}
        />
      </span>
      {open && hospitalId && employeeId && (
        <TerminalErrorDetails
          hospitalId={hospitalId}
          employeeId={employeeId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function TerminalErrorDetails({
  hospitalId,
  employeeId,
  onClose,
}: {
  hospitalId: string;
  employeeId: string;
  onClose: () => void;
}) {
  const details = useQuery({
    queryKey: ["person-delivery-errors", hospitalId, employeeId],
    queryFn: () =>
      hikvisionApi.personDeliveryPeople(hospitalId, employeeId, "ALL"),
    staleTime: 0,
    retry: 1,
  });
  const failedTasks =
    details.data?.employees
      .flatMap((e) => e.deliveries)
      .filter((d) => d.state === "ERROR") ?? [];
  return (
    <span
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Dialog
        open
        onClose={onClose}
        title="Terminalga yuklashdagi xatolik"
        description="Har bir terminal bo‘yicha oxirgi qayd etilgan sabab."
      >
        <div className="max-h-[60vh] overflow-y-auto space-y-3 text-sm">
          {details.isLoading ? (
            <p role="status">Tafsilotlar yuklanmoqda…</p>
          ) : details.isError ? (
            <div role="alert">
              <p>
                Tafsilotlarni olib bo‘lmadi. Ulanishni tekshirib, qayta urinib
                ko‘ring.
              </p>
              <button
                type="button"
                className="underline mt-2"
                onClick={() => void details.refetch()}
              >
                Qayta tekshirish
              </button>
            </div>
          ) : failedTasks.length ? (
            failedTasks.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border border-red-400/30 p-3 space-y-2"
              >
                <p className="font-semibold">{d.terminalName}</p>
                <p className="text-red-400">
                  {explainTerminalError(d.lastError)}
                </p>
                {d.lastError && (
                  <details className="text-xs text-[var(--text-muted)]">
                    <summary className="cursor-pointer">
                      Texnik tafsilot
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap break-words">
                      {d.lastError.replace(/^(ERROR|WAIT):/, "")}
                    </p>
                  </details>
                )}
              </div>
            ))
          ) : (
            <p>
              Hozir xatolik qayd etilmagan. Terminal holati o‘zgargan bo‘lishi
              mumkin.
            </p>
          )}
        </div>
      </Dialog>
    </span>
  );
}

function explainTerminalError(error: string | null): string {
  const text = error?.replace(/^(ERROR|WAIT):/, "").trim();
  if (!text)
    return "Terminal surat yuklanganini tasdiqlamadi. Aniq sabab qayd etilmagan.";
  if (/yuz aniqlanmadi|no.face|face.not.found/i.test(text))
    return "Rasmda yuz topilmadi. Xodimning yuzi aniq ko‘rinadigan, old tomondan olingan suratni yuklang.";
  if (/bir nechta yuz|multiple.face/i.test(text))
    return "Rasmda bir nechta yuz bor. Faqat shu xodimning bitta yuzi tushirilgan suratni yuklang.";
  if (/offline|timeout|timed out|ECONN|unreachable/i.test(text))
    return "Terminal bilan aloqa o‘rnatilmadi yoki javob kechikdi. Qurilmaning elektr va internet ulanishini tekshiring.";
  if (/unauthorized|forbidden|401|403|password/i.test(text))
    return "Gateway yoki terminal kirishni rad etdi. Ulanish hisobining ruxsatlarini tekshirish kerak.";
  if (/Content Error|badParameters|invalid.*(content|parameter)/i.test(text))
    return "Terminal yuborilgan ma’lumotni qabul qilmadi. Surat formati va xodim ma’lumotlarini tekshirish kerak. Aniq terminal javobi texnik tafsilotda berilgan.";
  if (/face|picture|image|surat|rasm|yuz/i.test(text))
    return `Suratni yuklash tasdiqlanmadi: ${text}`;
  return `Terminal amalni bajara olmadi: ${text}`;
}
