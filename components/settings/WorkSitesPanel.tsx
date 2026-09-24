"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building, Plus, Pencil, Trash2, Users, Search, Check, X, Loader2, MapPinned, ExternalLink,
} from "lucide-react";
import { employeesApi, workSitesApi, type WorkSite, type LegacyCenter } from "@/lib/api";
import { Dialog, useConfirmation } from "@/components/ui";
import { cn, naturalCompare } from "@/lib/utils";
import { matchesSearch } from "@/lib/search";
import { LocationPicker, MAX_PICK_ACCURACY_M, type PickedLocation } from "./LocationPicker";
import { apiErrorText } from "./GeofencePanel";

type ApiError = { response?: { data?: { message?: string | string[] } } };

interface EmployeeHit {
  id: string;
  fullName: string;
  position?: { name: string } | null;
}

/**
 * Ish joylari (FAZA 6, 4b) — muassasa xodimlari yo'naltiriladigan
 * qo'shimcha joylar: maktab, bog'cha, harbiy komissariat, sport zal...
 * Xodim asosiy binoda VA o'ziga biriktirilgan istalgan ish joyida check-in
 * qila oladi.
 *
 * `targetHospitalId` — faqat SUPER/ASSISTANT admin uchun (DIRECTOR/ADMIN
 * uchun backend muassasani JWT'dan oladi).
 */
