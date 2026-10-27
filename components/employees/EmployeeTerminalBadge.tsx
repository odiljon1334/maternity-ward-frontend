"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock3, AlertCircle, CloudUpload, Loader2 } from "lucide-react";
import {
  hikvisionApi,
  employeesApi,
  photoUrl as buildPhotoUrl,
} from "@/lib/api";

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
  const clickable = (failed || uploaded) && !!hospitalId && !!employeeId;
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
        aria-label={
          clickable
            ? `${label}. ${failed ? "Sababini" : "Holatini"} ko‘rish`
            : label
        }
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
          showAll={uploaded}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function TerminalErrorDetails({
  hospitalId,
  employeeId,
  showAll,
  onClose,
}: {
  hospitalId: string;
  employeeId: string;
  showAll: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [retried, setRetried] = useState<string[]>([]);
  const details = useQuery({
    queryKey: ["person-delivery-errors", hospitalId, employeeId],
    queryFn: () =>
      hikvisionApi.personDeliveryPeople(hospitalId, employeeId, "ALL"),
    staleTime: 0,
    refetchInterval: (q) =>
      q.state.data?.employees.some((e) =>
        e.deliveries.some(
          (d) =>
            retried.includes(d.id) && ["WAITING", "ACTIVE"].includes(d.state),
        ),
      )
        ? 5000
        : false,
    retry: 1,
  });
  const retry = useMutation({
    mutationFn: async (id: string) => {
      const result = await hikvisionApi.retryPersonDelivery(hospitalId, id);
      if (!result?.queued)
        throw new Error("Holat o‘zgargan. Oynani qayta ochib tekshiring.");
      return id;
    },
    onSuccess: (id) => {
      setRetried((ids) => (ids.includes(id) ? ids : [...ids, id]));
      void details.refetch();
      void qc.invalidateQueries({ queryKey: ["employees"] });
      void qc.invalidateQueries({
        queryKey: ["person-deliveries", hospitalId],
      });
    },
  });
  const replacePhoto = useMutation({
    mutationFn: async ({ file }: { file: File; deliveryId: string }) => {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
        throw new Error("JPG, PNG yoki WebP formatidagi suratni tanlang.");
      if (file.size > 10 * 1024 * 1024)
        throw new Error("Surat hajmi 10 MB dan oshmasin.");
      // Server validates exactly one face before saving; the atomic outbox trigger queues the new photo.
      return employeesApi.uploadPhoto(employeeId, file, {
        targetHospitalId: hospitalId,
      });
    },
    onSuccess: (_employee, { deliveryId }) => {
      setRetried((ids) =>
        ids.includes(deliveryId) ? ids : [...ids, deliveryId],
      );
      void details.refetch();
      void qc.invalidateQueries({ queryKey: ["employees"] });
      void qc.invalidateQueries({ queryKey: ["employee", employeeId] });
      void qc.invalidateQueries({
        queryKey: ["person-deliveries", hospitalId],
      });
    },
    onError: () => {
      void details.refetch();
    },
  });
  const failedTasks =
    details.data?.employees
      .flatMap((e) =>
        e.deliveries.map((d) => ({ ...d, currentPhotoUrl: e.photoUrl })),
      )
      .filter(
        (d) => showAll || d.state === "ERROR" || retried.includes(d.id),
      ) ?? [];
  return (
    <span
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Dialog
        open
        onClose={onClose}
        title={
          showAll
            ? "Terminalga yuklash holati"
            : "Terminalga yuklashdagi xatolik"
        }
        description="Har bir terminal bo‘yicha joriy holat va suratni yangilash."
      >
        <div className="max-h-[60vh] overflow-y-auto space-y-3 text-sm">
          {(replacePhoto.isPaused || retry.isPaused) && (
            <p role="status" className="text-amber-400">
              Internet uzilgan. So‘rov hali serverga yuborilmadi; sahifa ochiq
              tursa, aloqa tiklanganda davom etadi.
            </p>
          )}
          {details.fetchStatus === "paused" &&
            !details.isPending &&
            !replacePhoto.isPaused &&
            !retry.isPaused && (
              <p role="status" className="text-amber-400">
                Internet uzilgan. Hozir oldingi holat ko‘rsatilmoqda; aloqa
                tiklanganda yangilanadi.
              </p>
            )}

          {replacePhoto.isSuccess && (
            <p role="status" className="text-emerald-500">
              Yangi surat yuz tekshiruvidan o‘tdi va saqlandi. Terminal
              tasdig‘ini quyida kuzating.
            </p>
          )}
          {details.isPending ? (
            <p role="status">
              {details.fetchStatus === "paused"
                ? "Internet uzilgan. Tafsilotlarni olish uchun aloqa tiklanishini kutyapmiz."
                : "Tafsilotlar yuklanmoqda…"}
            </p>
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
                {d.photoUrl && (
                  <RejectedDeliveryPhoto key={d.photoUrl} src={d.photoUrl} />
                )}
                <p
                  className={
                    d.state === "DELIVERED" &&
                    d.revision === d.deliveredRevision
                      ? "text-emerald-500"
                      : d.state === "ERROR"
                        ? "text-red-400"
                        : "text-amber-400"
                  }
                  role="status"
                >
                  {d.state === "ERROR"
                    ? explainTerminalError(d.lastError)
                    : d.state === "DELIVERED" &&
                        d.revision === d.deliveredRevision
                      ? "Shu terminalga yuklangani tasdiqlandi."
                      : d.state === "ACTIVE"
                        ? "Shu terminalga yuborilmoqda…"
                        : "Shu terminalga qayta yuborish navbatda. Bu hali yuklanganini bildirmaydi."}
                </p>
                {d.action === "UPSERT" &&
                  ["ERROR", "DELIVERED"].includes(d.state) && (
                    <div className="space-y-2">
                      {d.state === "ERROR" && (
                        <>
                          <p className="text-xs text-[var(--text-muted)]">
                            Avval sababni tuzating. Qayta yuborishda xodimning
                            hozir saqlangan surati ishlatiladi.
                          </p>
                          {d.currentPhotoUrl !== d.photoUrl && (
                            <p className="text-xs text-amber-400">
                              Profil surati o‘zgargan. Yuqorida navbatda
                              saqlangan surat ko‘rsatilgan.
                            </p>
                          )}
                          <button
                            type="button"
                            className="btn-secondary text-xs px-3 py-2 disabled:opacity-50"
                            disabled={
                              retry.isPending ||
                              replacePhoto.isPending ||
                              !d.currentPhotoUrl
                            }
                            onClick={() => retry.mutate(d.id)}
                          >
                            {retry.isPending && retry.variables === d.id
                              ? retry.isPaused
                                ? "Internet kutilmoqda…"
                                : "Navbatga qo‘shilmoqda…"
                              : "Shu terminalga qayta yuborish"}
                          </button>
                        </>
                      )}
                      <PhotoReplacementForm
                        hospitalId={hospitalId}
                        employeeId={employeeId}
                        deliveryId={d.id}
                        busy={retry.isPending || replacePhoto.isPending}
                        saving={
                          replacePhoto.isPending &&
                          replacePhoto.variables?.deliveryId === d.id
                        }
                        waitingNetwork={replacePhoto.isPaused}
                        error={
                          replacePhoto.isError &&
                          replacePhoto.variables?.deliveryId === d.id
                            ? photoReplacementError(replacePhoto.error)
                            : null
                        }
                        onSave={(file) =>
                          replacePhoto.mutate({ file, deliveryId: d.id })
                        }
                      />
                      {retry.isError && retry.variables === d.id && (
                        <p role="alert" className="text-red-400 text-xs">
                          Qayta yuborishni navbatga qo‘shib bo‘lmadi. Ulanish va
                          joriy holatni tekshirib, qayta urinib ko‘ring.
                        </p>
                      )}
                    </div>
                  )}
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

function PhotoReplacementForm({
  hospitalId,
  employeeId,
  deliveryId,
  busy,
  saving,
  waitingNetwork,
  error,
  onSave,
}: {
  hospitalId: string;
  employeeId: string;
  deliveryId: string;
  busy: boolean;
  saving: boolean;
  /** So'rov internet yo'qligi sababli hali yuborilmagan (react-query paused) */
  waitingNetwork: boolean;
  error: string | null;
  onSave: (file: File) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [checkAttempt, setCheckAttempt] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [check, setCheck] = useState<{
    valid: boolean;
    pending: boolean;
    error: string | null;
  }>({ valid: false, pending: false, error: null });
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setCheck({ valid: false, pending: true, error: null });
    employeesApi
      .validatePhoto(employeeId, file, { targetHospitalId: hospitalId })
      .then((result) => {
        if (!cancelled)
          setCheck({
            valid: result.valid === true,
            pending: false,
            error: result.valid ? null : "Yuz tekshiruvi tasdiqlanmadi.",
          });
      })
      .catch((err) => {
        if (!cancelled)
          setCheck({
            valid: false,
            pending: false,
            error: photoReplacementError(err, "validate"),
          });
      });
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file, employeeId, hospitalId, checkAttempt]);
  return (
    <div className="space-y-2 border-t border-[var(--border)] pt-3">
      <label
        className="block text-xs font-semibold"
        htmlFor={`replace-photo-${deliveryId}`}
      >
        Yangi xodim surati
      </label>
      <input
        id={`replace-photo-${deliveryId}`}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="block w-full text-xs"
        disabled={busy}
        onChange={(event) => {
          const next = event.target.files?.[0];
          event.target.value = "";
          if (!next) return;
          setFile(null);
          setCheck({ valid: false, pending: false, error: null });
          if (!["image/jpeg", "image/png", "image/webp"].includes(next.type)) {
            setCheck({
              valid: false,
              pending: false,
              error: "JPG, PNG yoki WebP formatidagi suratni tanlang.",
            });
            return;
          }
          if (next.size > 10 * 1024 * 1024) {
            setCheck({
              valid: false,
              pending: false,
              error: "Surat hajmi 10 MB dan oshmasin.",
            });
            return;
          }
          setCheck({ valid: false, pending: true, error: null });
          setFile(next);
        }}
      />
      {preview && (
        <figure className="space-y-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Tanlangan yangi surat — hali saqlanmagan"
            className="h-36 w-28 rounded-lg object-contain bg-[var(--bg-hover)]"
          />
          <figcaption className="text-xs text-[var(--text-muted)]">
            Yangi surat — hali saqlanmagan
          </figcaption>
        </figure>
      )}
      {check.pending && (
        <p role="status" className="text-amber-400 text-xs">
          Yuz borligi tekshirilmoqda…
        </p>
      )}
      {check.valid && (
        <p role="status" className="text-emerald-500 text-xs">
          Bitta yuz aniqlandi. Suratni saqlash mumkin.
        </p>
      )}
      {check.error && (
        <div className="space-y-2">
          <p role="alert" className="text-red-400 text-xs">
            {check.error}
          </p>
          {file && (
            <button
              type="button"
              className="text-xs underline"
              disabled={busy || check.pending}
              onClick={() => {
                setCheck({ valid: false, pending: true, error: null });
                setCheckAttempt((n) => n + 1);
              }}
            >
              Yuzni qayta tekshirish
            </button>
          )}
        </div>
      )}
      <button
        type="button"
        className="btn-secondary text-xs px-3 py-2 disabled:opacity-50"
        disabled={!file || !check.valid || check.pending || busy}
        onClick={() => {
          if (file && check.valid && !busy) onSave(file);
        }}
      >
        {saving
          ? waitingNetwork
            ? "Internet kutilmoqda…"
            : "Saqlanmoqda…"
          : "Saqlash va terminalga yuborish"}
      </button>
      {error && (
        <p role="alert" className="text-red-400 text-xs">
          {error}
        </p>
      )}
      <p className="text-xs text-[var(--text-muted)]">
        Surat faqat tugma bosilganda saqlanadi va yuborish navbatiga qo‘shiladi.
        Profil surati boshqa tegishli terminallarda ham yangilanadi.
      </p>
    </div>
  );
}

function RejectedDeliveryPhoto({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="space-y-1">
      {failed ? (
        <p className="text-xs text-[var(--text-muted)]">
          Surat fayli topilmadi yoki ochilmadi.
        </p>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={buildPhotoUrl(src)}
          alt="Terminalga yuborish uchun saqlangan yuz rasmi"
          className="h-36 w-28 rounded-lg object-contain bg-[var(--bg-hover)]"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      )}
      <figcaption className="text-xs text-[var(--text-muted)]">
        Terminalga yuborish uchun saqlangan surat
      </figcaption>
    </figure>
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

function photoReplacementError(
  error: unknown,
  stage: "validate" | "save" = "save",
): string {
  const err = error as {
    message?: string;
    code?: string;
    response?: { data?: { message?: string | string[] } };
  };
  if (err.code === "ECONNABORTED" || (!err.response && err.code))
    return stage === "validate"
      ? "Yuz tekshiruvi uchun serverga ulanib bo‘lmadi yoki javob kechikdi. Surat saqlanmadi va terminalga yuborilmadi. Aloqa tiklangach yuzni qayta tekshiring."
      : "Javob olinmadi. Surat saqlangan bo‘lishi mumkin; oynani qayta ochib joriy holatni tekshiring.";
  const message = err.response?.data?.message;
  return Array.isArray(message)
    ? message.join(" ")
    : message ||
        err.message ||
        "Suratni almashtirib bo‘lmadi. Qayta urinib ko‘ring.";
}
