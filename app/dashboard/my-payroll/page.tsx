"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { payrollApi, downloadBlob } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { formatMoney, formatMinutes, cn } from "@/lib/utils";
import {
  DollarSign, Download,
  FileText, RefreshCw, ChevronDown, Clock,
  CheckCircle, Clock3, Sparkles, Wallet, Calendar,
} from "lucide-react";
import dayjs from "dayjs";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; icon: any; cls: string }> = {
  DRAFT:    { label: "Qoralama",     icon: Clock3,      cls: "text-amber-400 bg-amber-500/10 border-amber-500/20"     },
  APPROVED: { label: "Tasdiqlangan", icon: CheckCircle, cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  PAID:     { label: "To'langan",    icon: CheckCircle, cls: "text-blue-400 bg-blue-500/10 border-blue-500/20"         },
};

const MONTH_NAMES = [
  "", "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
];

// Joriy yildan -1 … +2 yillar
const YEARS = Array.from({ length: 4 }, (_, i) => dayjs().year() - 1 + i);

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function calcTotalDeductions(r: any): number {
  return (
    Number(r.absenceDeduction   ?? 0) +
    Number(r.lateDeduction      ?? 0) +
    Number(r.earlyLeaveDeduction ?? 0) +
    Number(r.manualDeduction    ?? 0)
  );
}

function calcTotalBonuses(r: any): number {
  return Number(r.overtimeBonus ?? 0) + Number(r.manualBonus ?? 0);
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const st = STATUS_MAP[status];
  if (!st) return (
    <span className="px-3 py-1.5 rounded-xl border text-xs font-bold text-slate-400 bg-slate-500/10 border-slate-500/20">
      {status}
    </span>
  );
  return (
    <span className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold", st.cls)}>
      <st.icon className="w-3.5 h-3.5" />
      {st.label}
    </span>
  );
}

// ─── DOWNLOAD BUTTON ──────────────────────────────────────────────────────────

function DownloadBtn({
  recordId, month, year, downloadingId, onDownload, variant = "primary",
}: {
  recordId:    string;
  month:       number;
  year:        number;
  downloadingId: string | null;
  onDownload:  (month: number, year: number, id: string) => void;
  variant?:    "primary" | "ghost";
}) {
  const isDownloading = downloadingId === recordId;
  return (
    <button
      onClick={() => onDownload(month, year, recordId)}
      disabled={isDownloading}
      className={cn(
        "w-full flex items-center justify-center gap-2 text-xs font-bold transition-all rounded-2xl py-3",
        variant === "primary"
          ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 uppercase tracking-wider"
          : "text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10",
      )}
    >
      {isDownloading
        ? <RefreshCw className="w-4 h-4 animate-spin" />
        : variant === "primary"
          ? <FileText className="w-4 h-4" />
          : <Download className="w-4 h-4" />}
      PDF varaqasini yuklab olish
    </button>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function MyPayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);
  const [selectedYear,  setSelectedYear]  = useState(dayjs().year());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["my-payroll", selectedMonth, selectedYear],
    queryFn:  () => payrollApi.myList({ month: selectedMonth, year: selectedYear }),
    staleTime: 2 * 60_000,
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

  // So'nggi yozuv — history listda takrorlanmasligi uchun ID sini saqlaymiz
  const latest   = (records as any[])[0];
  const latestId = latest?.id;

  return (
    <div className="min-h-screen pb-20">
      <Topbar title="Maoshim" subtitle="Oylik hisob-kitoblar tarixi" />

      <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-5">

        {/* ── Banner ────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/50 via-indigo-950/40 to-[var(--bg-card)] border dark:border-emerald-500/20 p-6 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-emerald-400">
            <Wallet className="w-32 h-32" />
          </div>
          <div className="relative z-10 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Moliyaviy balans
            </div>
            <h2 className="text-xl font-black text-[var(--text-primary)]">Daromadlaringiz nazorati</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Har oylik ish haqi, mukofot pullari va davomat bo'yicha chegirmalarni kuzatib boring.
            </p>
          </div>
        </div>

        {/* ── Filters ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Oy */}
          <div className="relative flex-1">
            <select
              value={selectedMonth ?? ""}
              onChange={e => setSelectedMonth(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full appearance-none bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl px-4 py-3 text-sm text-[var(--text-primary)] pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer shadow-sm"
            >
              <option value="">Barcha oylar</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{MONTH_NAMES[m]}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          </div>

          {/* Yil — dinamik */}
          <div className="relative w-32">
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="w-full appearance-none bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl px-4 py-3 text-sm text-[var(--text-primary)] pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer shadow-sm"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>

        {/* ── Skeleton ──────────────────────────────────────────────── */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] p-5 animate-pulse h-40" />
            ))}
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────── */}
        {!isLoading && (records as any[]).length === 0 && (
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

        {/* ── So'nggi hisob-kitob (featured card) ──────────────────── */}
        {!isLoading && latest && (
          <div className="rounded-3xl bg-[var(--bg-card)] border border-indigo-500/30 p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                  So'nggi hisob-kitob
                </span>
                <h3 className="text-lg font-black text-[var(--text-primary)] mt-0.5">
                  {MONTH_NAMES[latest.month]} {latest.year}
                </h3>
              </div>
              <StatusBadge status={latest.status} />
            </div>

            {/* Net salary */}
            <div className="text-center py-6 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent rounded-2xl border border-emerald-500/20">
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                Sof maosh miqdori
              </p>
              <p className="text-4xl font-black text-emerald-400 tracking-tight">
                {formatMoney(latest.netSalary)}
              </p>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {[
                { label: "Asosiy maosh", value: formatMoney(latest.baseSalary),   color: ""                },
                { label: "Ish kunlari",  value: `${latest.totalWorkDays} kun`,    color: ""                },
                { label: "Yo'qlik",      value: `${latest.totalAbsences} kun`,    color: latest.totalAbsences > 0 ? "text-rose-400" : "" },
                { label: "Ish soati",    value: latest.totalNetWorkMin > 0 ? formatMinutes(latest.totalNetWorkMin) : "—", color: "text-indigo-400" },
                {
                  label: "Jami kesimlar",
                  value: calcTotalDeductions(latest) > 0 ? `−${formatMoney(calcTotalDeductions(latest))}` : "—",
                  color: calcTotalDeductions(latest) > 0 ? "text-rose-400" : "",
                },
                {
                  label: "Jami bonuslar",
                  value: calcTotalBonuses(latest) > 0 ? `+${formatMoney(calcTotalBonuses(latest))}` : "—",
                  color: calcTotalBonuses(latest) > 0 ? "text-emerald-400" : "",
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between p-3 bg-[var(--bg-main)] rounded-2xl border border-[var(--border)]">
                  <span className="text-[var(--text-muted)] font-medium">{label}</span>
                  <span className={cn("font-bold", color || "text-[var(--text-primary)]")}>{value}</span>
                </div>
              ))}
            </div>

            <DownloadBtn
              recordId={latest.id}
              month={latest.month}
              year={latest.year}
              downloadingId={downloadingId}
              onDownload={handleDownload}
              variant="primary"
            />
          </div>
        )}

        {/* ── Tarix ro'yxati (latest dan tashqari) ─────────────────── */}
        {!isLoading && (records as any[]).length > 1 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Maosh tarixi
              </h3>
              <span className="text-xs font-bold text-[var(--text-muted)]">
                {(records as any[]).length - 1} ta yozuv
              </span>
            </div>

            {(records as any[])
              // ✅ latest takrorlanmaydi
              .filter((r: any) => r.id !== latestId)
              .map((r: any) => {
                const deductions = calcTotalDeductions(r);
                const bonuses    = calcTotalBonuses(r);
                const st         = STATUS_MAP[r.status];

                return (
                  <div
                    key={r.id}
                    className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] p-5 space-y-4 shadow-lg hover:border-indigo-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-black text-sm text-[var(--text-primary)]">
                          {MONTH_NAMES[r.month]} {r.year}
                        </h4>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {r.totalWorkDays} ish kuni ·{" "}
                          <span className="text-rose-400">{r.totalAbsences} yo'qlik</span>
                        </p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>

                    {/* Mini breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <MiniCell label="Asosiy"    value={formatMoney(r.baseSalary)} />
                      <MiniCell
                        label="Kesim"
                        value={deductions > 0 ? `−${formatMoney(deductions)}` : "—"}
                        color={deductions > 0 ? "text-rose-400" : ""}
                        bg={deductions > 0 ? "bg-rose-500/5 border-rose-500/10" : ""}
                      />
                      <MiniCell
                        label="Bonus"
                        value={bonuses > 0 ? `+${formatMoney(bonuses)}` : "—"}
                        color={bonuses > 0 ? "text-emerald-400" : ""}
                        bg={bonuses > 0 ? "bg-emerald-500/5 border-emerald-500/10" : ""}
                      />
                      <MiniCell
                        label="Sof maosh"
                        value={formatMoney(r.netSalary)}
                        color="text-indigo-400"
                        bg="bg-indigo-500/10 border-indigo-500/20"
                      />
                    </div>

                    <DownloadBtn
                      recordId={r.id}
                      month={r.month}
                      year={r.year}
                      downloadingId={downloadingId}
                      onDownload={handleDownload}
                      variant="ghost"
                    />
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MINI CELL ────────────────────────────────────────────────────────────────

function MiniCell({
  label, value, color = "", bg = "",
}: {
  label:  string;
  value:  string;
  color?: string;
  bg?:    string;
}) {
  return (
    <div className={cn(
      "text-center p-2.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-main)]",
      bg,
    )}>
      <p className="text-[var(--text-muted)] font-medium text-[11px]">{label}</p>
      <p className={cn("font-bold mt-0.5", color || "text-[var(--text-primary)]")}>{value}</p>
    </div>
  );
}