export function WorkSitesPanel({ targetHospitalId }: { targetHospitalId?: string }) {
  const qc = useQueryClient();
  const { confirm } = useConfirmation();
  const key = ["work-sites", targetHospitalId ?? "me"];
  const legacyKey = ["work-sites-legacy", targetHospitalId ?? "me"];

  const { data: sites = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: () => workSitesApi.list(targetHospitalId),
    staleTime: 30_000,
  });
  const { data: legacy = [] } = useQuery({
    queryKey: legacyKey,
    queryFn: () => workSitesApi.legacyCenters(targetHospitalId),
    staleTime: 60_000,
  });

  const [editing, setEditing] = useState<WorkSite | "new" | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "empty">("all");
  const sorted = useMemo(() => [...sites].sort((a, b) => naturalCompare(a.name, b.name)), [sites]);
  const counts = useMemo(
    () => ({
      all: sites.length,
      active: sites.filter((x) => x.isActive).length,
      inactive: sites.filter((x) => !x.isActive).length,
      empty: sites.filter((x) => x.employeeCount === 0).length,
    }),
    [sites],
  );
  const visible = sorted.filter(
    (x) =>
      (filter === "all" ||
        (filter === "active" && x.isActive) ||
        (filter === "inactive" && !x.isActive) ||
        (filter === "empty" && x.employeeCount === 0)) &&
      (!query.trim() || matchesSearch(query, [x.name, x.address])),
  );
  const [assigning, setAssigning] = useState<WorkSite | null>(null);
  const [approving, setApproving] = useState<LegacyCenter | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: legacyKey });
  };
  const onError = (e: ApiError) => toast.error(apiErrorText(e));

  const toggleMut = useMutation({
    mutationFn: (s: WorkSite) => workSitesApi.update(s.id, { isActive: !s.isActive }, targetHospitalId),
    onSuccess: () => { invalidate(); toast.success("Yangilandi"); },
    onError,
  });
  const removeMut = useMutation({
    mutationFn: (id: string) => workSitesApi.remove(id, targetHospitalId),
    onSuccess: () => { invalidate(); toast.success("Ish joyi o'chirildi"); },
    onError,
  });
  const rejectMut = useMutation({
    mutationFn: (employeeId: string) => workSitesApi.rejectLegacy(employeeId, targetHospitalId),
    onSuccess: () => { invalidate(); toast.success("Shaxsiy markaz o'chirildi"); },
    onError,
  });

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-[var(--text-primary)]">Ish joylari</h3>
          <span className="badge-gray">{sites.length}</span>
        </div>
        <button onClick={() => setEditing("new")} className="btn-primary py-1.5 px-3 text-xs">
          <Plus className="w-3.5 h-3.5" /> Qo&apos;shish
        </button>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Xodimlar yo&apos;naltiriladigan qo&apos;shimcha joylar (maktab, bog&apos;cha, harbiy
          komissariat, sport zal...). Xodim asosiy binoda va o&apos;ziga biriktirilgan istalgan ish
          joyida check-in qila oladi; davomatda qaysi joyda kelgani saqlanadi.
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-36 rounded-2xl bg-[var(--bg-hover)] animate-pulse" />)}
          </div>
        ) : sites.length === 0 ? (
          <div className="text-center py-5 text-sm text-[var(--text-muted)]">
            <MapPinned className="w-7 h-7 mx-auto mb-2 opacity-30" />
            Hali ish joyi qo&apos;shilmagan
          </div>
        ) : (
          <>
            {/* Qidiruv va filtr */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nomi yoki manzili bo'yicha qidirish..."
                  className="input-field w-full !pl-9 text-sm"
                />
              </div>
              <div className="grid w-full grid-cols-4 gap-0.5 rounded-xl border border-[var(--border)] p-0.5 text-xs font-semibold sm:flex sm:w-auto">
                {([
                  ["all", "Hammasi"],
                  ["active", "Faol"],
                  ["inactive", "Nofaol"],
                  ["empty", "Xodimsiz"],
                ] as const).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setFilter(v)}
                    className={cn(
                      "whitespace-nowrap rounded-lg px-2 py-1.5 transition-colors sm:px-3",
                      filter === v
                        ? "bg-indigo-600 text-white"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                    )}
                  >
                    {label} <span className="opacity-70">{counts[v]}</span>
                  </button>
                ))}
              </div>
            </div>

            {visible.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">Hech narsa topilmadi</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((s) => (
                  <div
                    key={s.id}
                    className={cn(
                      "group flex flex-col gap-3 rounded-2xl border bg-[var(--bg-card)] p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-400/40 hover:shadow-md",
                      s.isActive ? "border-[var(--border)]" : "border-dashed border-[var(--border)] opacity-70",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
                          s.isActive ? "bg-indigo-500/10 text-indigo-500" : "bg-[var(--bg-hover)] text-[var(--text-muted)]",
                        )}
                      >
                        <MapPinned className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--text-primary)]" title={s.name}>
                          {s.name}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]" title={s.address ?? undefined}>
                          {s.address || "Manzil kiritilmagan"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleMut.mutate(s)}
                        disabled={toggleMut.isPending}
                        title={s.isActive ? "Nofaol qilish" : "Faollashtirish"}
                        aria-pressed={s.isActive}
                        className={cn(
                          "relative h-5 w-9 flex-shrink-0 rounded-full transition-colors",
                          s.isActive ? "bg-emerald-500" : "bg-[var(--border)]",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
                            s.isActive ? "left-[18px]" : "left-0.5",
                          )}
                        />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                      <span className="rounded-full bg-[var(--bg-hover)] px-2.5 py-1 text-[var(--text-muted)]">
                        radius {s.gpsRadius} m
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1",
                          s.employeeCount > 0
                            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                        )}
                      >
                        {s.employeeCount > 0 ? `${s.employeeCount} xodim` : "xodim biriktirilmagan"}
                      </span>
                      {!s.isActive && (
                        <span className="rounded-full bg-[var(--bg-hover)] px-2.5 py-1 text-[var(--text-muted)]">nofaol</span>
                      )}
                    </div>

                    <div className="mt-auto flex items-center gap-1 border-t border-[var(--border)] pt-3">
                      <button
                        onClick={() => setAssigning(s)}
                        className="btn-secondary !gap-1.5 !rounded-lg !px-3 !py-1.5 !text-xs"
                        title="Xodimlarni biriktirish"
                      >
                        <Users className="h-3.5 w-3.5" /> Xodimlar
                      </button>
                      <a
                        href={`https://yandex.uz/maps/?pt=${s.gpsLng},${s.gpsLat}&z=17&l=map`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost ml-auto p-2"
                        title="Xaritada ko'rish"
                        aria-label="Xaritada ko'rish"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button onClick={() => setEditing(s)} className="btn-ghost p-2" aria-label="Tahrirlash" title="Tahrirlash">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          void confirm({
                            title: "Ish joyi o'chirilsinmi?",
                            description: `«${s.name}» o'chiriladi, xodimlar undan uziladi. O'tgan davomat yozuvlari saqlanadi.`,
                            confirmLabel: "O'chirish",
                            tone: "danger",
                          }).then((ok) => ok && removeMut.mutate(s.id))
                        }
                        className="btn-ghost p-2 text-red-400 hover:bg-red-500/10"
                        aria-label="O'chirish"
                        title="O'chirish"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {legacy.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-[var(--border)]">
            <p className="text-xs font-semibold text-[var(--text-primary)]">
              Tasdiqlanmagan shaxsiy markazlar ({legacy.length})
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              Bu markazlarni xodimlar ilgari o&apos;zlari belgilagan. Ko&apos;rib chiqilguncha ular
              ishlashda davom etadi. To&apos;g&apos;ri joy bo&apos;lsa — ish joyi sifatida saqlang,
              aks holda o&apos;chiring.
            </p>
            {legacy.map((l) => (
              <div
                key={l.employeeId}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--bg-hover)] border border-[var(--border)]"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">
                    {l.fullName}
                    {l.position && <span className="text-[var(--text-muted)]"> · {l.position}</span>}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                    {l.distanceFromMain != null
                      ? `Asosiy binodan ${l.distanceFromMain >= 1000 ? `${(l.distanceFromMain / 1000).toFixed(1)} km` : `${l.distanceFromMain} m`}`
                      : "Asosiy bino belgilanmagan"}
                    <a
                      href={`https://yandex.uz/maps/?pt=${l.gpsLng},${l.gpsLat}&z=17`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-indigo-400 hover:underline ml-1"
                    >
                      xaritada <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                </div>
                <button
                  onClick={() => setApproving(l)}
                  className="btn-secondary py-1 px-2.5 text-xs gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Saqlash
                </button>
                <button
                  onClick={() =>
                    void confirm({
                      title: "Shaxsiy markaz o'chirilsinmi?",
                      description: `${l.fullName} endi faqat asosiy bino va biriktirilgan ish joylarida check-in qila oladi.`,
                      confirmLabel: "O'chirish",
                      tone: "warning",
                    }).then((ok) => ok && rejectMut.mutate(l.employeeId))
                  }
                  className="btn-ghost p-1.5 text-red-400 hover:bg-red-500/10"
                  aria-label="Rad etish"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <WorkSiteDialog
          site={editing === "new" ? null : editing}
          targetHospitalId={targetHospitalId}
          onClose={() => setEditing(null)}
          onSaved={invalidate}
        />
      )}
      {assigning && (
        <AssignEmployeesDialog
          site={assigning}
          targetHospitalId={targetHospitalId}
          onClose={() => setAssigning(null)}
          onSaved={invalidate}
        />
      )}
      {approving && (
        <ApproveLegacyDialog
          center={approving}
          targetHospitalId={targetHospitalId}
          onClose={() => setApproving(null)}
          onSaved={invalidate}
        />
      )}
    </div>
  );
}

