"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { reportsApi, departmentsApi, downloadBlob } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import {
  FileSpreadsheet, Download, CalendarDays,
  ClipboardList, DollarSign, BarChart3,
} from "lucide-react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { useAuthStore } from "@/stores/auth";
import { isSuperLike } from "@/lib/utils";
dayjs.extend(isoWeek);

type ReportCard = {
  icon: React.ElementType;
  iconBg: string;
  title: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: () => Promise<any>;
  filename: string;
};

export default function ReportsPage() {
  const { user, selectedHospital } = useAuthStore();
  const targetHospitalId = isSuperLike(user?.role) ? (selectedHospital?.id || undefined) : undefined;
  const params = targetHospitalId ? { targetHospitalId } : undefined;

  const [month, setMonth] = useState(dayjs().month() + 1);
  const [year, setYear]   = useState(dayjs().year());
  const [deptFilter, setDeptFilter] = useState("");
  const [weekStart, setWeekStart] = useState(
    dayjs().startOf("isoWeek").format("YYYY-MM-DD")
  );
  const [loading, setLoading] = useState<string | null>(null);

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", targetHospitalId],
    queryFn: () => departmentsApi.list(params),
  });

  const download = async (key: string, fn: () => Promise<any>, filename: string) => {
    setLoading(key);
    try {
      const res = await fn();
      downloadBlob(res.data, filename);
      toast.success(`${filename} yuklab olindi`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Export xatoligi");
    } finally {
      setLoading(null);
    }
  };

  const reports: ReportCard[] = [
    {
      icon: ClipboardList,
      iconBg: "bg-indigo-600",
      title: "Oylik davomat hisoboti",
      description: "Tanlangan oy uchun barcha xodimlar davomati: keldi, kechikdi, kelmadi, erta ketdi.",
      filename: `davomat-${year}-${month}.xlsx`,
      action: () => reportsApi.attendanceExcel({ month, year, departmentId: deptFilter || undefined, targetHospitalId }),
    },
    {
      icon: DollarSign,
      iconBg: "bg-emerald-600",
      title: "Oylik maosh hisoboti",
      description: "Tanlangan oy uchun xodimlar maoshi: asosiy, kesimlar, bonuslar, sof maosh.",
      filename: `maosh-${year}-${month}.xlsx`,
      action: () => reportsApi.payrollExcel({ month, year, departmentId: deptFilter || undefined, targetHospitalId }),
    },
    {
      icon: CalendarDays,
      iconBg: "bg-violet-600",
      title: "Haftalik davomat hisoboti",
      description: "Tanlangan hafta uchun davomat xulosasi va kechikish statistikasi.",
      filename: `haftalik-davomat-${weekStart}.xlsx`,
      action: () => reportsApi.weeklyExcel({ weekStart, departmentId: deptFilter || undefined, targetHospitalId }),
    },
  ];

  return (
    <div>
      <Topbar title="Hisobotlar" subtitle="Excel formatida yuklab olish" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* ── Filters ── */}
        <div className="card p-4">
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Filtr parametrlari</h3>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--text-muted)]">Oy</label>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input-field">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{dayjs().month(m - 1).format("MMMM")}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--text-muted)]">Yil</label>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-field">
                {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--text-muted)]">Hafta boshlanishi</label>
              <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className="input-field" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--text-muted)]">Bo&apos;lim</label>
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="input-field">
                <option value="">Barcha bo&apos;limlar</option>
                {(departments as any[]).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Report Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reports.map((r) => (
            <div key={r.title} className="card p-5 flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${r.iconBg} flex-shrink-0`}>
                  <r.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] text-sm">{r.title}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">{r.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-[var(--border)]">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-xs text-[var(--text-muted)] font-mono truncate flex-1">{r.filename}</span>
              </div>

              <button
                onClick={() => download(r.title, r.action, r.filename)}
                disabled={loading === r.title}
                className="btn-primary w-full"
              >
                {loading === r.title ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Yuklanmoqda...
                  </span>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Excel yuklab olish
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* ── Info box ── */}
        <div className="card p-4 flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Hisobotlar haqida</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
              Barcha hisobotlar Excel (.xlsx) formatida yuklab olinadi. Bo&apos;lim filtri bo&apos;sh qoldirilsa,
              barcha bo&apos;limlar bo&apos;yicha umumiy hisobot hosil bo&apos;ladi.
              Maosh hisoboti &quot;Hisoblash&quot; tugmasi bosilgandan keyin mavjud bo&apos;ladi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
