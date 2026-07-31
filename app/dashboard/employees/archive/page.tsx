"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { ArchivedBioModal } from "@/components/employees/ArchivedBioModal";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { employeesApi, payrollApi, photoUrl as buildPhotoUrl } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { getInitials, getAvatarColor, formatMoney, cn, isSuperLike } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import {
  Search, X, ArrowLeft, Phone, Building2,
  Calendar, Clock, DollarSign, TrendingUp,
  AlertTriangle, CheckCircle2, XCircle,
  UserX, Archive, Hash,
} from "lucide-react";
import dayjs from "dayjs";

const LIMIT = 20;

const FIRE_REASON_LABELS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  RESIGNED:    { label: "O'z xohishi bilan ketdi", color: "text-blue-400",   bg: "bg-blue-500/10",   icon: "🚶" },
  FIRED:       { label: "Ishdan bo'shatildi",       color: "text-red-400",    bg: "bg-red-500/10",    icon: "❌" },
  RETIRED:     { label: "Pensiyaga chiqdi",         color: "text-purple-400", bg: "bg-purple-500/10", icon: "🎖" },
  TRANSFERRED: { label: "Boshqa joyga o'tdi",       color: "text-amber-400",  bg: "bg-amber-500/10",  icon: "🔄" },
  OTHER:       { label: "Boshqa sabab",             color: "text-gray-400",   bg: "bg-gray-500/10",   icon: "📋" },
};

function calcDuration(hiredAt: string, firedAt: string): string {
  const start  = dayjs(hiredAt);
  const end    = dayjs(firedAt);
  const months = end.diff(start, "month");
  const years  = Math.floor(months / 12);
  const rem    = months % 12;
  if (years > 0 && rem > 0) return `${years} yil ${rem} oy`;
  if (years > 0) return `${years} yil`;
  if (months > 0) return `${months} oy`;
  return `${end.diff(start, "day")} kun`;
}

// ── Archive Card ──────────────────────────────────
function ArchiveCard({ emp, onClick }: { emp: any; onClick: () => void }) {
  const reason = FIRE_REASON_LABELS[emp.fireReason] ?? FIRE_REASON_LABELS.OTHER;
  const duration = emp.firedAt ? calcDuration(emp.hiredAt, emp.firedAt) : "—";
  const lastSalary = emp.payrolls?.[0]?.netSalary ?? emp.baseSalary;

  return (
    <div
      onClick={onClick}
      className="card p-4 cursor-pointer hover:border-[var(--border-hover)] transition-all hover:shadow-md group"
    >
      <div className="flex items-start gap-3">
        {emp.photoUrl ? (
          <img src={buildPhotoUrl(emp.photoUrl)} alt={emp.fullName}
            className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0", getAvatarColor(emp.fullName))}>
            {getInitials(emp.fullName)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors">
                {emp.fullName}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {emp.department?.name} · {emp.position?.name}
              </p>
            </div>
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap", reason.color, reason.bg)}>
              {reason.icon} {reason.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {dayjs(emp.hiredAt).format("DD.MM.YY")} → {dayjs(emp.firedAt).format("DD.MM.YY")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {duration}
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <DollarSign className="w-3 h-3" />
              {formatMoney(lastSalary)}
            </span>
          </div>

          {emp.hospital?.name && (
            <p className="text-xs text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
              <Building2 className="w-3 h-3" /> {emp.hospital.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────
export default function ArchivePage() {
  const router = useRouter();
  const { user, selectedHospital } = useAuthStore();

  const targetHospitalId = isSuperLike(user?.role)
    ? (selectedHospital?.id || undefined)
    : undefined;

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch]           = useState("");
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  const debounceRef   = useRef<ReturnType<typeof setTimeout>>();
  const sentinelRef   = useRef<HTMLDivElement>(null);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val.trim()), 350);
  };
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading,
  } = useInfiniteQuery({
    queryKey: ["employees-archive", search, targetHospitalId],
    queryFn: ({ pageParam = 1 }) =>
      employeesApi.archive({
        search: search || undefined,
        page:   pageParam as number,
        limit:  LIMIT,
        ...(targetHospitalId ? { targetHospitalId } : {}),
      }),
    getNextPageParam: (lastPage: any) => {
      const meta = lastPage?.meta;
      if (!meta) return undefined;
      return meta.page < meta.totalPages ? meta.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const employees = data?.pages.flatMap((p: any) => p?.data ?? []) ?? [];
  const total     = data?.pages[0]?.meta?.total ?? 0;

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div>
      <Topbar
        title="Xodimlar arxivi"
        subtitle={`${total} nafar ketgan xodim`}
      />

      <div className="p-4 lg:p-6 space-y-4">

        {/* Back */}
        <button
          onClick={() => router.push("/dashboard/employees")}
          className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Xodimlarga qaytish
        </button>

        {/* Info banner */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm text-indigo-300">
          <Archive className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Bu yerda ishdan ketgan yoki bo'shatilgan xodimlarning to'liq tarixi saqlanadi.
            Yangi xodim qo'shganda telefon raqami orqali avvalgi ish tarixi aniqlanadi.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Ism yoki telefon raqam..."
            className="input-field w-full pl-9"
          />
          {searchInput && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(FIRE_REASON_LABELS).map(([key, val]) => {
            const count = employees.filter((e: any) => e.fireReason === key).length;
            return (
              <div key={key} className={cn("p-3 rounded-xl text-center border border-transparent", val.bg)}>
                <p className="text-xl">{val.icon}</p>
                <p className={cn("text-lg font-bold mt-1", val.color)}>{count}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-tight">{val.label}</p>
              </div>
            );
          })}
        </div>

        {/* List */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[var(--bg-hover)]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 rounded bg-[var(--bg-hover)] w-2/3" />
                    <div className="h-3 rounded bg-[var(--bg-hover)] w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && employees.length === 0 && (
          <div className="card p-12 text-center">
            <UserX className="w-12 h-12 text-[var(--text-muted)] opacity-30 mx-auto mb-3" />
            <p className="text-[var(--text-muted)]">
              {search ? "Qidiruv bo'yicha natija topilmadi" : "Arxivda xodim yo'q"}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {employees.map((emp: any) => (
            <ArchiveCard
              key={emp.id}
              emp={emp}
              onClick={() => setSelectedEmpId(emp.id)}
            />
          ))}
        </div>

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!hasNextPage && employees.length > 0 && !isLoading && (
          <p className="text-center text-xs text-[var(--text-muted)] py-2">
            Barcha {total} ta yozuv yuklandi ✓
          </p>
        )}
      </div>

      {selectedEmpId && (
        <ArchivedBioModal
          empId={selectedEmpId}
          onClose={() => setSelectedEmpId(null)}
        />
      )}
    </div>
  );
}