"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { payrollApi, downloadBlob } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { formatMoney, formatMinutes, cn } from "@/lib/utils";
import {
  DollarSign, TrendingDown, TrendingUp, Download,
  FileText, RefreshCw, ChevronDown, Clock, Calendar,
  CheckCircle, AlertCircle, Clock3,
} from "lucide-react";
import dayjs from "dayjs";

const STATUS_MAP: Record<string, { label: string; icon: any; cls: string }> = {
  DRAFT:    { label: "Qoralama",     icon: Clock3,        cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  APPROVED: { label: "Tasdiqlangan", icon: CheckCircle,   cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  PAID:     { label: "To'langan",    icon: CheckCircle,   cls: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
};

const MONTH_NAMES = [
  '', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr',
];

export default function MyPayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);
  const [selectedYear,  setSelectedYear]  = useState(dayjs().year());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["my-payroll", selectedMonth, selectedYear],
    queryFn: () => payrollApi.myList({
      month: selectedMonth,
      year: selectedYear,
    }),
  });

  const handleDownload = async (month: number, year: number, recordId: string) => {
    setDownloadingId(recordId);
    try {
      const res = await payrollApi.downloadMyPayslip({ month, year });
      downloadBlob(res.data, `maosh_varaqasi_${month}_${year}.pdf`);
      toast.success("PDF yuklab olindi");
    } catch {
      toast.error("PDF yaratishda xatolik");
    } finally {
      setDownloadingId(null);
    }
  };

  // Summary for the latest record
  const latest = records[0];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Topbar title="Maoshim" subtitle="Oylik hisob-kitob" />

      <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-5">

        {/* ── Filter bar ───────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <select
              value={selectedMonth ?? ""}
              onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : undefined)}
              className="input-field w-full pr-8 appearance-none cursor-pointer"
            >
              <option value="">Barcha oylar</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{MONTH_NAMES[m]}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="input-field w-24 pr-8 appearance-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>

        {/* ── Latest record summary card ─────────────────── */}
        {latest && (
          <div className="card p-5 border border-indigo-500/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-[var(--text-muted)]">So'nggi hisoblangan</p>
                <p className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
                  {MONTH_NAMES[latest.month]} {latest.year}
                </p>
              </div>
              <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium",
                STATUS_MAP[latest.status]?.cls ?? "text-gray-400 bg-gray-500/10 border-gray-500/20")}>
                {(() => { const S = STATUS_MAP[latest.status]; return S ? <S.icon className="w-3.5 h-3.5" /> : null; })()}
                {STATUS_MAP[latest.status]?.label ?? latest.status}
              </div>
            </div>

            {/* Net salary — large */}
            <div className="text-center py-4 bg-[var(--bg-hover)] rounded-xl mb-4">
              <p className="text-xs text-[var(--text-muted)] mb-1">Sof maosh</p>
              <p className="text-3xl font-bold text-emerald-400">{formatMoney(latest.netSalary)}</p>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: "Asosiy maosh",  value: formatMoney(latest.baseSalary),  color: "" },
                { label: "Ish kunlari",   value: `${latest.totalWorkDays} kun`,   color: "" },
                { label: "Yo'qlik",       value: `${latest.totalAbsences} kun`,   color: latest.totalAbsences > 0 ? "text-red-400" : "" },
                {
                  label: "Ish soati",
                  value: latest.totalNetWorkMin > 0 ? formatMinutes(latest.totalNetWorkMin) : "—",
                  color: "text-indigo-400",
                },
                {
                  label: "Jami kesimlar",
                  value: `−${formatMoney(
                    Number(latest.absenceDeduction ?? 0) +
                    Number(latest.lateDeduction ?? 0) +
                    Number(latest.earlyLeaveDeduction ?? 0) +
                    Number(latest.manualDeduction ?? 0)
                  )}`,
                  color: "text-red-400",
                },
                {
                  label: "Jami bonuslar",
                  value: `+${formatMoney(Number(latest.overtimeBonus ?? 0) + Number(latest.manualBonus ?? 0))}`,
                  color: "text-emerald-400",
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between p-2 bg-[var(--bg-hover)] rounded-lg">
                  <span className="text-[var(--text-muted)]">{label}</span>
                  <span className={cn("font-semibold", color || "text-[var(--text-primary)]")}>{value}</span>
                </div>
              ))}
            </div>

            {/* Download button */}
            <button
              onClick={() => handleDownload(latest.month, latest.year, latest.id)}
              disabled={downloadingId === latest.id}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600/15 border border-rose-500/25 text-rose-400 hover:bg-rose-600/25 transition-colors text-sm font-medium"
            >
              {downloadingId === latest.id
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <FileText className="w-4 h-4" />}
              PDF Maosh varaqasini yuklab olish
            </button>
          </div>
        )}

        {/* ── History list ──────────────────────────────── */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            Maosh tarixi
          </h3>

          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-4 animate-pulse h-20" />
              ))}
            </div>
          )}

          {!isLoading && records.length === 0 && (
            <div className="card p-8 text-center">
              <DollarSign className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
              <p className="text-sm text-[var(--text-muted)]">Hisoblangan maosh topilmadi</p>
              <p className="text-xs text-[var(--text-muted)] mt-1 opacity-70">
                Direktor maosh hisoblagandan so'ng bu yerda ko'rinadi
              </p>
            </div>
          )}

          <div className="space-y-3">
            {(records as any[]).map((r: any) => {
              const totalDeductions =
                Number(r.absenceDeduction ?? 0) +
                Number(r.lateDeduction ?? 0) +
                Number(r.earlyLeaveDeduction ?? 0) +
                Number(r.manualDeduction ?? 0);
              const totalBonuses =
                Number(r.overtimeBonus ?? 0) + Number(r.manualBonus ?? 0);
              const st = STATUS_MAP[r.status];

              return (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {MONTH_NAMES[r.month]} {r.year}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {r.totalWorkDays} ish kuni · {r.totalAbsences} yo'qlik
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium", st?.cls ?? "text-gray-400 bg-gray-500/10 border-gray-500/20")}>
                        {st && <st.icon className="w-3 h-3" />}
                        {st?.label ?? r.status}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex-1 text-center p-2 bg-[var(--bg-hover)] rounded-lg">
                      <p className="text-[var(--text-muted)]">Asosiy</p>
                      <p className="font-bold text-[var(--text-primary)] mt-0.5">{formatMoney(r.baseSalary)}</p>
                    </div>
                    {totalDeductions > 0 && (
                      <div className="flex-1 text-center p-2 bg-red-500/5 rounded-lg border border-red-500/10">
                        <p className="text-[var(--text-muted)]">Kesim</p>
                        <p className="font-bold text-red-400 mt-0.5">−{formatMoney(totalDeductions)}</p>
                      </div>
                    )}
                    {totalBonuses > 0 && (
                      <div className="flex-1 text-center p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                        <p className="text-[var(--text-muted)]">Bonus</p>
                        <p className="font-bold text-emerald-400 mt-0.5">+{formatMoney(totalBonuses)}</p>
                      </div>
                    )}
                    <div className="flex-1 text-center p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                      <p className="text-[var(--text-muted)]">Sof</p>
                      <p className="font-bold text-indigo-400 mt-0.5">{formatMoney(r.netSalary)}</p>
                    </div>
                  </div>

                  {/* PDF download */}
                  <button
                    onClick={() => handleDownload(r.month, r.year, r.id)}
                    disabled={downloadingId === r.id}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 py-2 border border-rose-500/20 rounded-lg hover:bg-rose-500/5 transition-colors"
                  >
                    {downloadingId === r.id
                      ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      : <Download className="w-3.5 h-3.5" />}
                    PDF varaqasini yuklab olish
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
