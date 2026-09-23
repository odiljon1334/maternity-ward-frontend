"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { reportsApi, departmentsApi, downloadBlob } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import {
  FileSpreadsheet, Download, CalendarDays,
  ClipboardList, DollarSign, BarChart3, FileText,
} from "lucide-react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { useAuthStore } from "@/stores/auth";
import { isSuperLike } from "@/lib/utils";
import { Button, Field, Select, Input, Surface, StatePanel } from "@/components/ui";
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

  const { data: departments = [], isError: departmentsError, isFetching: departmentsFetching, refetch: refetchDepartments } = useQuery({
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
      description: "Rejadagi, kelgan, kelmagan, kech qolgan va erta ketgan kunlar, ish soati hamda to‘liq oylik hisob-kitob.",
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
    {
      icon: FileText,
      iconBg: "bg-amber-600",
      title: "T-13 tabel (1C:ZUP uchun)",
      description: "Standart T-13 shaklidagi (Я/Н/В/ОТ/Б kodlari bilan) tabel — buxgalteriya 1C:ZUP'ga qo'lda qayta kiritmasdan foydalanishi mumkin.",
      filename: `T-13-tabel-${year}-${month}.xlsx`,
      action: () => reportsApi.t13Excel({ month, year, departmentId: deptFilter || undefined, targetHospitalId }),
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Topbar title="Hisobotlar" subtitle="Excel formatida yuklab olish" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* ── Filters ── */}
        <Surface className="p-4 sm:p-5">
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Filtr parametrlari</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="Oy">
              <Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{dayjs().month(m - 1).format("MMMM")}</option>
                ))}
              </Select>
            </Field>

            <Field label="Yil">
              <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
              </Select>
            </Field>

            <Field label="Hafta boshlanishi">
              <Input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
            </Field>

            <Field label="Bo‘lim">
              <Select disabled={departmentsError} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                <option value="">Barcha bo&apos;limlar</option>
                {(departments as any[]).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
          </div>
          {departmentsError && (
            <StatePanel
              kind="error"
              title="Bo‘limlarni yuklab bo‘lmadi"
              description="Hisobot filtrlari uchun bo‘limlar ro‘yxati olinmadi."
              actionLabel="Qayta urinish"
              onAction={() => void refetchDepartments()}
              actionLoading={departmentsFetching}
              className="mt-4 min-h-28"
            />
          )}
        </Surface>

        {/* ── Report Cards ── */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {reports.map((r) => (
            <Surface key={r.title} className="flex flex-col gap-4 p-5">
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

              <Button
                onClick={() => download(r.title, r.action, r.filename)}
                loading={loading === r.title}
                loadingLabel="Yuklanmoqda..."
                className="mt-auto w-full"
              >
                <Download className="w-4 h-4" />
                Excel yuklab olish
              </Button>
            </Surface>
          ))}
        </div>

        {/* ── Info box ── */}
        <Surface tone="muted" className="flex items-start gap-3 p-4">
          <BarChart3 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Hisobotlar haqida</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
              Barcha hisobotlar Excel (.xlsx) formatida yuklab olinadi. Bo&apos;lim filtri bo&apos;sh qoldirilsa,
              barcha bo&apos;limlar bo&apos;yicha umumiy hisobot hosil bo&apos;ladi.
              Maosh hisoboti payroll hali yaratilmagan bo&apos;lsa ham tanlangan oy davomatidan joriy hisobni ko&apos;rsatadi.
            </p>
          </div>
        </Surface>
      </div>
    </div>
  );
}
