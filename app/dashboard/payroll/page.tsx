"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { payrollApi, departmentsApi, downloadBlob, photoThumbUrl } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { formatMoney, formatMinutes, cn, isSuperLike, getInitials, getAvatarColor } from "@/lib/utils";
import {
  Download, RefreshCw, CheckCircle, ChevronLeft, ChevronRight,
  TrendingDown, TrendingUp, DollarSign, Users, Clock,
  AlertTriangle, Info, FileText,
} from "lucide-react";
import dayjs from "dayjs";
import { Button, Dialog, Select, StatePanel, Surface, TableShell } from "@/components/ui";

const payrollDeductions = (r: any) =>
  Number(r.absenceDeduction || 0) +
  Number(r.earlyLeaveDeduction || 0) +
  Number(r.disciplinaryFine || 0) +
  Number(r.otherLawfulDeduction || 0) +
  Number(r.advanceApplied || r.advancePaid || 0) +
  Number(r.manualDeduction || 0);

const payrollBonuses = (r: any) =>
  Number(r.overtimeBonus || 0) +
  Number(r.contractualKpiBonus || 0) +
  Number(r.oneTimeAward || 0) +
  Number(r.manualBonus || 0);
import { useAuthStore } from "@/stores/auth";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  DRAFT:    { label: "Qoralama",    cls: "badge-gray" },
  APPROVED: { label: "Tasdiqlangan", cls: "badge-blue" },
  PAID:     { label: "To'langan",   cls: "badge-green" },
};

// ── Payroll Preview Modal ────────────────────────
function PayrollPreviewModal({
  open, onClose, onConfirm, isPending,
  month, year, deptName,
  records,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  month: number;
  year: number;
  deptName?: string;
  records: any[];
}) {
  const hasExisting  = records.length > 0;
  const totalNet     = records.reduce((s, r) => s + Number(r.netSalary      || 0), 0);
  const totalDeduct  = records.reduce((s, r) => s + payrollDeductions(r), 0);
  const totalBonus   = records.reduce((s, r) => s + payrollBonuses(r), 0);
  const monthLabel   = dayjs().month(month - 1).format("MMMM");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Maosh hisoblash"
      description="Davomat va tasdiqlangan tuzatishlar asosida tanlangan davr qayta hisoblanadi."
      className="sm:max-w-md"
      footer={(
        <>
          <Button onClick={onClose} variant="secondary" disabled={isPending}>Bekor qilish</Button>
          <Button onClick={onConfirm} loading={isPending} loadingLabel="Hisoblanmoqda...">
            <RefreshCw className="w-4 h-4" />
            Ha, hisoblash
          </Button>
        </>
      )}
    >
        <div className="space-y-4">
          {/* Period info */}
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-hover)] text-sm font-medium text-[var(--text-primary)]">
              📅 {year} yil, {monthLabel}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-hover)] text-sm text-[var(--text-muted)]">
              🏥 {deptName || "Barcha bo'limlar"}
            </span>
          </div>

          {/* Warning / Info banner */}
          {hasExisting ? (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-300">Mavjud yozuvlar qayta hisoblanadi</p>
                <p className="text-xs text-amber-400/80 mt-0.5">
                  {records.length} ta xodim yozuvi yangilanadi
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25">
              <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-indigo-300">Yangi hisoblash boshlanadi</p>
                <p className="text-xs text-indigo-400/80 mt-0.5">
                  Bu oy uchun hali hisoblangan maosh yo'q
                </p>
              </div>
            </div>
          )}

          {/* Current stats (only when existing records) */}
          {hasExisting && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Joriy holat</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Xodimlar",     value: `${records.length} ta`,      color: "" },
                  { label: "Maosh fondi",  value: formatMoney(totalNet),        color: "text-emerald-400" },
                  { label: "Jami kesim",   value: `−${formatMoney(totalDeduct)}`, color: "text-red-400" },
                  { label: "Jami bonus",   value: `+${formatMoney(totalBonus)}`,  color: "text-violet-400" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-hover)]">
                    <span className="text-xs text-[var(--text-muted)]">{s.label}</span>
                    <span className={cn("text-xs font-semibold", s.color || "text-[var(--text-primary)]")}>
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-[var(--text-muted)]">
            Davomat va jadval ma'lumotlari asosida maosh qayta hisoblanadi.
          </p>
        </div>
    </Dialog>
  );
}