// ─── Qo'shish / tahrirlash ─────────────────────────────────────────────────────
function WorkSiteDialog({
  site, targetHospitalId, onClose, onSaved,
}: {
  site: WorkSite | null;
  targetHospitalId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(site?.name ?? "");
  const [address, setAddress] = useState(site?.address ?? "");
  const [radius, setRadius] = useState(site?.gpsRadius ?? 200);
  const [point, setPoint] = useState<PickedLocation | null>(
    site ? { lat: site.gpsLat, lng: site.gpsLng } : null,
  );

  const mut = useMutation({
    mutationFn: () => {
      const body = {
        name: name.trim(),
        address: address.trim() || undefined,
        lat: point!.lat,
        lng: point!.lng,
        radius,
        ...(point?.accuracy !== undefined ? { accuracy: Math.round(point.accuracy) } : {}),
      };
      return site
        ? workSitesApi.update(site.id, body, targetHospitalId)
        : workSitesApi.create(body, targetHospitalId);
    },
    onSuccess: () => {
      onSaved();
      toast.success(site ? "Ish joyi yangilandi" : "Ish joyi qo'shildi");
      onClose();
    },
    onError: (e: ApiError) => toast.error(apiErrorText(e)),
  });

  const radiusValid = radius >= 50 && radius <= 2000;
  const accuracyTooLow = point?.accuracy !== undefined && point.accuracy > MAX_PICK_ACCURACY_M;
  const canSave = name.trim().length >= 2 && !!point && radiusValid && !accuracyTooLow;

  return (
    <Dialog
      open
      onClose={onClose}
      title={site ? "Ish joyini tahrirlash" : "Yangi ish joyi"}
      className="max-w-2xl"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary py-2 px-4 text-sm">Bekor</button>
          <button
            onClick={() => mut.mutate()}
            disabled={!canSave || mut.isPending}
            className="btn-primary py-2 px-4 text-sm gap-1.5"
          >
            {mut.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Saqlash
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs text-[var(--text-muted)] space-y-1">
            <span>Nomi *</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field text-sm"
              placeholder="Masalan: 12-maktab"
              maxLength={120}
            />
          </label>
          <label className="text-xs text-[var(--text-muted)] space-y-1">
            <span>Manzil</span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input-field text-sm"
              placeholder="Ixtiyoriy"
              maxLength={255}
            />
          </label>
        </div>
        <LocationPicker
          value={point}
          onChange={setPoint}
          radius={radiusValid ? radius : undefined}
          height={280}
          search={{
            targetHospitalId,
            // Nom/manzil bo'sh bo'lsa — topilgan joydan to'ldiriladi
            onPlace: (p) => {
              if (p.source === "COORDS") return;
              if (!name.trim()) setName(p.name.slice(0, 120));
              if (!address.trim() && p.address) setAddress(p.address.slice(0, 255));
            },
          }}
        />
        <label className="text-xs text-[var(--text-muted)] space-y-1 block max-w-[200px]">
          <span>Radius (m): 50–2000</span>
          <input
            type="number"
            min={50}
            max={2000}
            step={10}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="input-field text-sm py-1.5"
          />
        </label>
      </div>
    </Dialog>
  );
}

// ─── Xodimlarni biriktirish ────────────────────────────────────────────────────
function AssignEmployeesDialog({
  site, targetHospitalId, onClose, onSaved,
}: {
  site: WorkSite;
  targetHospitalId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<Map<string, string>>(new Map());
  const [search, setSearch] = useState("");

  const { data: current, isLoading } = useQuery({
    queryKey: ["work-site-employees", site.id],
    queryFn: () => workSitesApi.employees(site.id, targetHospitalId),
  });
  useEffect(() => {
    if (current) setSelected(new Map(current.map((e) => [e.id, e.fullName])));
  }, [current]);

  const term = search.trim();
  const { data: found = [], isFetching } = useQuery({
    queryKey: ["work-site-emp-search", targetHospitalId ?? "me", term],
    queryFn: () =>
      employeesApi
        .list({ search: term, limit: 20, ...(targetHospitalId ? { targetHospitalId } : {}) })
        .then((r: { data?: unknown }) => (Array.isArray(r?.data) ? (r.data as EmployeeHit[]) : [])),
    enabled: term.length >= 2,
    staleTime: 15_000,
  });

  const toggle = (id: string, fullName: string) =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, fullName);
      return next;
    });

  const mut = useMutation({
    mutationFn: () => workSitesApi.setEmployees(site.id, Array.from(selected.keys()), targetHospitalId),
    onSuccess: () => {
      onSaved();
      toast.success("Xodimlar saqlandi");
      onClose();
    },
    onError: (e: ApiError) => toast.error(apiErrorText(e)),
  });

  const selectedList = useMemo(
    () => Array.from(selected.entries()).sort((a, b) => a[1].localeCompare(b[1])),
    [selected],
  );

  return (
    <Dialog
      open
      onClose={onClose}
      title={`${site.name} — xodimlar`}
      description="Bu xodimlar shu joyda ham check-in qila oladi (asosiy binodan tashqari)."
      className="max-w-lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary py-2 px-4 text-sm">Bekor</button>
          <button
            onClick={() => mut.mutate()}
            disabled={isLoading || mut.isPending}
            className="btn-primary py-2 px-4 text-sm gap-1.5"
          >
            {mut.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Saqlash ({selected.size})
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field text-sm pl-9"
            placeholder="Xodim ismi bo'yicha qidiring"
            autoFocus
          />
        </div>

        {term.length >= 2 && (
          <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-[var(--border)] p-1">
            {isFetching && found.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] p-2">Qidirilmoqda...</p>
            ) : found.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] p-2">Xodim topilmadi</p>
            ) : (
              found.map((e) => (
                <label
                  key={e.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(e.id)}
                    onChange={() => toggle(e.id, e.fullName)}
                  />
                  <span className="text-sm text-[var(--text-primary)] truncate">{e.fullName}</span>
                  <span className="text-xs text-[var(--text-muted)] truncate">{e.position?.name ?? ""}</span>
                </label>
              ))
            )}
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-[var(--text-primary)] mb-1.5">
            Biriktirilganlar ({selected.size})
          </p>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
          ) : selectedList.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">Hali hech kim biriktirilmagan</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
              {selectedList.map(([id, fullName]) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-hover)] px-2.5 py-1 text-xs text-[var(--text-primary)]"
                >
                  {fullName}
                  <button onClick={() => toggle(id, fullName)} aria-label={`${fullName}ni olib tashlash`}>
                    <X className="w-3 h-3 text-[var(--text-muted)] hover:text-red-400" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}

