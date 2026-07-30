"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { employeesApi, payrollApi, attendanceApi, photoUrl as buildPhotoUrl } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { getInitials, getAvatarColor, formatMoney, cn, isSuperLike } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import {
  Search, X, ArrowLeft, Phone, Building2, Briefcase,
  Calendar, Clock, DollarSign, TrendingUp, ChevronLeft,
  ChevronRight, AlertTriangle, CheckCircle2, XCircle,
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

// ── Bio Modal ─────────────────────────────────────
function BioModal({ empId, onClose }: { empId: string; onClose: () => void }) {
  const [payrollMonth, setPayrollMonth] = useState(dayjs().month() + 1);
  const [payrollYear,  setPayrollYear]  = useState(dayjs().year());

  const { data: emp, isLoading } = useQuery({
    queryKey: ["archived-employee", empId],
    queryFn: () => employeesApi.getArchived(empId),
    enabled: !!empId,
  });

  const { data: payrollHistory = [] } = useQuery({
    queryKey: ["archived-payroll-history", empId],
    queryFn: async () => {
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = dayjs().subtract(i, "month");
        return { month: d.month() + 1, year: d.year() };
      });
      const results = await Promise.all(
        months.map(({ month, year }) =>
          payrollApi.employee(empId, { month, year }).catch(() => null)
        )
      );
      return results
        .map((r, i) => r ? { ...r, month: months[i].month, year: months[i].year } : null)
        .filter(Boolean);
    },
    enabled: !!empId,
  });

  const UZ_MONTHS = ["","Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentyabr","Oktyabr","Noyabr","Dekabr"];

  if (isLoading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-2xl mx-4 p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!emp) return null;

  const reason = FIRE_REASON_LABELS[emp.fireReason] ?? FIRE_REASON_LABELS.OTHER;
  const duration = calcDuration(emp.hiredAt, emp.firedAt);
  const att = emp.attendanceStats ?? {};
  const totalAtt = (att.present ?? 0) + (att.late ?? 0) + (att.absent ?? 0) + (att.earlyLeave ?? 0);
  const attendancePct = totalAtt > 0 ? Math.round(((att.present ?? 0) + (att.late ?? 0)) / totalAtt * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-card)] z-10 px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-sm font-semibold text-[var(--text-primary)]">Xodim arxivi</span>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Bio card */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-[var(--bg-hover)]">
            {emp.photoUrl ? (
              <img src={buildPhotoUrl(emp.photoUrl)} alt={emp.fullName}
                className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 ring-2 ring-[var(--border)]" />
            ) : (
              <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0", getAvatarColor(emp.fullName))}>
                {getInitials(emp.fullName)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-[var(--text-primary)] leading-tight">{emp.fullName}</h2>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                {emp.position?.name} · {emp.department?.name}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                {emp.phone && (
                  <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <Phone className="w-3.5 h-3.5 text-indigo-400" /> {emp.phone}
                  </span>
                )}
                {emp.employeeNo && (
                  <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono">
                    <Hash className="w-3.5 h-3.5 text-violet-400" /> {emp.employeeNo}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Kasalxona ma'lumoti */}
          <div className="p-4 rounded-xl border border-[var(--border)] space-y-2">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Ish joyi
            </p>
            <p className="font-semibold text-[var(--text-primary)]">{emp.hospital?.name}</p>
            {emp.hospital?.address && (
              <p className="text-xs text-[var(--text-muted)]">📍 {emp.hospital.address}</p>
            )}
            {emp.hospital?.phone && (
              <p className="text-xs text-[var(--text-muted)]">📞 {emp.hospital.phone}</p>
            )}
          </div>

          {/* Ishlash muddati */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-[var(--bg-hover)] space-y-1">
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Ishga kirgan
              </p>
              <p className="font-semibold text-[var(--text-primary)]">
                {dayjs(emp.hiredAt).format("DD.MM.YYYY")}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-hover)] space-y-1">
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <UserX className="w-3.5 h-3.5" /> Ketgan sana
              </p>
              <p className="font-semibold text-[var(--text-primary)]">
                {dayjs(emp.firedAt).format("DD.MM.YYYY")}
              </p>
            </div>
            <div className="col-span-2 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
              <span className="text-sm text-[var(--text-muted)]">Jami ishlagan muddat</span>
              <span className="font-bold text-indigo-400 text-lg">{duration}</span>
            </div>
          </div>

          {/* Ketish sababi */}
          <div className={cn("p-4 rounded-xl border flex items-start gap-3", reason.bg, "border-current/20")}>
            <span className="text-xl">{reason.icon}</span>
            <div>
              <p className={cn("font-semibold text-sm", reason.color)}>{reason.label}</p>
              {emp.fireNote && (
                <p className="text-xs text-[var(--text-muted)] mt-1">{emp.fireNote}</p>
              )}
            </div>
          </div>

          {/* Oxirgi maosh */}
          <div className="p-4 rounded-xl bg-[var(--bg-hover)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-[var(--text-muted)]">Oxirgi asosiy maosh</span>
            </div>
            <span className="font-bold text-emerald-400 text-lg">{formatMoney(emp.baseSalary)}</span>
          </div>

          {/* Davomat statistikasi */}
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Davomat statistikasi (jami)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Keldi",      value: att.present ?? 0,    icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                { label: "Kech keldi", value: att.late ?? 0,       icon: <Clock className="w-4 h-4" />,        color: "text-yellow-400",  bg: "bg-yellow-500/10"  },
                { label: "Kelmadi",    value: att.absent ?? 0,     icon: <XCircle className="w-4 h-4" />,      color: "text-red-400",     bg: "bg-red-500/10"     },
                { label: "Erta ketdi", value: att.earlyLeave ?? 0, icon: <AlertTriangle className="w-4 h-4" />,color: "text-orange-400",  bg: "bg-orange-500/10"  },
              ].map((s) => (
                <div key={s.label} className={cn("p-3 rounded-xl text-center", s.bg)}>
                  <div className={cn("flex justify-center mb-1", s.color)}>{s.icon}</div>
                  <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            {totalAtt > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                  <span>Davomat foizi</span>
                  <span className="font-semibold text-[var(--text-primary)]">{attendancePct}%</span>
                </div>
                <div className="h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
                    style={{ width: `${attendancePct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Maosh tarixi */}
          {(payrollHistory as any[]).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Maosh tarixi (so'nggi 6 oy)
              </p>
              <div className="card overflow-hidden">
                {(payrollHistory as any[]).map((h: any, i: number) => {
                  const totalDed = Number(h.lateDeduction ?? 0) + Number(h.absenceDeduction ?? 0) + Number(h.earlyLeaveDeduction ?? 0);
                  return (
                    <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] last:border-0">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {UZ_MONTHS[h.month]} {h.year}
                        </p>
                        {totalDed > 0 && (
                          <p className="text-xs text-red-400 mt-0.5">−{formatMoney(totalDed)} kesim</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">{formatMoney(h.netSalary)}</p>
                        {h.status === "APPROVED" && (
                          <p className="text-[10px] text-emerald-400/60">Tasdiqlangan</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ta'til tarixi */}
          {(emp.leaveRequests ?? []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Ta'til tarixi
              </p>
              <div className="card overflow-hidden">
                {(emp.leaveRequests as any[]).slice(0, 5).map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] last:border-0">
                    <div>
                      <p className="text-sm text-[var(--text-primary)]">{l.type}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {dayjs(l.startDate).format("DD.MM.YYYY")} – {dayjs(l.endDate).format("DD.MM.YYYY")}
                      </p>
                    </div>
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      l.status === "APPROVED"  ? "bg-emerald-500/15 text-emerald-400" :
                      l.status === "COMPLETED" ? "bg-indigo-500/15 text-indigo-400"  :
                      l.status === "REJECTED"  ? "bg-red-500/15 text-red-400"        :
                      "bg-gray-500/15 text-gray-400"
                    )}>
                      {l.daysCount} kun
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
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

      {/* Bio Modal */}
      {selectedEmpId && (
        <BioModal
          empId={selectedEmpId}
          onClose={() => setSelectedEmpId(null)}
        />
      )}
    </div>
  );
}