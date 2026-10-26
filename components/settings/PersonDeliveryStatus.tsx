"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  hikvisionApi,
  photoUrl,
  type PersonDeliveryFilter,
  type TerminalSyncJob,
} from "@/lib/api";
import { toast } from "sonner";

const states: Record<string, string> = {
  WAITING: "Kutmoqda",
  ACTIVE: "Yuborilmoqda",
  DELIVERED: "Tasdiqlandi",
  ERROR: "Xatolik",
};
const actions: Record<string, string> = {
  UPSERT: "Qo‘shish / yangilash",
  BLOCK: "Bloklash",
  DELETE: "O‘chirish",
};
const filters: { key: PersonDeliveryFilter; label: string; color: string }[] = [
  { key: "DELIVERED", label: "Yuklangan", color: "text-emerald-400" },
  { key: "WAITING", label: "Kutmoqda", color: "text-sky-400" },
  { key: "ERROR", label: "Xatolik", color: "text-red-400" },
  { key: "NO_PHOTO", label: "Rasmsiz", color: "text-amber-400" },
];

function DeliveryPhoto({
  src,
  name,
  sent,
}: {
  src: string;
  name: string;
  sent: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <p className="text-[var(--text-muted)]">
        Surat fayli topilmadi yoki ochilmadi.
      </p>
    );
  return (
    <figure className="space-y-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${name} — profil surati`}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-40 w-32 object-contain rounded-lg bg-[var(--bg-hover)]"
        onError={() => setFailed(true)}
      />
      <figcaption className="text-[var(--text-muted)]">
        {sent
          ? "Yuborishda ishlatilgan profil surati"
          : "Hozirgi profil surati"}
      </figcaption>
    </figure>
  );
}

