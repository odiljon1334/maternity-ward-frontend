"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, Check, ExternalLink, Loader2, MapPin, Plus, Search, Trash2 } from "lucide-react";
import { attendanceApi, workSitesApi } from "@/lib/api";
import { useConfirmation } from "@/components/ui";
import { cn, naturalCompare } from "@/lib/utils";
import { matchesSearch } from "@/lib/search";

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
  const [query, setQuery] = useState("");
  const [onlyPicked, setOnlyPicked] = useState(false);

  const sorted = useMemo(
    () => [...(data?.sites ?? [])].sort((a, b) => naturalCompare(a.name, b.name)),
    [data],
  );
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

  const visible = sorted.filter(
    (s) =>
      (!onlyPicked || picked.has(s.id)) &&
      (!query.trim() || matchesSearch(query, [s.name, s.address])),
  );
  const changes =
    Array.from(picked).filter((id) => !initial.has(id)).length +
    Array.from(initial).filter((id) => !picked.has(id)).length;
  const setMany = (ids: string[], on: boolean) =>
    setPicked((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });
  const allVisiblePicked = visible.length > 0 && visible.every((s) => picked.has(s.id));

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
        {/* Sarlavha */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Qayerda check-in qila oladi</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Asosiy bino va tanlangan ish joylarining istalganida (radius ichida).
            </p>
          </div>
          <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-600 dark:text-sky-400">
            {picked.size} / {sorted.length} tanlangan
          </span>
        </div>

        <div className="space-y-4 p-5">
          {/* Asosiy bino */}
          <div
            className={cn(
              "flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3",
              data.hospitalCenter
                ? "border-indigo-500/20 bg-indigo-500/5"
                : "border-amber-500/30 bg-amber-500/5",
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl",
                data.hospitalCenter ? "bg-indigo-500/10 text-indigo-500" : "bg-amber-500/10 text-amber-600",
              )}
            >
              <Building2 className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Asosiy bino</p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {data.hospitalCenter
                  ? `Barcha xodimlar uchun · radius ${data.hospitalCenter.radius ?? "—"} m`
                  : "Hali belgilanmagan — xodimlar faqat ish joylarida check-in qila oladi"}
              </p>
            </div>
            {data.hospitalCenter ? (
              <a
                href={mapLink(data.hospitalCenter.lat, data.hospitalCenter.lng)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-500"
              >
                Xarita <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <Link href="/dashboard/settings?tab=location" className="btn-secondary !rounded-lg !px-3 !py-1.5 !text-xs">
                Belgilash
              </Link>
            )}
          </div>

          {sorted.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-center text-xs text-[var(--text-muted)]">
              Muassasada hali qo&apos;shimcha ish joyi yo&apos;q (maktab, bog&apos;cha, filial...).
            </p>
          ) : (
            <>
              {/* Qidiruv va filtr */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ish joyini qidirish..."
                    className="input-field w-full !pl-9 text-sm"
                  />
                </div>
                <div className="flex rounded-xl border border-[var(--border)] p-0.5 text-xs font-semibold">
                  {[
                    { v: false, label: "Hammasi" },
                    { v: true, label: `Tanlangan (${picked.size})` },
                  ].map((o) => (
                    <button
                      key={String(o.v)}
                      type="button"
                      onClick={() => setOnlyPicked(o.v)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 transition-colors",
                        onlyPicked === o.v
                          ? "bg-indigo-600 text-white"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                {visible.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setMany(visible.map((s) => s.id), !allVisiblePicked)}
                    className="text-xs font-semibold text-indigo-500 hover:underline"
                  >
                    {allVisiblePicked ? "Ko'rinayotganlarni olib tashlash" : "Ko'rinayotganlarni tanlash"}
                  </button>
                )}
              </div>

              {/* Ish joylari — bosib tanlanadigan "pill"lar, qatorga sig'guncha yonma-yon */}
              {visible.length === 0 ? (
                <p className="py-6 text-center text-xs text-[var(--text-muted)]">Hech narsa topilmadi</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {visible.map((s) => {
                    const on = picked.has(s.id);
                    const hint = `${s.name} · radius ${s.gpsRadius} m${s.address ? ` · ${s.address}` : ""}${s.isActive ? "" : " · nofaol"}`;
                    return (
                      <span
                        key={s.id}
                        className={cn(
                          "inline-flex max-w-full items-center rounded-full border text-xs font-semibold transition-all sm:text-[13px]",
                          on
                            ? "border-sky-500 bg-sky-500 text-white shadow-sm shadow-sky-500/25"
                            : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-sky-400/60 hover:bg-sky-500/5",
                          !s.isActive && "border-dashed opacity-60",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => toggle(s.id)}
                          aria-pressed={on}
                          title={hint}
                          className={cn("inline-flex min-w-0 items-center gap-1 py-1.5 pl-2 sm:gap-1.5 sm:pl-2.5", on ? "pr-1" : "pr-2.5 sm:pr-3")}
                        >
                          {on ? (
                            <Check className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={3} />
                          ) : (
                            <Plus className="h-3.5 w-3.5 flex-shrink-0 text-[var(--text-muted)]" />
                          )}
                          <span className="truncate">{s.name}</span>
                          <span className={cn("hidden flex-shrink-0 text-[11px] font-medium sm:inline", on ? "text-white/75" : "text-[var(--text-muted)]")}>
                            {s.gpsRadius} m
                          </span>
                        </button>
                        {on && (
                          <a
                            href={mapLink(s.gpsLat, s.gpsLng)}
                            target="_blank"
                            rel="noreferrer"
                            title="Xaritada ko'rish"
                            aria-label={`${s.name} — xaritada`}
                            className="mr-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full hover:bg-white/20"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Pastki panel — o'zgarish bo'lsa */}
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 border-t border-[var(--border)] px-5 py-3",
            dirty ? "bg-indigo-500/5" : "bg-transparent",
          )}
        >
          {dirty ? (
            <>
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                {changes} ta o&apos;zgarish saqlanmagan
              </span>
              <button
                type="button"
                onClick={() => setPicked(new Set(initial))}
                className="btn-secondary ml-auto !rounded-lg !px-4 !py-2 !text-xs"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => save.mutate()}
                disabled={save.isPending}
                className="btn-primary !gap-1.5 !rounded-lg !px-4 !py-2 !text-xs"
              >
                {save.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Saqlash
              </button>
            </>
          ) : (
            <Link
              href="/dashboard/settings?tab=location"
              className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-indigo-500"
            >
              <Plus className="h-3.5 w-3.5" /> Yangi ish joyi qo&apos;shish
            </Link>
          )}
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
