"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  CalendarRange,
  ChevronRight,
  Clock3,
  Hospital,
  Loader2,
  LockKeyhole,
  MapPin,
  Navigation,
  RefreshCw,
  ShieldCheck,
  Siren,
  UserRoundCheck,
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { StatePanel } from "@/components/ui";
import { operationalCenterApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { cn, isSuperLike } from "@/lib/utils";

type ModeKey = "STANDARD" | "POST_COVERAGE" | "FLEXIBLE";
type RiskLevel = "CRITICAL" | "WARNING" | "SAFE";

type Candidate = {
  employeeId: string;
  fullName: string;
  departmentName: string | null;
  positionName: string | null;
  reason: string;
};

type RiskItem = {
  id: string;
  level: RiskLevel;
  kind: string;
  unitName: string;
  departmentName: string | null;
  title: string;
  description: string;
  employeeId?: string;
  employeeName?: string;
  startsAt?: string | null;
  evidence: Array<{ label: string; value: string }>;
  candidates?: Candidate[];
  action: { label: string; href: string };
};

type ModeData = {
  enabled: boolean;
  disabledReason?: string;
  metrics: { critical: number; warning: number; safe: number; monitored: number };
  items: RiskItem[];
};

type Overview = {
  hospital: { id: string; name: string; schedulePlanningMode: string };
  generatedAt: string;
  range: { start: string; end: string };
  modes: Record<ModeKey, ModeData>;
};

const MODE_META: Record<ModeKey, { label: string; short: string; description: string; icon: typeof CalendarCheck2 }> = {
  STANDARD: {
    label: "Oddiy grafik",
    short: "Grafik",
    description: "Grafik, davomat va smena almashish asosida",
    icon: CalendarCheck2,
  },
  POST_COVERAGE: {
    label: "24/7 postlar",
    short: "24/7",
    description: "Faqat post rejimi yoqilgan muassasalar uchun",
    icon: Hospital,
  },
  FLEXIBLE: {
    label: "Flexible / GPS",
    short: "GPS",
    description: "Mobil check-in va joylashuv signallari asosida",
    icon: Navigation,
  },
};

const LEVEL_META: Record<RiskLevel, { label: string; icon: typeof Siren; badge: string; line: string }> = {
  CRITICAL: {
    label: "Kritik",
    icon: Siren,
    badge: "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300",
    line: "bg-rose-500",
  },
  WARNING: {
    label: "Diqqat",
    icon: AlertTriangle,
    badge: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    line: "bg-amber-500",
  },
  SAFE: {
    label: "Xavfsiz",
    icon: BadgeCheck,
    badge: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    line: "bg-emerald-500",
  },
};

function formatDateRange(start: string, end: string) {
  const format = (value: string) =>
    new Intl.DateTimeFormat("uz-UZ", { day: "numeric", month: "short" }).format(new Date(`${value}T00:00:00`));
  return `${format(start)} – ${format(end)}`;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Siren;
  tone: "rose" | "amber" | "emerald" | "indigo";
}) {
  const tones = {
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
  };
  return (
    <article className="ui-surface flex min-w-0 items-center gap-3 p-4 shadow-sm">
      <span className={cn("grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl", tones[tone])}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold text-[var(--text-muted)]">{label}</p>
        <p className="mt-0.5 text-2xl font-black tracking-tight text-[var(--text-primary)]">{value}</p>
      </div>
    </article>
  );
}