export function PersonDeliveryStatus({
  hospitalId,
  employeeId,
  job,
}: {
  hospitalId?: string;
  employeeId?: string;
  job?: TerminalSyncJob | null;
}) {
  const [filter, setFilter] = useState<PersonDeliveryFilter>("ALL");
  const [page, setPage] = useState(1);
  const [opened, setOpened] = useState<string | null>(null);
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["person-deliveries", hospitalId, employeeId, filter, page],
    queryFn: () =>
      hikvisionApi.personDeliveryPeople(hospitalId!, employeeId, filter, page),
    enabled: !!hospitalId,
    refetchInterval: (q) =>
      job?.state === "RUNNING" || (q.state.data?.counts.WAITING ?? 0) > 0
        ? 3000
        : false,
    retry: 1,
  });
  const retry = useMutation({
    mutationFn: (id: string) =>
      hikvisionApi.retryPersonDelivery(hospitalId!, id),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["person-deliveries", hospitalId],
      });
    },
    onError: () => toast.error("Qayta yuborib bo‘lmadi"),
  });
  if (!hospitalId) return null;
  const data = query.data;
  const select = (next: PersonDeliveryFilter) => {
    setFilter(next);
    setPage(1);
    setOpened(null);
  };
  return (
    <section
      className="rounded-xl border border-[var(--border)] bg-[var(--bg-hover)] p-4 space-y-3"
      aria-label="Terminalga yuklash holati"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Terminalga yuklash natijasi</p>
        <button
          type="button"
          className="text-xs underline text-[var(--text-muted)]"
          aria-pressed={filter === "ALL"}
          onClick={() => select("ALL")}
        >
          Barchasi
        </button>
      </div>
      {job?.state === "RUNNING" && (
        <p role="status" className="text-xs text-[var(--text-muted)]">
          Vazifalar tayyorlanmoqda. Oynani yopish mumkin.
        </p>
      )}
      {job?.state === "FAILED" && (
        <p role="alert" className="text-xs text-red-400">
          {job.message || "Sinxronlashni boshlab bo‘lmadi."}
        </p>
      )}
      {query.isLoading && (
        <p role="status" className="text-xs">
          Yuklanmoqda…
        </p>
      )}
      {query.isError && (
        <p role="alert" className="text-xs text-red-400">
          Natijani olib bo‘lmadi.{" "}
          <button
            type="button"
            className="underline"
            onClick={() => void query.refetch()}
          >
            Qayta tekshirish
          </button>
        </p>
      )}
      {data && (
        <>
          <div className="grid grid-cols-4 gap-2">
            {filters.map((f) => (
              <button
                type="button"
                key={f.key}
                aria-pressed={filter === f.key}
                onClick={() => select(f.key)}
                className={`rounded-lg border py-2 text-center ${filter === f.key ? "border-indigo-400 bg-indigo-500/10" : "border-transparent bg-[var(--bg-card)]"}`}
              >
                <span className={`block text-lg font-bold ${f.color}`}>
                  {data.counts[f.key]}
                </span>
                <span className="block text-[10px] text-[var(--text-muted)]">
                  {f.label}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            {data.counts.DELIVERED} ta xodim muvaffaqiyatli yuklandi.{" "}
            {data.counts.NO_PHOTO} ta xodim rasmsiz.
          </p>
          {filter === "NO_PHOTO" && (
            <p className="text-xs text-amber-400">
              Rasmsizlar yuborilmaydi. Surat qo‘shilgach avtomatik navbatga
              tushadi.
            </p>
          )}
          {!data.employees.length && (
            <p className="text-xs text-[var(--text-muted)]">
              Bu filtr bo‘yicha xodim yo‘q.
            </p>
          )}
          <div className="max-h-80 overflow-y-auto space-y-2">
            {data.employees.map((employee) => {
              const failed = employee.deliveries.some(
                (d) => d.state === "ERROR",
              );
              const expanded = opened === employee.id;
              return (
                <article
                  key={employee.id}
                  className="rounded-lg bg-[var(--bg-card)] p-3 text-xs space-y-2"
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setOpened(expanded ? null : employee.id)}
                    aria-expanded={expanded}
                  >
                    <span className="block font-medium">
                      {employee.fullName}
                    </span>
                    <span className="block text-[var(--text-muted)] mt-1">
                      Bo‘lim: {employee.department || "—"} · Lavozim:{" "}
                      {employee.position || "—"}
                    </span>
                    {filter !== "NO_PHOTO" && (
                      <span
                        className={`block mt-1 ${failed ? "text-red-400" : "text-[var(--text-muted)]"}`}
                      >
                        {!employee.photoUrl && !employee.deliveries.length
                          ? "Rasmsiz"
                          : failed
                            ? "Xatolik — sababini ko‘rish"
                            : employee.deliveries
                                .map(
                                  (d) =>
                                    `${d.terminalName}: ${d.state === "DELIVERED" && d.action === "UPSERT" ? "Yuklandi" : (states[d.state] ?? d.state)}`,
                                )
                                .join(" · ")}
                      </span>
                    )}
                  </button>
                  {expanded && (
                    <div className="space-y-3 border-t border-[var(--border)] pt-2">
                      <Link
                        href={`/dashboard/employees/${employee.id}`}
                        className="inline-block underline"
                      >
                        Xodim profili
                        {employee.employeeNo ? ` · ${employee.employeeNo}` : ""}
                      </Link>
                      {employee.deliveries.map((d) => {
                        const image = d.photoUrl || employee.photoUrl;
                        const safeImage = image?.startsWith("/uploads/")
                          ? photoUrl(image)
                          : undefined;
                        return (
                          <div key={d.id} className="space-y-2">
                            <p>
                              {d.terminalName} · {actions[d.action] ?? d.action}{" "}
                              · {states[d.state] ?? d.state}
                            </p>
                            {d.lastError && (
                              <p className="text-red-400 break-words">
                                {d.lastError.replace(/^(ERROR|WAIT):/, "")}
                              </p>
                            )}
                            {d.state === "ERROR" && d.action === "UPSERT" && (
                              <>
                                {safeImage ? (
                                  <DeliveryPhoto
                                    key={safeImage}
                                    src={safeImage}
                                    name={employee.fullName}
                                    sent={!!d.photoUrl}
                                  />
                                ) : (
                                  <p className="text-[var(--text-muted)]">
                                    Yuborilgan suratni ko‘rsatish imkoni yo‘q.
                                  </p>
                                )}
                              </>
                            )}
                            {d.state === "ERROR" && (
                              <button
                                type="button"
                                className="underline"
                                disabled={retry.isPending}
                                onClick={() => retry.mutate(d.id)}
                              >
                                Qayta yuborish
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          {data.total > 30 && (
            <div className="flex justify-between text-xs">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setPage(page - 1);
                  setOpened(null);
                }}
              >
                Oldingi
              </button>
              <span>
                {page} / {Math.ceil(data.total / 30)}
              </span>
              <button
                type="button"
                disabled={page * 30 >= data.total}
                onClick={() => {
                  setPage(page + 1);
                  setOpened(null);
                }}
              >
                Keyingi
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