// ─── Eski shaxsiy markazni ish joyiga aylantirish ──────────────────────────────
function ApproveLegacyDialog({
  center, targetHospitalId, onClose, onSaved,
}: {
  center: LegacyCenter;
  targetHospitalId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [radius, setRadius] = useState(Math.max(100, center.gpsRadius));
  const mut = useMutation({
    mutationFn: () => workSitesApi.approveLegacy(center.employeeId, { name: name.trim(), radius }, targetHospitalId),
    onSuccess: () => {
      onSaved();
      toast.success("Ish joyi yaratildi va xodimga biriktirildi");
      onClose();
    },
    onError: (e: ApiError) => toast.error(apiErrorText(e)),
  });
  const radiusValid = radius >= 50 && radius <= 2000;

  return (
    <Dialog
      open
      onClose={onClose}
      title="Ish joyi sifatida saqlash"
      description={`${center.fullName} belgilagan nuqta yangi ish joyiga aylanadi va xodim unga biriktiriladi. Keyin bu joyga boshqa xodimlarni ham biriktirish mumkin.`}
      className="max-w-lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary py-2 px-4 text-sm">Bekor</button>
          <button
            onClick={() => mut.mutate()}
            disabled={name.trim().length < 2 || !radiusValid || mut.isPending}
            className="btn-primary py-2 px-4 text-sm gap-1.5"
          >
            {mut.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Saqlash
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <LocationPicker
          value={{ lat: center.gpsLat, lng: center.gpsLng }}
          onChange={() => undefined}
          radius={radiusValid ? radius : undefined}
          height={220}
          readOnly
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs text-[var(--text-muted)] space-y-1">
            <span>Ish joyi nomi *</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field text-sm"
              placeholder="Masalan: 5-bog'cha"
              autoFocus
              maxLength={120}
            />
          </label>
          <label className="text-xs text-[var(--text-muted)] space-y-1">
            <span>Radius (m)</span>
            <input
              type="number"
              min={50}
              max={2000}
              step={10}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="input-field text-sm"
            />
          </label>
        </div>
      </div>
    </Dialog>
  );
}
