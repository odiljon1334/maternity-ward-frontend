"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { payrollApi, departmentsApi, downloadBlob, photoUrl as buildPhotoUrl } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { formatMoney, formatMinutes, cn, isSuperLike, getInitials, getAvatarColor } from "@/lib/utils";
import {
  Download, RefreshCw, CheckCircle, ChevronLeft, ChevronRight,
  TrendingDown, TrendingUp, DollarSign, Users, Clock,
} from "lucide-react";
import dayjs from "dayjs";
import { useAuthStore } from "@/stores/auth";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  DRAFT:    { label: "Qoralama",    cls: "badge-gray" },
  APPROVED: { label: "Tasdiqlangan", cls: "badge-blue" },
  PAID:     { label: "To'langan",   cls: "badge-green" },
};

export default function PayrollPage() {
  const qc = useQueryClient();
  const { user, selectedHospital } = useAuthStore();
  const targetHospitalId = isSuperLike(user?.role) ? (selectedHospital?.id || undefined) : undefined;
  const params = targetHospitalId ? { targetHospitalId } : undefined;

  const [month, setMonth] = useState(dayjs().month() + 1);
  const [year, setYear]   = useState(dayjs().year());
  const [deptFilter, setDeptFilter] = useState("");
  const [page, setPage] = useState(1);
  const LIMIT = 15;

  const { data, isLoading } = useQuery({
    queryKey: ["payroll", month, year, deptFilter, page, targetHospitalId],
    queryFn: () => payrollApi.list({ month, year, departmentId: deptFilter || undefined, targetHospitalId }),
    staleTime: 5 * 60_000, // 5 daqiqa — hisoblangandan so'ng o'zgarmaydi
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", targetHospitalId],
    queryFn: () => departmentsApi.list(params),
    staleTime: 10 * 60_000,
  });

  const generateMutation = useMutation({
    mutationFn: () => payrollApi.generate({ month, year, departmentId: deptFilter || undefined }, params),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll"] }); toast.success("Maosh hisoblandi"); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => payrollApi.approve(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll"] }); toast.success("Tasdiqlandi"); },
    onError: () => toast.error("Tasdiqlanmadi"),
  });

  const handleExcel = async () => {
    try {
      const res = await payrollApi.exportExcel({ month, year, departmentId: deptFilter || undefined, targetHospitalId });
      downloadBlob(res.data, `maosh-${year}-${month}.xlsx`);
    } catch { toast.error("Export xatoligi"); }
  };

  const records: any[] = data?.data || data || [];
  const total = data?.total || records.length;
  const totalPages = Math.ceil(total / LIMIT);

  const totalNet    = records.reduce((s, r) => s + Number(r.netSalary || 0), 0);
  const totalDeduct = records.reduce((s, r) => s + Number(r.lateDeduction || 0) + Number(r.earlyLeaveDeduction || 0) + Number(r.absenceDeduction || 0), 0);
  const totalBonus  = records.reduce((s, r) => s + Number(r.overtimeBonus || 0) + Number(r.manualBonus || 0), 0);

  return (
    <div>
      <Topbar title="Maosh" subtitle={`${year} yil, ${dayjs().month(month - 1).format("MMMM")}`} />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-5">
        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <select
            value={month}
            onChange={(e) => { setMonth(Number(e.target.value)); setPage(1); }}
            className="input-field flex-1 sm:flex-none sm:w-36"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{dayjs().month(m - 1).format("MMMM")}</option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => { setYear(Number(e.target.value)); setPage(1); }}
            className="input-field w-20 sm:w-24"
          >
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          <select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
            className="input-field w-full sm:w-44"
          >
            <option value="">Barcha bo'limlar</option>
            {(departments as any[]).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <div className="flex items-center gap-2 ml-auto">
            <button onClick={handleExcel} className="btn-secondary gap-1.5 text-xs sm:text-sm">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="btn-primary gap-1.5 text-xs sm:text-sm"
            >
              <RefreshCw className={cn("w-4 h-4", generateMutation.isPending && "animate-spin")} />
              {generateMutation.isPending ? "Hisoblanmoqda..." : "Hisoblash"}
            </button>
          </div>
        </div>

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {[
            { label: "Jami xodimlar",    value: records.length,       icon: Users,        color: "bg-indigo-600" },
            { label: "Maosh fondi",      value: formatMoney(totalNet), icon: DollarSign,  color: "bg-emerald-600" },
            { label: "Jami kesimlar",    value: formatMoney(totalDeduct), icon: TrendingDown, color: "bg-red-600" },
            { label: "Jami bonuslar",    value: formatMoney(totalBonus),  icon: TrendingUp,   color: "bg-violet-600" },
          ].map((s) => (
            <div key={s.label} className="card p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className={`p-2 sm:p-2.5 rounded-xl ${s.color} flex-shrink-0`}>
                <s.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[var(--text-muted)] truncate">{s.label}</p>
                <p className="text-sm sm:text-lg font-bold text-[var(--text-primary)] truncate">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Mobile card view ── */}
        <div className="sm:hidden space-y-3">
          {isLoading && [...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded bg-[var(--bg-hover)] w-2/3" />
                  <div className="h-3 rounded bg-[var(--bg-hover)] w-1/3" />
                </div>
              </div>
            </div>
          ))}
          {!isLoading && records.length === 0 && (
            <div className="card p-8 text-center text-[var(--text-muted)] text-sm">
              <p>Maosh ma'lumotlari topilmadi</p>
              <p className="text-xs mt-1">"Hisoblash" tugmasini bosing</p>
            </div>
          )}
          {!isLoading && records.map((r: any) => {
            const deductions = Number(r.lateDeduction || 0) + Number(r.earlyLeaveDeduction || 0) + Number(r.absenceDeduction || 0) + Number(r.manualDeduction || 0);
            const bonuses = Number(r.overtimeBonus || 0) + Number(r.manualBonus || 0);
            const st = STATUS_MAP[r.status] || { label: r.status, cls: "badge-gray" };
            return (
              <div key={r.id} className="card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0">
                    {r.employee?.photoUrl
                      ? <img src={buildPhotoUrl(r.employee.photoUrl)} alt={r.employee.fullName} className="w-10 h-10 rounded-full object-cover" />
                      : <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold text-white", getAvatarColor(r.employee?.fullName || ""))}>
                          {getInitials(r.employee?.fullName || "?")}
                        </div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[var(--text-primary)] truncate">{r.employee?.fullName}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{r.employee?.department?.name}</p>
                  </div>
                  <span className={cn(st.cls, "flex-shrink-0")}>{st.label}</span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs border-t border-[var(--border)] pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Asosiy</span>
                    <span className="text-[var(--text-primary)]">{formatMoney(r.baseSalary)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Sof maosh</span>
                    <span className="font-bold text-[var(--text-primary)]">{formatMoney(r.netSalary)}</span>
                  </div>
                  {r.totalNetWorkMin > 0 && (
                    <div className="flex items-center justify-between col-span-2">
                      <span className="text-[var(--text-muted)] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Ish soati
                      </span>
                      <span className="text-indigo-400 font-medium">{formatMinutes(r.totalNetWorkMin)}</span>
                    </div>
                  )}
                  {deductions > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-muted)]">Kesim</span>
                      <span className="text-red-400">−{formatMoney(deductions)}</span>
                    </div>
                  )}
                  {bonuses > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-muted)]">Bonus</span>
                      <span className="text-emerald-400">+{formatMoney(bonuses)}</span>
                    </div>
                  )}
                </div>

                {r.status === "DRAFT" && (
                  <button
                    onClick={() => approveMutation.mutate(r.id)}
                    disabled={approveMutation.isPending}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 py-2 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/10 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Tasdiqlash
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Desktop table ── */}
        <div className="hidden sm:block card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Xodim", "Bo'lim", "Asosiy maosh", "Ish soati", "Kesimlar", "Bonuslar", "Sof maosh", "Holat", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border)]">
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 rounded bg-[var(--bg-hover)] animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}

                {!isLoading && records.map((r: any) => {
                  const deductions = Number(r.lateDeduction || 0) + Number(r.earlyLeaveDeduction || 0) + Number(r.absenceDeduction || 0) + Number(r.manualDeduction || 0);
                  const bonuses = Number(r.overtimeBonus || 0) + Number(r.manualBonus || 0);
                  return (
                    <tr key={r.id} className="border-b border-[var(--border)] table-row-hover">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {r.employee?.photoUrl
                              ? <img src={buildPhotoUrl(r.employee.photoUrl)} alt={r.employee.fullName} className="w-8 h-8 rounded-full object-cover ring-1 ring-[var(--border)]" />
                              : <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white", getAvatarColor(r.employee?.fullName || ""))}>
                                  {getInitials(r.employee?.fullName || "?")}
                                </div>
                            }
                          </div>
                          <span className="font-medium text-[var(--text-primary)]">{r.employee?.fullName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--text-muted)]">{r.employee?.department?.name}</td>
                      <td className="px-5 py-3.5">{formatMoney(r.baseSalary)}</td>
                      <td className="px-5 py-3.5">
                        {r.totalNetWorkMin > 0 ? (
                          <span className="flex items-center gap-1 text-[var(--text-primary)]">
                            <Clock className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                            {formatMinutes(r.totalNetWorkMin)}
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {deductions > 0 ? <span className="text-red-400">−{formatMoney(deductions)}</span> : <span className="text-[var(--text-muted)]">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {bonuses > 0 ? <span className="text-emerald-400">+{formatMoney(bonuses)}</span> : <span className="text-[var(--text-muted)]">—</span>}
                      </td>
                      <td className="px-5 py-3.5 font-semibold">{formatMoney(r.netSalary)}</td>
                      <td className="px-5 py-3.5">
                        <span className={STATUS_MAP[r.status]?.cls || "badge-gray"}>{STATUS_MAP[r.status]?.label || r.status}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {r.status === "DRAFT" && (
                          <button
                            onClick={() => approveMutation.mutate(r.id)}
                            disabled={approveMutation.isPending}
                            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Tasdiqlash
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {!isLoading && records.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-[var(--text-muted)]">
                      <p className="text-sm">Maosh ma'lumotlari topilmadi</p>
                      <p className="text-xs mt-1">"Hisoblash" tugmasini bosib, maoshlarni hisoblang</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)]">{(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} / {total}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost p-1.5 disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-[var(--text-muted)] px-2">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost p-1.5 disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile pagination */}
        {totalPages > 1 && (
          <div className="flex sm:hidden items-center justify-between">
            <p className="text-xs text-[var(--text-muted)]">{(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} / {total}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost p-2 disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-[var(--text-muted)] px-2">{page}/{totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost p-2 disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
