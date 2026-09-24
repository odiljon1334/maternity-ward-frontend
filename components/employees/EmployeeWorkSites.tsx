"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, CheckSquare, ExternalLink, Loader2, MapPin, Plus, Square, Trash2 } from "lucide-react";
import { attendanceApi, workSitesApi } from "@/lib/api";
import { useConfirmation } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Xodim ro'yxatidagi ish joyi belgisi (employees.workSites dan) */
export function WorkSiteChips({
  sites,
  legacy,
  href,
  compact = false,
}: {
  sites?: { workSite: { id: string; name: string; isActive: boolean } }[] | null;
  legacy?: boolean;
  href: string;
  compact?: boolean;
}) {
  const active = (sites ?? []).map((s) => s.workSite).filter((s) => s?.isActive);
  if (!active.length && !legacy) return null;
  const label = active.length
    ? active.length <= 2 || !compact
      ? active.map((s) => s.name).join(" · ")
      : `${active[0].name} +${active.length - 1}`
    : "Shaxsiy markaz";
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      title={active.length ? `Ish joylari: ${active.map((s) => s.name).join(", ")}` : "Xodimning eski shaxsiy GPS markazi — ko'rib chiqing"}
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
        active.length
          ? "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400"
          : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      )}
    >
      <MapPin className="h-3 w-3 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function mapLink(lat: number, lng: number) {
  return `https://yandex.uz/maps/?pt=${lng},${lat}&z=17&l=map`;
}

/**
 * Xodim sahifasi → "GPS / Ish joylari": xodim qayerda check-in qila olishini
 * ko'rsatadi va ish joylarini shu yerning o'zida biriktirish imkonini beradi
 * (ilgari faqat Sozlamalar → Ish joylari orqali, ish joyi tomonidan).
 */