export default function PayrollPage() {
  const qc = useQueryClient();
  const { user, selectedHospital } = useAuthStore();
  const targetHospitalId = isSuperLike(user?.role) ? (selectedHospital?.id || undefined) : undefined;
  const params = targetHospitalId ? { targetHospitalId } : undefined;

  const [month, setMonth] = useState(dayjs().month() + 1);
  const [year, setYear]   = useState(dayjs().year());
  const [deptFilter, setDeptFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const LIMIT = 15;

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll"] });
      toast.success("Maosh hisoblandi");
      setShowPreview(false);
    },
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

  const [payslipLoading, setPayslipLoading] = useState<string | null>(null);
  const handlePayslip = async (employeeId: string, employeeName: string) => {
    setPayslipLoading(employeeId);
    try {
      const res = await payrollApi.downloadPayslip(employeeId, { month, year });
      const safeName = employeeName.replace(/\s+/g, "_");
      downloadBlob(res.data, `maosh_varaqasi_${safeName}_${month}_${year}.pdf`);
      toast.success("PDF yuklab olindi");
    } catch {
      toast.error("PDF yaratishda xatolik");
    } finally {
      setPayslipLoading(null);
    }
  };

  const records: any[] = data?.data || data || [];
  const total = data?.total || records.length;
  const totalPages = Math.ceil(total / LIMIT);

  const totalNet    = records.reduce((s, r) => s + Number(r.netSalary || 0), 0);
  const totalDeduct = records.reduce((s, r) => s + payrollDeductions(r), 0);
  const totalBonus  = records.reduce((s, r) => s + payrollBonuses(r), 0);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Topbar title="Maosh" subtitle={`${year} yil, ${dayjs().month(month - 1).format("MMMM")}`} />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-5">
        {/* ── Toolbar ── */}
        <Surface className="flex flex-wrap items-center gap-2 p-3 sm:gap-3">
          <Select
            aria-label="Oy"
            value={month}
            onChange={(e) => { setMonth(Number(e.target.value)); setPage(1); }}
            className="input-field flex-1 sm:flex-none sm:w-36"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{dayjs().month(m - 1).format("MMMM")}</option>
            ))}
          </Select>

          <Select
            aria-label="Yil"
            value={year}
            onChange={(e) => { setYear(Number(e.target.value)); setPage(1); }}
            className="input-field w-20 sm:w-24"
          >
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>

          <Select
            aria-label="Bo‘lim"
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
            className="input-field w-full sm:w-44"
          >
            <option value="">Barcha bo'limlar</option>
            {(departments as any[]).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>

          <div className="flex items-center gap-2 ml-auto">
            <Button onClick={handleExcel} variant="secondary" size="sm">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button
              onClick={() => setShowPreview(true)}
              loading={generateMutation.isPending}
              loadingLabel="Hisoblanmoqda..."
              size="sm"
            >
              <RefreshCw className="w-4 h-4" />
              Hisoblash
            </Button>
          </div>
        </Surface>

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {[
            { label: "Jami xodimlar",    value: records.length,       icon: Users,        color: "bg-indigo-600" },
            { label: "Maosh fondi",      value: formatMoney(totalNet), icon: DollarSign,  color: "bg-emerald-600" },
            { label: "Jami kesimlar",    value: formatMoney(totalDeduct), icon: TrendingDown, color: "bg-red-600" },
            { label: "Jami bonuslar",    value: formatMoney(totalBonus),  icon: TrendingUp,   color: "bg-violet-600" },
          ].map((s) => (
            <Surface key={s.label} className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
              <div className={`p-2 sm:p-2.5 rounded-xl ${s.color} flex-shrink-0`}>
                <s.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[var(--text-muted)] truncate">{s.label}</p>
                <p className="text-sm sm:text-lg font-bold text-[var(--text-primary)] truncate">{s.value}</p>
              </div>
            </Surface>
          ))}
        </div>

        {isError && (
          <StatePanel
            kind="error"
            title="Maosh ma’lumotlarini yuklab bo‘lmadi"
            description="Hisob-kitoblar o‘zgartirilmadi. Aloqani tekshirib, qayta urinib ko‘ring."
            actionLabel="Qayta urinish"
            onAction={() => void refetch()}
            actionLoading={isFetching}
          />
        )}

        {/* ── Mobile card view ── */}
        {!isError && <div className="sm:hidden space-y-3">
          {isLoading && [...Array(4)].map((_, i) => (
            <Surface key={i} className="animate-pulse space-y-3 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded bg-[var(--bg-hover)] w-2/3" />
                  <div className="h-3 rounded bg-[var(--bg-hover)] w-1/3" />
                </div>
              </div>
            </Surface>
          ))}
          {!isLoading && records.length === 0 && (
            <StatePanel title="Maosh ma’lumotlari topilmadi" description="Hisoblash tugmasini bosib, tanlangan davr uchun maoshlarni yarating." />
          )}
          {!isLoading && records.map((r: any) => {
            const deductions = payrollDeductions(r);
            const bonuses = payrollBonuses(r);
            const st = STATUS_MAP[r.status] || { label: r.status, cls: "badge-gray" };
            return (
              <Surface key={r.id} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0">
                    {r.employee?.photoUrl
                      ? <img src={photoThumbUrl(r.employee.photoUrl)} alt={r.employee.fullName} className="w-10 h-10 rounded-full object-cover" loading="lazy" decoding="async" />
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

                <div className="mt-3 flex gap-2">
                  {r.status === "DRAFT" && (
                    <Button
                      onClick={() => approveMutation.mutate(r.id)}
                      loading={approveMutation.isPending}
                      variant="secondary"
                      size="sm"
                      className="flex-1 text-indigo-500"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Tasdiqlash
                    </Button>
                  )}
                  <Button
                    onClick={() => handlePayslip(r.employee.id, r.employee.fullName)}
                    loading={payslipLoading === r.employee.id}
                    variant="secondary"
                    size="sm"
                    className="flex-1 text-rose-500"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    PDF varaqasi
                  </Button>
                </div>
              </Surface>
            );
          })}
        </div>}

        {/* ── Desktop table ── */}
        {!isError && <TableShell className="hidden sm:block" maxHeight="none">
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
                  const deductions = payrollDeductions(r);
                  const bonuses = payrollBonuses(r);
                  return (
                    <tr key={r.id} className="border-b border-[var(--border)] table-row-hover">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {r.employee?.photoUrl
                              ? <img src={photoThumbUrl(r.employee.photoUrl)} alt={r.employee.fullName} className="w-8 h-8 rounded-full object-cover ring-1 ring-[var(--border)]" loading="lazy" decoding="async" />
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
                        <div className="flex items-center gap-2">
                          {r.status === "DRAFT" && (
                            <Button
                              onClick={() => approveMutation.mutate(r.id)}
                              loading={approveMutation.isPending}
                              variant="ghost"
                              size="sm"
                              className="whitespace-nowrap text-indigo-500"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Tasdiqlash
                            </Button>
                          )}
                          <Button
                            onClick={() => handlePayslip(r.employee.id, r.employee.fullName)}
                            loading={payslipLoading === r.employee.id}
                            variant="ghost"
                            size="sm"
                            title="PDF Maosh varaqasi"
                            className="whitespace-nowrap text-rose-500"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            PDF
                          </Button>
                        </div>
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
                <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} variant="ghost" size="icon" className="h-8 w-8" aria-label="Oldingi sahifa">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-[var(--text-muted)] px-2">{page} / {totalPages}</span>
                <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} variant="ghost" size="icon" className="h-8 w-8" aria-label="Keyingi sahifa">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </TableShell>}

        {/* Mobile pagination */}
        {totalPages > 1 && (
          <div className="flex sm:hidden items-center justify-between">
            <p className="text-xs text-[var(--text-muted)]">{(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} / {total}</p>
            <div className="flex items-center gap-1">
              <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} variant="ghost" size="icon" aria-label="Oldingi sahifa">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-[var(--text-muted)] px-2">{page}/{totalPages}</span>
              <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} variant="ghost" size="icon" aria-label="Keyingi sahifa">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <PayrollPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={() => generateMutation.mutate()}
        isPending={generateMutation.isPending}
        month={month}
        year={year}
        deptName={(departments as any[]).find((d) => d.id === deptFilter)?.name}
        records={records}
      />
    </div>
  );
}