function RiskRow({ item, active, onClick }: { item: RiskItem; active: boolean; onClick: () => void }) {
  const meta = LEVEL_META[item.level];
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group grid w-full grid-cols-[5px_minmax(0,.8fr)_minmax(0,1.35fr)_auto_20px] items-center gap-3 border-b border-[var(--border)] px-4 py-4 text-left last:border-b-0 hover:bg-[var(--bg-hover)]",
        active && "bg-indigo-500/[0.06] shadow-[inset_3px_0_0_#6366f1]",
      )}
    >
      <span className={cn("h-10 w-1 rounded-full", meta.line)} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-[var(--text-primary)]">{item.unitName}</span>
        <span className="mt-0.5 block truncate text-[11px] text-[var(--text-muted)]">{item.departmentName || "—"}</span>
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold leading-5 text-[var(--text-primary)]">{item.title}</span>
        <span className="mt-0.5 line-clamp-1 text-[11px] text-[var(--text-muted)]">{item.description}</span>
      </span>
      <span className={cn("hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold sm:inline-flex", meta.badge)}>
        <Icon className="h-3 w-3" /> {meta.label}
      </span>
      <ChevronRight className="h-4 w-4 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function DetailPanel({ item, mode }: { item: RiskItem; mode: ModeKey }) {
  const meta = LEVEL_META[item.level];
  const Icon = meta.icon;
  return (
    <aside className="ui-surface overflow-hidden shadow-sm">
      <div className="bg-gradient-to-br from-[#27215f] via-[#4338a8] to-indigo-600 px-5 py-5 text-white">
        <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.16em] text-indigo-200">
          <Icon className="h-4 w-4" /> Xavf tafsiloti
        </p>
        <h2 className="mt-2 text-lg font-black leading-snug tracking-tight">{item.title}</h2>
        <p className="mt-2 text-xs leading-relaxed text-indigo-100">{item.description}</p>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2">
          {item.evidence.map((fact) => (
            <div key={`${fact.label}-${fact.value}`} className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3 last:col-span-2">
              <span className="block text-[10px] font-semibold text-[var(--text-muted)]">{fact.label}</span>
              <strong className="mt-1 block text-xs text-[var(--text-primary)]">{fact.value}</strong>
            </div>
          ))}
        </div>

        {item.candidates?.length ? (
          <div className="mt-5">
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-[var(--text-muted)]">Ehtimoliy o‘rnini bosuvchilar</p>
            <div className="space-y-2">
              {item.candidates.map((candidate) => (
                <div key={candidate.employeeId} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
                  <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-cyan-500/10 text-xs font-black text-cyan-700 dark:text-cyan-300">
                    {candidate.fullName.split(" ").map((part) => part[0]).slice(0, 2).join("")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-xs text-[var(--text-primary)]">{candidate.fullName}</strong>
                    <span className="mt-0.5 block text-[10px] leading-relaxed text-[var(--text-muted)]">{candidate.reason}</span>
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-extrabold text-emerald-700 dark:text-emerald-300">Mos</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.06] p-3 text-[10px] leading-relaxed text-[var(--text-muted)]">
          <LockKeyhole className="h-4 w-4 flex-shrink-0 text-indigo-500" />
          <span>
            Kadr inspektori (ADMIN) qoralamani tayyorlab, tasdiqlashga yuboradi.
            Rahbar (DIRECTOR) shu Post reja sahifasida yuborilgan rejani tasdiqlaydi yoki rad etadi.
            Tasdiqqacha amaldagi grafik va davomat o‘zgarmaydi.
          </span>
        </div>

        <div className="mt-4">
          <Link href={item.action.href} className="btn-primary min-h-11 w-full text-xs">
            {item.action.label} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {mode === "FLEXIBLE" ? (
          <p className="mt-3 text-[10px] leading-relaxed text-[var(--text-muted)]">
            GPS signalining uzilishi xodim ish joyidan ketganini o‘zi tasdiqlamaydi.
          </p>
        ) : null}
      </div>
    </aside>
  );
}

export default function OperationalCenterPage() {
  const { user, selectedHospital } = useAuthStore();
  const targetHospitalId = isSuperLike(user?.role) ? selectedHospital?.id : undefined;
  const needsHospitalSelection = isSuperLike(user?.role) && !targetHospitalId;
  const [mode, setMode] = useState<ModeKey>("STANDARD");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const query = useQuery<Overview>({
    queryKey: ["operational-center", targetHospitalId, user?.hospitalId],
    queryFn: () => operationalCenterApi.overview(targetHospitalId ? { targetHospitalId } : undefined),
    enabled: !needsHospitalSelection && (!!targetHospitalId || !!user?.hospitalId),
    refetchInterval: 60_000,
  });

  const modeData = query.data?.modes[mode];
  const selected = useMemo(
    () => modeData?.items.find((item) => item.id === selectedId) ?? modeData?.items[0] ?? null,
    [modeData, selectedId],
  );

  useEffect(() => {
    setSelectedId(null);
  }, [mode, targetHospitalId]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Topbar title="Operativ markaz" subtitle="Xavflarni oldindan aniqlang va ish uzluksizligini boshqaring" />
      <div className="mx-auto max-w-[1500px] space-y-4 p-4 lg:p-6">
        {needsHospitalSelection ? (
          <StatePanel
            title="Muassasani tanlang"
            description="Operativ ma’lumotlarni ko‘rish uchun yuqoridagi paneldan muassasani tanlang."
            icon={Hospital}
          />
        ) : query.isLoading ? (
          <StatePanel kind="loading" title="Operativ holat tahlil qilinmoqda" description="Grafik, davomat, post reja va GPS signallari tekshirilmoqda." />
        ) : query.isError || !query.data ? (
          <StatePanel
            kind="error"
            title="Operativ ma’lumotlarni olib bo‘lmadi"
            description="Tarmoqni tekshirib, qayta urinib ko‘ring."
            actionLabel="Qayta urinish"
            onAction={() => query.refetch()}
            actionLoading={query.isFetching}
          />
        ) : (
          <>
            <section className="ui-surface flex flex-col gap-3 p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--bg-secondary)] p-1">
                {(Object.keys(MODE_META) as ModeKey[]).map((key) => {
                  const entry = MODE_META[key];
                  const Icon = entry.icon;
                  const enabled = query.data?.modes[key].enabled !== false;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMode(key)}
                      className={cn(
                        "flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-xs font-bold transition",
                        mode === key ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]",
                        !enabled && "opacity-60",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{entry.label}</span>
                      <span className="sm:hidden">{entry.short}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-3 lg:justify-end">
                <span className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">
                  <CalendarRange className="h-4 w-4 text-indigo-500" /> {formatDateRange(query.data.range.start, query.data.range.end)}
                </span>
                <button
                  type="button"
                  onClick={() => query.refetch()}
                  disabled={query.isFetching}
                  className="btn-secondary min-h-9 px-3"
                  title="Yangilash"
                >
                  {query.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </button>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard label="Kritik xavf" value={modeData?.metrics.critical ?? 0} icon={Siren} tone="rose" />
              <MetricCard label="Diqqat talab" value={modeData?.metrics.warning ?? 0} icon={AlertTriangle} tone="amber" />
              <MetricCard label="Xavfsiz" value={modeData?.metrics.safe ?? 0} icon={BadgeCheck} tone="emerald" />
              <MetricCard label="Nazoratda" value={modeData?.metrics.monitored ?? 0} icon={UserRoundCheck} tone="indigo" />
            </section>

            {!modeData?.enabled ? (
              <StatePanel
                title="24/7 post rejimi yoqilmagan"
                description={modeData?.disabledReason || "Bu muassasa oddiy grafikdan foydalanadi. Qolgan Operativ markaz rejimlari ishlashda davom etadi."}
                icon={Hospital}
              />
            ) : (
              <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.65fr)]">
                <article className="ui-surface overflow-hidden shadow-sm">
                  <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
                    <div>
                      <h2 className="flex items-center gap-2 text-base font-black text-[var(--text-primary)]">
                        <ShieldCheck className="h-5 w-5 text-indigo-500" /> {MODE_META[mode].label}
                      </h2>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{MODE_META[mode].description}</p>
                    </div>
                    <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[10px] font-bold text-[var(--text-muted)]">Muhimligi bo‘yicha</span>
                  </div>
                  {modeData.items.length ? (
                    <div>
                      {modeData.items.map((item) => (
                        <RiskRow key={item.id} item={item} active={selected?.id === item.id} onClick={() => setSelectedId(item.id)} />
                      ))}
                    </div>
                  ) : (
                    <div className="p-5">
                      <StatePanel
                        title="Hozircha faol xavf aniqlanmadi"
                        description="Operativ markaz ma’lumotlarni har daqiqada qayta tekshiradi."
                        icon={BadgeCheck}
                        className="border-emerald-500/25 bg-emerald-500/[0.04]"
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--border)] px-5 py-3 text-[10px] text-[var(--text-muted)]">
                    <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-rose-500" /> Kritik — hozir harakat</span>
                    <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-amber-500" /> Diqqat — tekshirish</span>
                    <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500" /> Xavfsiz</span>
                  </div>
                </article>

                {selected ? (
                  <DetailPanel item={selected} mode={mode} />
                ) : (
                  <div className="ui-surface p-5 shadow-sm">
                    <StatePanel title="Xavf tafsiloti" description="Ko‘rib chiqish uchun chap tomondagi holatlardan birini tanlang." icon={MapPin} />
                  </div>
                )}
              </section>
            )}

            <p className="flex items-center gap-2 px-1 text-[10px] text-[var(--text-muted)]">
              <Clock3 className="h-3.5 w-3.5" /> Oxirgi tahlil: {new Date(query.data.generatedAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