export function EmployeeWorkSitesPanel({
  employeeId,
  hospitalId,
  canManage,
}: {
  employeeId: string;
  hospitalId?: string | null;
  canManage: boolean;
}) {
  const qc = useQueryClient();
  const { confirm } = useConfirmation();
  const target = hospitalId || undefined;
  const key = ["employee-sites", employeeId];

  const { data, isLoading, isError } = useQuery({
    queryKey: key,
    queryFn: () => workSitesApi.employeeSites(employeeId, target),
    enabled: !!employeeId && canManage,
  });

  const initial = useMemo(
    () => new Set((data?.sites ?? []).filter((s) => s.assigned).map((s) => s.id)),
    [data],
  );
  const [picked, setPicked] = useState<Set<string>>(new Set());
  useEffect(() => setPicked(new Set(initial)), [initial]);
  const dirty =
    picked.size !== initial.size || Array.from(picked).some((id) => !initial.has(id));

  const save = useMutation({
    mutationFn: () => workSitesApi.setEmployeeSites(employeeId, Array.from(picked), target),
    onSuccess: () => {
      toast.success("Ish joylari saqlandi");
      void qc.invalidateQueries({ queryKey: key });
      void qc.invalidateQueries({ queryKey: ["employee", employeeId] });
      void qc.invalidateQueries({ queryKey: ["employees"] });
      void qc.invalidateQueries({ queryKey: ["work-sites"] });
      void qc.invalidateQueries({ queryKey: ["work-site-employees"] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message || "Saqlab bo'lmadi"),
  });

  const resetLegacy = useMutation({
    mutationFn: () => attendanceApi.resetEmployeeGps(employeeId),
    onSuccess: () => {
      toast.success("Shaxsiy markaz tozalandi");
      void qc.invalidateQueries({ queryKey: key });
      void qc.invalidateQueries({ queryKey: ["work-sites-legacy"] });
      void qc.invalidateQueries({ queryKey: ["employee", employeeId] });
      void qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message || "Tozalab bo'lmadi"),
  });

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 text-sm text-[var(--text-muted)]">
        GPS sozlamalarini faqat direktor yoki administrator ko&apos;radi.
      </div>
    );
  }
  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-[var(--bg-hover)]" />;
  }
  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-400" role="alert">
        Ish joylarini yuklab bo&apos;lmadi.
      </div>
    );
  }

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Qayerda check-in qila oladi</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Xodim belgilangan joylarning istalganida (radius ichida) kelish/ketishni belgilay oladi.
          </p>
        </div>

        {/* Asosiy bino — har doim */}
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-hover)] px-4 py-3">
          <Building2 className="h-4 w-4 flex-shrink-0 text-indigo-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Asosiy bino</p>
            <p className="text-[11px] text-[var(--text-muted)]">
              {data.hospitalCenter
                ? `Barcha xodimlar uchun · radius ${data.hospitalCenter.radius ?? "—"} m`
                : "Belgilanmagan — Sozlamalar → Joylashuv bo'limida belgilang"}
            </p>
          </div>
          {data.hospitalCenter && (
            <a href={mapLink(data.hospitalCenter.lat, data.hospitalCenter.lng)} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-indigo-500 inline-flex items-center gap-1">
              Xarita <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Qo'shimcha ish joylari */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--text-muted)]">Qo&apos;shimcha ish joylari</p>
          {data.sites.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-4 text-xs text-[var(--text-muted)]">
              Muassasada hali qo&apos;shimcha ish joyi yo&apos;q (maktab, bog&apos;cha, filial...).
            </p>
          ) : (
            data.sites.map((s) => {
              const on = picked.has(s.id);
              return (
                <div
                  key={s.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                    on ? "border-sky-500/40 bg-sky-500/5" : "border-[var(--border)]",
                    !s.isActive && "opacity-60",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggle(s.id)}
                    aria-pressed={on}
                    aria-label={`${s.name} — ${on ? "biriktirilgan" : "biriktirilmagan"}`}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    {on ? <CheckSquare className="h-4 w-4 flex-shrink-0 text-sky-500" /> : <Square className="h-4 w-4 flex-shrink-0 text-[var(--text-muted)]" />}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
                        {s.name}
                        {!s.isActive && <span className="ml-2 text-[10px] font-bold text-amber-500">nofaol</span>}
                      </span>
                      <span className="block truncate text-[11px] text-[var(--text-muted)]">
                        {s.address ? `${s.address} · ` : ""}radius {s.gpsRadius} m
                      </span>
                    </span>
                  </button>
                  <a href={mapLink(s.gpsLat, s.gpsLng)} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-indigo-500 inline-flex items-center gap-1 flex-shrink-0">
                    Xarita <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {data.sites.length > 0 && (
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={!dirty || save.isPending}
              className="btn-primary py-2 px-4 text-xs gap-1.5"
            >
              {save.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Saqlash
            </button>
          )}
          {dirty && (
            <button type="button" onClick={() => setPicked(new Set(initial))} className="btn-secondary py-2 px-4 text-xs">
              Bekor qilish
            </button>
          )}
          <Link href="/dashboard/settings?tab=location" className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-indigo-500">
            <Plus className="h-3.5 w-3.5" /> Yangi ish joyi qo&apos;shish
          </Link>
        </div>
      </div>

      {data.legacyCenter && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[var(--text-primary)]">Eski shaxsiy markaz</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Xodim o&apos;zi (eski tartibda) belgilagan nuqta · radius {data.legacyCenter.radius ?? "—"} m. U hali ham
                check-in uchun hisoblanadi. To&apos;g&apos;ri bo&apos;lsa — Sozlamalar → Joylashuv&apos;da ish joyi sifatida
                tasdiqlang, noto&apos;g&apos;ri bo&apos;lsa — tozalang.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={mapLink(data.legacyCenter.lat, data.legacyCenter.lng)} target="_blank" rel="noreferrer" className="btn-secondary py-1.5 px-3 text-xs gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" /> Xaritada ko&apos;rish
            </a>
            <button
              type="button"
              disabled={resetLegacy.isPending}
              onClick={() =>
                void confirm({
                  title: "Shaxsiy markaz tozalansinmi?",
                  description: "Xodim endi faqat asosiy bino va biriktirilgan ish joylarida check-in qila oladi.",
                  confirmLabel: "Tozalash",
                  tone: "warning",
                }).then((ok) => ok && resetLegacy.mutate())
              }
              className="btn-secondary py-1.5 px-3 text-xs gap-1.5 text-amber-600"
            >
              <Trash2 className="h-3.5 w-3.5" /> Tozalash
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
