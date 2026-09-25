"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, Check, ExternalLink, Loader2, MapPin, MapPinned, Plus, Search, Trash2, X } from "lucide-react";
import { attendanceApi, workSitesApi, type EmployeeSites } from "@/lib/api";
import { Dialog, useConfirmation } from "@/components/ui";
import { GeofencePanel } from "@/components/settings/GeofencePanel";
import { useAuthStore } from "@/stores/auth";
import { cn, naturalCompare } from "@/lib/utils";
import { matchesSearch } from "@/lib/search";

/**
 * Xodim ro'yxatidagi ish joyi belgisi (employees.workSites dan) — ism va
 * telefon ostida kichik matn qatori (ilgari qator o'rtasidagi katta pill edi).
 */
export function WorkSiteChips({
  sites,
  legacy,
  href,
  variant = "line",
}: {
  sites?: { workSite: { id: string; name: string; isActive: boolean } }[] | null;
  legacy?: boolean;
  href: string;
  compact?: boolean;
  /** Profil sarlavhasidagi boshqa belgilar bilan bir xil ko'rinish */
  variant?: "line" | "tag";
}) {
  const active = (sites ?? []).map((s) => s.workSite).filter((s) => s?.isActive);
  if (!active.length && !legacy) return null;
  const label = active.length
    ? active.length === 1
      ? active[0].name
      : `${active.length} ta ish joyi`
    : "Shaxsiy GPS markaz";
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      title={active.length ? `Ish joylari: ${active.map((s) => s.name).join(", ")}` : "Xodimning eski shaxsiy GPS markazi — ko'rib chiqing"}
      className={cn(
        variant === "tag"
          ? "flex max-w-[280px] items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 hover:border-sky-400/60 dark:border-slate-700/50 dark:bg-slate-800/60"
          : "mt-1 inline-flex max-w-[260px] items-center gap-1 text-[11px] font-semibold hover:underline",
        variant === "line" &&
          (active.length ? "text-sky-600 dark:text-sky-400" : "text-amber-600 dark:text-amber-400"),
      )}
    >
      <MapPin
        className={cn(
          "flex-shrink-0",
          variant === "tag" ? "h-3.5 w-3.5" : "h-3 w-3",
          variant === "tag" && (active.length ? "text-sky-600 dark:text-sky-400" : "text-amber-600"),
        )}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function mapLink(lat: number, lng: number) {
  return `https://yandex.uz/maps/?pt=${lng},${lat}&z=17&l=map`;
}

type Site = EmployeeSites["sites"][number];

/**
 * Xodim sahifasi → "GPS / Ish joylari": xodim qayerda check-in qila olishi.
 * Biriktirilgan ish joylari kartalar ko'rinishida; yangi joy "Biriktirish"
 * oynasi orqali qidirib tanlanadi. O'zgarish darhol saqlanadi.
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
  const role = useAuthStore((s) => s.user?.role);
  const target = hospitalId || undefined;
  const key = ["employee-sites", employeeId];
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mainOpen, setMainOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: key,
    queryFn: () => workSitesApi.employeeSites(employeeId, target),
    enabled: !!employeeId && canManage,
    staleTime: 0,
  });

  const sorted = useMemo(
    () => [...(data?.sites ?? [])].sort((a, b) => naturalCompare(a.name, b.name)),
    [data],
  );
  const assigned = sorted.filter((s) => s.assigned);
  const available = sorted.filter((s) => !s.assigned);

  const save = useMutation({
    mutationFn: (ids: string[]) => workSitesApi.setEmployeeSites(employeeId, ids, target),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<EmployeeSites>(key);
      if (prev) {
        const set = new Set(ids);
        qc.setQueryData<EmployeeSites>(key, {
          ...prev,
          sites: prev.sites.map((s) => ({ ...s, assigned: set.has(s.id) })),
        });
      }
      return { prev };
    },
    onError: (e: { response?: { data?: { message?: string } } }, _ids, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error(e?.response?.data?.message || "Saqlab bo'lmadi");
    },
    onSuccess: () => toast.success("Ish joylari yangilandi"),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: key });
      void qc.invalidateQueries({ queryKey: ["employee", employeeId] });
      void qc.invalidateQueries({ queryKey: ["employees"] });
      void qc.invalidateQueries({ queryKey: ["work-sites"] });
      void qc.invalidateQueries({ queryKey: ["work-site-employees"] });
    },
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

  const ids = assigned.map((s) => s.id);
  const remove = (id: string) => save.mutate(ids.filter((x) => x !== id));
  // Asosiy binoni shu yerning o'zida belgilash (Sozlamalarga o'tmasdan)
  // SUPER/ASSISTANT admin xodimning muassasasi uchun belgilaydi
  const superLike = role === "SUPER_ADMIN" || role === "ASSISTANT_ADMIN";
  const canSetMainHere =
    role === "DIRECTOR" || role === "ADMIN" || (superLike && !!hospitalId);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-6">
        <div className="mb-5">
          <h3 className="text-base font-bold text-[var(--text-primary)]">Check-in joylari</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Xodim shu joylarning istalganida (radius ichida) kelish va ketishni belgilay oladi.
          </p>
        </div>

        {/* Asosiy bino */}
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] pb-5">
          <span
            className={cn(
              "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl",
              data.hospitalCenter ? "bg-indigo-500/10 text-indigo-500" : "bg-amber-500/10 text-amber-600",
            )}
          >
            <Building2 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Asosiy bino</p>
            <p className="text-xs text-[var(--text-muted)]">
              {data.hospitalCenter
                ? `Barcha xodimlar uchun · radius ${data.hospitalCenter.radius ?? "—"} m`
                : "Belgilanmagan — hozircha faqat biriktirilgan ish joylarida check-in qilinadi"}
            </p>
          </div>
          {data.hospitalCenter && (
            <a
              href={mapLink(data.hospitalCenter.lat, data.hospitalCenter.lng)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-indigo-500 hover:bg-indigo-500/10"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Xarita
            </a>
          )}
          {canSetMainHere ? (
            <button
              type="button"
              onClick={() => setMainOpen(true)}
              className="inline-flex h-9 items-center rounded-xl border border-[var(--border)] px-3 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            >
              {data.hospitalCenter ? "O'zgartirish" : "Belgilash"}
            </button>
          ) : (
            <Link
              href="/dashboard/settings?tab=location"
              className="inline-flex h-9 items-center rounded-xl border border-[var(--border)] px-3 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            >
              Sozlamalar
            </Link>
          )}
        </div>

        {/* Biriktirilgan ish joylari */}
        <div className="pt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Qo&apos;shimcha ish joylari
              <span className="ml-2 rounded-full bg-[var(--bg-hover)] px-2 py-0.5 text-xs font-bold text-[var(--text-muted)]">
                {assigned.length}
              </span>
            </p>
            {sorted.length > 0 && (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                disabled={available.length === 0}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" /> Biriktirish
              </button>
            )}
          </div>

          {sorted.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
              <MapPinned className="mx-auto mb-2 h-7 w-7 text-[var(--text-muted)] opacity-40" />
              <p className="text-sm text-[var(--text-muted)]">Muassasada hali qo&apos;shimcha ish joyi yo&apos;q</p>
              <Link href="/dashboard/settings?tab=location" className="mt-2 inline-block text-xs font-semibold text-indigo-500 hover:underline">
                Ish joyi qo&apos;shish
              </Link>
            </div>
          ) : assigned.length === 0 ? (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="w-full rounded-2xl border border-dashed border-[var(--border)] px-4 py-8 text-center transition hover:border-indigo-400/60 hover:bg-indigo-500/5"
            >
              <MapPinned className="mx-auto mb-2 h-7 w-7 text-indigo-400 opacity-60" />
              <p className="text-sm font-medium text-[var(--text-primary)]">Ish joyi biriktirilmagan</p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Maktab, bog&apos;cha yoki filialni tanlash uchun bosing
              </p>
            </button>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {assigned.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3.5 transition hover:border-indigo-400/40 hover:shadow-sm",
                    !s.isActive && "opacity-60",
                  )}
                >
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    <MapPinned className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--text-primary)]" title={s.name}>
                      {s.name}
                    </p>
                    <p className="truncate text-xs text-[var(--text-muted)]">
                      {!s.isActive && <span className="font-semibold text-amber-500">nofaol · </span>}
                      radius {s.gpsRadius} m{s.address ? ` · ${s.address}` : ""}
                    </p>
                  </div>
                  <a
                    href={mapLink(s.gpsLat, s.gpsLng)}
                    target="_blank"
                    rel="noreferrer"
                    title="Xaritada ko'rish"
                    aria-label={`${s.name} — xaritada`}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-indigo-500/10 hover:text-indigo-500"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => remove(s.id)}
                    disabled={save.isPending}
                    title="Olib tashlash"
                    aria-label={`${s.name} — olib tashlash`}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
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

      {pickerOpen && (
        <SitePicker
          sites={available}
          saving={save.isPending}
          onClose={() => setPickerOpen(false)}
          onAdd={(picked) =>
            save.mutate([...ids, ...picked], { onSuccess: () => setPickerOpen(false) })
          }
        />
      )}

      {mainOpen && (
        <Dialog
          open
          onClose={() => {
            setMainOpen(false);
            void qc.invalidateQueries({ queryKey: key });
          }}
          title="Asosiy bino"
          description="Muassasa binosini xaritada belgilang va saqlang — barcha xodimlar uchun amal qiladi."
          className="sm:!w-[min(100%,44rem)]"
        >
          <GeofencePanel
            embedded
            hospitalId={superLike ? hospitalId ?? undefined : undefined}
            onSaved={() => void qc.invalidateQueries({ queryKey: key })}
          />
        </Dialog>
      )}
    </div>
  );
}

