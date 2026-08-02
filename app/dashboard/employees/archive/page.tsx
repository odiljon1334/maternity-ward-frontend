"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ArchivedBioModal } from "@/components/employees/ArchivedBioModal";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { employeesApi, photoUrl as buildPhotoUrl } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { getInitials, getAvatarColor, formatMoney, cn, isSuperLike } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import {
  Search, X, ArrowLeft, Building2,
  Calendar, Clock, DollarSign,
  UserX, Archive, ChevronRight
} from "lucide-react";
import dayjs from "dayjs";

const LIMIT = 20;

const FIRE_REASON_LABELS: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  RESIGNED:    { label: "O'z xohishi bilan", color: "text-sky-700 dark:text-sky-400",    bg: "bg-sky-50 dark:bg-sky-500/10",    border: "border-sky-200 dark:border-sky-500/20",    icon: "🚶" },
  FIRED:       { label: "Bo'shatildi",       color: "text-rose-700 dark:text-rose-400",   bg: "bg-rose-50 dark:bg-rose-500/10",   border: "border-rose-200 dark:border-rose-500/20",   icon: "❌" },
  RETIRED:     { label: "Pensiyada",         color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10", border: "border-purple-200 dark:border-purple-500/20", icon: "🎖" },
  TRANSFERRED: { label: "O'tkazildi",        color: "text-amber-700 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-500/10",  border: "border-amber-200 dark:border-amber-500/20",  icon: "🔄" },
  OTHER:       { label: "Boshqa sabab",      color: "text-slate-700 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-500/10", border: "border-slate-200 dark:border-slate-500/20", icon: "📋" },
};

function calcDuration(hiredAt: string, firedAt: string): string {
  if (!hiredAt || !firedAt) return "—";
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

// ── Improved Glassmorphic Archive Card ──────────────────────────────────
function ArchiveCard({ emp, onClick }: { emp: any; onClick: () => void }) {
  const reason = FIRE_REASON_LABELS[emp.fireReason] ?? FIRE_REASON_LABELS.OTHER;
  const duration = emp.firedAt ? calcDuration(emp.hiredAt, emp.firedAt) : "—";
  const lastSalary = emp.payrolls?.[0]?.netSalary ?? emp.baseSalary;

  return (
    <div
      onClick={onClick}
      className="group bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 backdrop-blur-md relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4 min-w-0">
          
          {/* Avatar / Photo */}
          <div className="relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14">
            {emp.photoUrl ? (
              <img
                src={buildPhotoUrl(emp.photoUrl)}
                alt={emp.fullName}
                className="w-full h-full rounded-2xl object-cover ring-2 ring-slate-200 dark:ring-slate-700/60 group-hover:ring-indigo-500/60 transition-all shadow-md"
              />
            ) : (
              <div className={cn("w-full h-full rounded-2xl flex items-center justify-center text-base font-bold text-white shadow-md ring-2 ring-slate-200 dark:ring-slate-700/60 group-hover:ring-indigo-500/60 transition-all", getAvatarColor(emp.fullName))}>
                {getInitials(emp.fullName)}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors truncate">
                {emp.fullName}
              </h3>
              <span className={cn("text-[11px] font-semibold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 whitespace-nowrap", reason.color, reason.bg, reason.border)}>
                <span>{reason.icon}</span> {reason.label}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {[emp.department?.name, emp.position?.name].filter(Boolean).join(" · ") || "Lavozim ko'rsatilmagan"}
            </p>

            {emp.hospital?.name && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-0.5">
                <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <span className="truncate">{emp.hospital.name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right Info Badges */}
        <div className="flex flex-wrap sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-2.5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-mono text-xs bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              {dayjs(emp.hiredAt).format("DD.MM.YY")} — {dayjs(emp.firedAt).format("DD.MM.YY")}
            </span>
            <span className="flex items-center gap-1 text-xs bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              {duration}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 font-mono flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
              <DollarSign className="w-3.5 h-3.5" />
              {formatMoney(lastSalary)}
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-white group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all hidden sm:flex">
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d17] text-slate-900 dark:text-slate-100 p-4 lg:p-6 space-y-6 font-sans">
      <Topbar
        title="Xodimlar arxivi"
        subtitle={`${total} nafar ketgan xodim hisobda`}
      />

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <button
          onClick={() => router.push("/dashboard/employees")}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 transition-all w-fit shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Active xodimlarga qaytish
        </button>

        {/* Modern Search Field */}
        <div className="relative w-full sm:w-80">
          <input
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Ism yoki telefon raqam..."
            className="w-full bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-3.5 pr-9 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm dark:shadow-inner"
          />
          {searchInput ? (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 backdrop-blur-md text-xs text-indigo-800 dark:text-indigo-300 shadow-sm dark:shadow-lg">
        <Archive className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
        <p className="leading-relaxed">
          Bu yerda ilgari ishlagan va bo'shatilgan xodimlarning to'liq tarixi saqlanadi.
          Yangi xodim qo'shilayotganda, kiritilgan telefon raqami orqali uning o'tmishdagi faoliyat tarixi avtomatik ko'rsatiladi.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {Object.entries(FIRE_REASON_LABELS).map(([key, val]) => {
          const count = employees.filter((e: any) => e.fireReason === key).length;
          return (
            <div
              key={key}
              className={cn(
                "p-4 rounded-2xl border text-center backdrop-blur-md flex flex-col items-center justify-center transition-all hover:scale-[1.02] shadow-sm",
                val.bg,
                val.border
              )}
            >
              <span className="text-2xl mb-1.5">{val.icon}</span>
              <p className={cn("text-2xl font-black tracking-tight", val.color)}>{count}</p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">{val.label}</p>
            </div>
          );
        })}
      </div>

      {/* Employee List Section */}
      <div className="space-y-3.5">
        {isLoading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 rounded bg-slate-100 dark:bg-slate-800 w-1/3" />
                    <div className="h-3 rounded bg-slate-100 dark:bg-slate-800 w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && employees.length === 0 && (
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center backdrop-blur-md shadow-sm">
            <UserX className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {search ? "Qidiruv so'rovi bo'yicha hech qanday arxiv yozuvi topilmadi" : "Arxivda hech qanday xodim mavjud emas"}
            </p>
          </div>
        )}

        {employees.map((emp: any) => (
          <ArchiveCard
            key={emp.id}
            emp={emp}
            onClick={() => setSelectedEmpId(emp.id)}
          />
        ))}
      </div>

      {/* Infinite Scroll Sentinel */}
      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-indigo-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {!hasNextPage && employees.length > 0 && !isLoading && (
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 font-medium py-3">
          Barcha {total} ta arxiv yozuvi yuklab bo'lindi ✓
        </p>
      )}

      {/* Detail Modal */}
      {selectedEmpId && (
        <ArchivedBioModal
          empId={selectedEmpId}
          onClose={() => setSelectedEmpId(null)}
        />
      )}
    </div>
  );
}