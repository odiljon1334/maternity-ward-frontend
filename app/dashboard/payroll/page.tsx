"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { payrollApi, departmentsApi, downloadBlob, photoUrl as buildPhotoUrl } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { formatMoney, cn, isSuperLike, getInitials, getAvatarColor } from "@/lib/utils";
import {
  Download, RefreshCw, CheckCircle, ChevronLeft, ChevronRight,
  TrendingDown, TrendingUp, DollarSign, Users,
} from "lucide-react";
import dayjs from "dayjs";
import { useAuthStore } from "@/stores/auth";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  DRAFT:    { label: "Qoralama", cls: "badge-gray" },
  APPROVED: { label: "Tasdiqlangan", cls: "badge-blue" },
  PAID:     { label: "To'langan", cls: "badge-green" },
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
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", targetHospitalId],
    queryFn: () => departmentsApi.list(params),
  });

  const generateMutation = useMutation({
    mutationFn: () => payrollApi.generate({ month, year, departmentId: deptFilter || undefined }, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll"] });
      toast.success("Maosh hisoblandi");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => payrollApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll"] });
      toast.success("Tasdiqlandi");
    },
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

  // Summary stats
  const totalNet    = records.reduce((s: number, r: any) => s + Number(r.netSalary || 0), 0);
  const totalDeduct = records.reduce((s: number, r: any) =>
    s + Number(r.lateDeduction || 0) + Number(r.earlyLeaveDeduction || 0) + Number(r.absenceDeduction || 0), 0);
  const totalBonus  = records.reduce((s: number, r: any) =>
    s + Number(r.overtimeBonus || 0) + Number(r.manualBonus || 0), 0);

  return (
    <div>
      <Topbar
        title="Maosh hisoblash"
        subtitle={`${year} yil, ${dayjs().month(month - 1).format("MMMM")}`}
      />

      <div className="p-6 space-y-5">
        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month / Year */}
          <select
            value={month}
            onChange={(e) => { setMonth(Number(e.target.value)); setPage(1); }}
            className="input-field w-36"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {dayjs().month(m - 1).format("MMMM")}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => { setYear(Number(e.target.value)); setPage(1); }}
            className="input-field w-24"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
            className="input-field w-44"
          >
            <option value="">Barcha bo'limlar</option>
            {(departments as any[]).map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={handleExcel} className="btn-secondary">
              <Download className="w-4 h-4" /> Excel
            </button>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="btn-primary"
            >
              <RefreshCw className={cn("w-4 h-4", generateMutation.isPending && "animate-spin")} />
              {generateMutation.isPending ? "Hisoblanmoqda..." : "Hisoblash"}
            </button>
          </div>
        </div>

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Jami xodimlar",   value: records.length,      icon: Users,        color: "bg-indigo-600" },
            { label: "Jami maosh fondi", value: formatMoney(totalNet), icon: DollarSign,  color: "bg-emerald-600" },
            { label: "Jami kesimlar",    value: formatMoney(totalDeduct), icon: TrendingDown, color: "bg-red-600" },
            { label: "Jami bonuslar",    value: formatMoney(totalBonus),  icon: TrendingUp,   color: "bg-violet-600" },
          ].map((s) => (
            <div key={s.label} className="card p-4 flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${s.color}`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Table ── */}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {[
                  "Xodim", "Bo'lim", "Asosiy maosh", "Kesimlar",
                  "Bonuslar", "Sof maosh", "Holat", ""
                ].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-[var(--border)]">
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 rounded bg-[var(--bg-hover)] animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}

              {!isLoading && records.map((r: any) => {
                const deductions =
                  Number(r.lateDeduction || 0) +
                  Number(r.earlyLeaveDeduction || 0) +
                  Number(r.absenceDeduction || 0) +
                  Number(r.manualDeduction || 0);
                const bonuses =
                  Number(r.overtimeBonus || 0) +
                  Number(r.manualBonus || 0);

                return (
                  <tr key={r.id} className="border-b border-[var(--border)] table-row-hover">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {r.employee?.photoUrl
                            ? <img src={buildPhotoUrl(r.employee.photoUrl)} alt={r.employee.fullName}
                                className="w-8 h-8 rounded-full object-cover ring-1 ring-[var(--border)]" />
                            : <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white",
                                getAvatarColor(r.employee?.fullName || ""))}>
                                {getInitials(r.employee?.fullName || "?")}
                              </div>
                          }
                        </div>
                        <span className="font-medium text-[var(--text-primary)]">{r.employee?.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--text-muted)]">
                      {r.employee?.department?.name}
                    </td>
                    <td className="px-5 py-3.5 text-[var(--text-primary)]">
                      {formatMoney(r.baseSalary)}
                    </td>
                    <td className="px-5 py-3.5">
                      {deductions > 0
                        ? <span className="text-red-400">−{formatMoney(deductions)}</span>
                        : <span className="text-[var(--text-muted)]">—</span>
                      }
                    </td>
                    <td className="px-5 py-3.5">
                      {bonuses > 0
                        ? <span className="text-emerald-400">+{formatMoney(bonuses)}</span>
                        : <span className="text-[var(--text-muted)]">—</span>
                      }
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[var(--text-primary)]">
                      {formatMoney(r.netSalary)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={STATUS_MAP[r.status]?.cls || "badge-gray"}>
                        {STATUS_MAP[r.status]?.label || r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {r.status === "DRAFT" && (
                        <button
                          onClick={() => approveMutation.mutate(r.id)}
                          disabled={approveMutation.isPending}
                          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
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
                  <td colSpan={8} className="px-5 py-12 text-center text-[var(--text-muted)]">
                    <p className="text-sm">Maosh ma'lumotlari topilmadi</p>
                    <p className="text-xs mt-1">
                      &quot;Hisoblash&quot; tugmasini bosib, maoshlarni hisoblang
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)]">
                {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} / {total}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="btn-ghost p-1.5 disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-[var(--text-muted)] px-2">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="btn-ghost p-1.5 disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