/** Ish joylarini qidirib tanlash oynasi */
function SitePicker({
  sites,
  saving,
  onClose,
  onAdd,
}: {
  sites: Site[];
  saving: boolean;
  onClose: () => void;
  onAdd: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const visible = sites.filter((s) => !query.trim() || matchesSearch(query, [s.name, s.address]));
  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Dialog
      open
      onClose={onClose}
      title="Ish joyi biriktirish"
      description="Bir nechtasini tanlashingiz mumkin."
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">
            Bekor qilish
          </button>
          <button
            type="button"
            disabled={picked.size === 0 || saving}
            onClick={() => onAdd(Array.from(picked))}
            className="btn-primary gap-1.5 px-4 py-2 text-sm disabled:opacity-40"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Biriktirish{picked.size ? ` (${picked.size})` : ""}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nomi yoki manzili bo'yicha qidirish..."
            className="input-field w-full !pl-9"
          />
        </div>
        <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
          {visible.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">Hech narsa topilmadi</p>
          ) : (
            visible.map((s) => {
              const on = picked.has(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(s.id)}
                  aria-pressed={on}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                    on ? "bg-indigo-500/[0.07]" : "hover:bg-[var(--bg-hover)]",
                    !s.isActive && "opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors",
                      on ? "border-indigo-600 bg-indigo-600 text-white" : "border-[var(--border)]",
                    )}
                  >
                    {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--text-primary)]">{s.name}</span>
                    <span className="block truncate text-xs text-[var(--text-muted)]">
                      {!s.isActive && "nofaol · "}radius {s.gpsRadius} m{s.address ? ` · ${s.address}` : ""}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </Dialog>
  );
}
