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
  CheckCircle, AlertCircle, Clock3, Sparkles, Wallet, Award, ArrowUpRight, ArrowDownRight
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

  const latest = records[0];

  return (
    <div className="min-h-screen pb-20">
      <Topbar title="Maoshim" subtitle="Oylik hisob-kitoblar tarixi" />

      <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">

        {/* ── Kreativ Header Banner ────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/50 via-indigo-950/40 to-[var(--bg-card)] border dark:border-emerald-500/20 p-6 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-emerald-400">
            <Wallet className="w-32 h-32" />
          </div>
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Moliyaviy balans
            </div>
            <h2 className="text-xl font-black text-[var(--text-primary)]">Daromadlaringiz nazorati</h2>
            <p className="text-xs text-[var(--text-muted)] font-medium">
              Har oylik ish haqi, mukofot pullari va davomat bo'yicha chegirmalarni kuzatib boring.
            </p>
          </div>
        </div>

        {/* ── Filter bar ───────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <select
              value={selectedMonth ?? ""}
              onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full appearance-none bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl px-4 py-3 text-sm text-[var(--text-primary)] pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer shadow-sm"
            >
              <option value="">Barcha oylar</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{MONTH_NAMES[m]}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          </div>
          <div className="relative w-32">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full appearance-none bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl px-4 py-3 text-sm text-[var(--text-primary)] pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer shadow-sm"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>

        {/* ── Latest record summary card ─────────────────── */}
        {latest && (
          <div className="rounded-3xl bg-[var(--bg-card)] border border-indigo-500/30 p-6 shadow-2xl relative overflow-hidden space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">So'nggi hisob-kitob</span>
                <h3 className="text-lg font-black text-[var(--text-primary)] mt-0.5">
                  {MONTH_NAMES[latest.month]} {latest.year}
                </h3>
              </div>
              <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold",
                STATUS_MAP[latest.status]?.cls ?? "text-gray-400 bg-gray-500/10 border-gray-500/20")}>
                {(() => { const S = STATUS_MAP[latest.status]; return S ? <S.icon className="w-3.5 h-3.5" /> : null; })()}
                {STATUS_MAP[latest.status]?.label ?? latest.status}
              </div>
            </div>

            {/* Net salary — glowing highlight box */}
            <div className="text-center py-6 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent rounded-2xl border border-emerald-500/20 relative">
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Sof maosh miqdori</p>
              <p className="text-4xl font-black text-emerald-400 tracking-tight">{formatMoney(latest.netSalary)}</p>
            </div>

            {/* Breakdown Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
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
                <div key={label} className="flex items-center justify-between p-3 bg-[var(--bg-main)] rounded-2xl border border-[var(--border)]">
                  <span className="text-[var(--text-muted)] font-medium">{label}</span>
                  <span className={cn("font-bold", color || "text-[var(--text-primary)]")}>{value}</span>
                </div>
              ))}
            </div>

            {/* Download button */}
            <button
              onClick={() => handleDownload(latest.month, latest.year, latest.id)}
              disabled={downloadingId === latest.id}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-lg shadow-indigo-500/25 text-xs font-bold uppercase tracking-wider"
            >
              {downloadingId === latest.id
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <FileText className="w-4 h-4" />}
              PDF Maosh varaqasini yuklab olish
            </button>
          </div>
        )}

        {/* ── History list ──────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Maosh tarixi
            </h3>
            <span className="text-xs font-bold text-[var(--text-muted)]">{(records as any[]).length} ta yozuv</span>
          </div>

          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-3xl card p-5 animate-pulse h-28 bg-[var(--bg-card)] border border-[var(--border)]" />
              ))}
            </div>
          )}

          {!isLoading && records.length === 0 && (
            <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] p-12 text-center space-y-3 shadow-xl">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
                <DollarSign className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Hisoblangan maosh topilmadi</p>
              <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
                Direktor yoki ma'muriyat maosh hisoblagandan so'ng bu yerda namoyon bo'ladi.
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
                <div key={r.id} className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] p-5 space-y-4 shadow-lg hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm text-[var(--text-primary)]">
                        {MONTH_NAMES[r.month]} {r.year}
                      </h4>
                      <p className="text-xs font-medium text-[var(--text-muted)] mt-0.5">
                        {r.totalWorkDays} ish kuni · <span className="text-rose-400">{r.totalAbsences} yo'qlik</span>
                      </p>
                    </div>
                    <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold", st?.cls ?? "text-gray-400 bg-gray-500/10 border-gray-500/20")}>
                      {st && <st.icon className="w-3.5 h-3.5" />}
                      {st?.label ?? r.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="text-center p-2.5 bg-[var(--bg-main)] rounded-2xl border border-[var(--border)]">
                      <p className="text-[var(--text-muted)] font-medium text-[11px]">Asosiy</p>
                      <p className="font-bold text-[var(--text-primary)] mt-0.5">{formatMoney(r.baseSalary)}</p>
                    </div>
                    {totalDeductions > 0 ? (
                      <div className="text-center p-2.5 bg-red-500/5 rounded-2xl border border-red-500/10">
                        <p className="text-red-400/80 font-medium text-[11px]">Kesim</p>
                        <p className="font-bold text-red-400 mt-0.5">−{formatMoney(totalDeductions)}</p>
                      </div>
                    ) : (
                      <div className="text-center p-2.5 bg-[var(--bg-main)] rounded-2xl border border-[var(--border)] opacity-50">
                        <p className="text-[var(--text-muted)] font-medium text-[11px]">Kesim</p>
                        <p className="font-bold text-[var(--text-primary)] mt-0.5">—</p>
                      </div>
                    )}
                    {totalBonuses > 0 ? (
                      <div className="text-center p-2.5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                        <p className="text-emerald-400/80 font-medium text-[11px]">Bonus</p>
                        <p className="font-bold text-emerald-400 mt-0.5">+{formatMoney(totalBonuses)}</p>
                      </div>
                    ) : (
                      <div className="text-center p-2.5 bg-[var(--bg-main)] rounded-2xl border border-[var(--border)] opacity-50">
                        <p className="text-[var(--text-muted)] font-medium text-[11px]">Bonus</p>
                        <p className="font-bold text-[var(--text-primary)] mt-0.5">—</p>
                      </div>
                    )}
                    <div className="text-center p-2.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                      <p className="text-indigo-400 font-medium text-[11px]">Sof maosh</p>
                      <p className="font-bold text-indigo-400 mt-0.5">{formatMoney(r.netSalary)}</p>
                    </div>
                  </div>

                  {/* PDF download */}
                  <button
                    onClick={() => handleDownload(r.month, r.year, r.id)}
                    disabled={downloadingId === r.id}
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold text-rose-400 hover:text-rose-300 py-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition-all"
                  >
                    {downloadingId === r.id
                      ? <RefreshCw className="w-4 h-4 animate-spin" />
                      : <Download className="w-4 h-4" />}
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