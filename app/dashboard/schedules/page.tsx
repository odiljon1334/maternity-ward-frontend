"use client";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { schedulesApi, employeesApi, shiftsApi, departmentsApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Zap, X, Edit3, Check } from "lucide-react";
import dayjs from "dayjs";
import { useAuthStore } from "@/stores/auth";

// ─── Ish kunlari ─────────────────────────────────────────────────────────────
const WEEK_DAYS = [
  { value: 1, label: "Du" },
  { value: 2, label: "Se" },
  { value: 3, label: "Ch" },
  { value: 4, label: "Pa" },
  { value: 5, label: "Ju" },
  { value: 6, label: "Sha" },
  { value: 0, label: "Yak" },
];

const PATTERNS = [
  { value: "FIXED_DAY",  label: "Faqat kunduzgi (o'zgarmas)" },
  { value: "FIXED_NIGHT",label: "Faqat kechki (o'zgarmas)" },
  { value: "2-2",        label: "2-2 (2 hafta kunduz, 2 hafta kech)" },
  { value: "1-1",        label: "1-1 (1 hafta kunduz, 1 hafta kech)" },
  { value: "3-1",        label: "3-1 (3 hafta kunduz, 1 hafta kech)" },
];

// ─── Jadval katakchasi rangi ──────────────────────────────────────────────────
function CellBadge({ sch }: { sch?: any }) {
  if (!sch) return <span className="text-gray-700 text-[10px]">—</span>;
  if (sch.status === "DAY_OFF") return <span className="text-gray-600 text-[10px]">○</span>;
  const type = sch.shift?.type;
  if (type === "DAYTIME")   return <span className="badge-blue  px-1 py-0.5 text-[10px]">K</span>;
  if (type === "NIGHTTIME") return <span className="badge-purple px-1 py-0.5 text-[10px]">Tu</span>;
  return <span className="text-indigo-400 text-[10px]">✓</span>;
}

// ─── Cell Edit Modal ──────────────────────────────────────────────────────────
function CellEditModal({
  entry, shifts, onClose,
}: {
  entry: { id: string; status: string; shiftId: string; employeeName: string; date: string } | null;
  shifts: any[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>(entry?.status ?? "WORKING");
  const [shiftId, setShiftId] = useState<string>(entry?.shiftId ?? "");

  const mutation = useMutation({
    mutationFn: () => schedulesApi.update(entry!.id, { status, shiftId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedules-monthly"] });
      toast.success("Grafik yangilandi");
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  if (!entry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">Grafik tahrirlash</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{entry.employeeName} — {dayjs(entry.date).format("DD.MM.YYYY")}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Holat</label>
            <div className="flex gap-2">
              {[
                { v: "WORKING", l: "Ish kuni" },
                { v: "DAY_OFF", l: "Dam olish" },
              ].map((s) => (
                <button
                  key={s.v}
                  onClick={() => setStatus(s.v)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-colors border",
                    status === s.v
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-[var(--border)] text-[var(--text-muted)] hover:border-indigo-500"
                  )}
                >
                  {s.l}
                </button>
              ))}
            </div>
          </div>

          {status === "WORKING" && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Smen</label>
              <select
                value={shiftId}
                onChange={(e) => setShiftId(e.target.value)}
                className="input-field"
              >
                <option value="">Tanlang</option>
                {shifts.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.type === "DAYTIME" ? "Kunduzgi" : "Kechki"})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1">Bekor</button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="btn-primary flex-1 gap-2"
            >
              <Check className="w-4 h-4" />
              {mutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Generate Modal ───────────────────────────────────────────────────────────
function GenerateModal({
  open, onClose, employees, shifts, departments, targetHospitalId,
}: any) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<"bulk" | "single">("bulk");
  const [form, setForm] = useState({
    month: dayjs().month() + 1,
    year: dayjs().year(),
    pattern: "FIXED_DAY",
    startsWith: "DAYTIME",
    departmentId: "",
    employeeId: "",
  });
  // Ish kunlari — default: Du–Ju (1–5)
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);

  const toggleDay = (d: number) =>
    setWorkDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    );

  const isRotating = !form.pattern.startsWith("FIXED");

  const mutation = useMutation({
    mutationFn: () =>
      mode === "bulk"
        ? schedulesApi.bulkGenerate({
            month: form.month,
            year: form.year,
            pattern: form.pattern,
            startsWith: form.startsWith,
            workDays,
            departmentId: form.departmentId || undefined,
            ...(targetHospitalId && { targetHospitalId }),
          })
        : schedulesApi.generate({
            employeeId: form.employeeId,
            month: form.month,
            year: form.year,
            pattern: form.pattern,
            startsWith: form.startsWith,
            workDays,
          }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["schedules-monthly"] });
      const count = Array.isArray(res) ? res.length : (res.created ?? "");
      toast.success(`Grafik yaratildi: ${count} ta`);
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-card)] z-10">
          <h2 className="font-semibold text-[var(--text-primary)]">Grafik yaratish</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Mode */}
          <div className="flex gap-2 p-1 bg-[var(--bg-primary)] rounded-lg">
            {[{ v: "bulk", l: "Barcha / Bo'lim" }, { v: "single", l: "Bitta xodim" }].map((m) => (
              <button
                key={m.v}
                onClick={() => setMode(m.v as any)}
                className={cn(
                  "flex-1 py-1.5 rounded-md text-sm font-medium transition-colors",
                  mode === m.v
                    ? "bg-indigo-600 text-white"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                {m.l}
              </button>
            ))}
          </div>

          {/* Oy / Yil */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Oy</label>
              <select
                value={form.month}
                onChange={(e) => setForm((f) => ({ ...f, month: +e.target.value }))}
                className="input-field"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{dayjs().month(m - 1).format("MMMM")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Yil</label>
              <select
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: +e.target.value }))}
                className="input-field"
              >
                {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Bo'lim (bulk) */}
          {mode === "bulk" && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Bo'lim (ixtiyoriy)</label>
              <select
                value={form.departmentId}
                onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
                className="input-field"
              >
                <option value="">Barcha bo'limlar</option>
                {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}

          {/* Xodim (single) */}
          {mode === "single" && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Xodim</label>
              <select
                value={form.employeeId}
                onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                className="input-field"
              >
                <option value="">Tanlang</option>
                {employees.map((e: any) => (
                  <option key={e.id} value={e.id}>{e.fullName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Ish kunlari */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">
              Ish kunlari
            </label>
            <div className="flex flex-wrap gap-2">
              {WEEK_DAYS.map((d) => {
                const active = workDays.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={cn(
                      "w-10 h-10 rounded-lg text-sm font-medium border transition-colors",
                      active
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : d.value === 0 || d.value === 6
                        ? "border-red-900/40 text-red-400/70 hover:border-red-600/50"
                        : "border-[var(--border)] text-[var(--text-muted)] hover:border-indigo-500"
                    )}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
              ✅ Tanlangan kunlar = ish kuni | ☐ Tanlanmagan = dam olish
            </p>
          </div>

          {/* Smen pattern */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Smen turi</label>
            <select
              value={form.pattern}
              onChange={(e) => setForm((f) => ({ ...f, pattern: e.target.value }))}
              className="input-field"
            >
              {PATTERNS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          {/* Boshlash uchun (faqat rotating pattern) */}
          {isRotating && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">1-hafta boshlash</label>
              <select
                value={form.startsWith}
                onChange={(e) => setForm((f) => ({ ...f, startsWith: e.target.value }))}
                className="input-field"
              >
                <option value="DAYTIME">Kunduzgi smen</option>
                <option value="NIGHTTIME">Kechki smen</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1">Bekor</button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || (mode === "single" && !form.employeeId)}
              className="btn-primary flex-1 gap-2"
            >
              <Zap className="w-4 h-4" />
              {mutation.isPending ? "Yaratilmoqda..." : "Grafik yaratish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SchedulesPage() {
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [year, setYear] = useState(dayjs().year());
  const [deptFilter, setDeptFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<any>(null);

  const { selectedHospital } = useAuthStore();
  const targetHospitalId = selectedHospital?.id;

  // Monthly schedules — barcha hodimlar uchun bir oylik grafik
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["schedules-monthly", month, year, targetHospitalId],
    queryFn: () =>
      schedulesApi.monthly({ month, year, ...(targetHospitalId && { targetHospitalId }) }),
  });

  const { data: employeesResp } = useQuery({
    queryKey: ["employees-all", targetHospitalId],
    queryFn: () => employeesApi.list({ limit: 500, ...(targetHospitalId && { targetHospitalId }) }),
  });
  const allEmployees: any[] = Array.isArray(employeesResp)
    ? employeesResp
    : ((employeesResp as any)?.data ?? []);

  const { data: shifts = [] } = useQuery({
    queryKey: ["shifts", targetHospitalId],
    queryFn: () => shiftsApi.list(targetHospitalId ? { targetHospitalId } : undefined),
  });
  const { data: departments = [] } = useQuery({
    queryKey: ["departments", targetHospitalId],
    queryFn: () => departmentsApi.list(targetHospitalId ? { targetHospitalId } : undefined),
  });

  // Grafik ma'lumotlarini: employeeId → { YYYY-MM-DD → schedule } formatga o'tkazish
  const scheduleMap = useMemo(() => {
    const map = new Map<string, Map<string, any>>();
    for (const s of schedules as any[]) {
      if (!map.has(s.employeeId)) map.set(s.employeeId, new Map());
      const dateKey = dayjs(s.date).format("YYYY-MM-DD");
      map.get(s.employeeId)!.set(dateKey, s);
    }
    return map;
  }, [schedules]);

  // Bo'lim bo'yicha filter
  const employees = useMemo(
    () =>
      deptFilter
        ? allEmployees.filter((e) => e.department?.id === deptFilter || e.departmentId === deptFilter)
        : allEmployees,
    [allEmployees, deptFilter]
  );

  const daysInMonth = dayjs(`${year}-${String(month).padStart(2, "0")}-01`).daysInMonth();

  // Statistika
  const stats = useMemo(() => {
    const all = schedules as any[];
    const working = all.filter((s) => s.status === "WORKING").length;
    const dayOff = all.filter((s) => s.status === "DAY_OFF").length;
    const day   = all.filter((s) => s.status === "WORKING" && s.shift?.type === "DAYTIME").length;
    const night = all.filter((s) => s.status === "WORKING" && s.shift?.type === "NIGHTTIME").length;
    return { working, dayOff, day, night };
  }, [schedules]);

  const navMonth = (dir: number) => {
    const next = dayjs(`${year}-${String(month).padStart(2, "0")}-01`).add(dir, "month");
    setMonth(next.month() + 1);
    setYear(next.year());
  };

  return (
    <div>
      <Topbar title="Grafik" subtitle="Oylik ish grafigi" />

      <div className="p-6 space-y-4">
        {/* Header controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month nav */}
          <div className="flex items-center gap-1 card px-2 py-1">
            <button onClick={() => navMonth(-1)} className="btn-ghost p-1.5">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-medium text-[var(--text-primary)] min-w-32 text-center">
              {dayjs(`${year}-${String(month).padStart(2, "0")}-01`).format("MMMM YYYY")}
            </span>
            <button onClick={() => navMonth(1)} className="btn-ghost p-1.5">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Dept filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="input-field w-auto text-sm"
          >
            <option value="">Barcha bo'limlar</option>
            {(departments as any[]).map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Stats mini chips */}
          {(schedules as any[]).length > 0 && (
            <div className="flex gap-2 text-xs">
              <span className="badge-blue px-2 py-1">K: {stats.day}</span>
              <span className="badge-purple px-2 py-1">Tu: {stats.night}</span>
              <span className="px-2 py-1 rounded-full bg-[var(--bg-hover)] text-[var(--text-muted)]">○ {stats.dayOff}</span>
            </div>
          )}

          <button onClick={() => setModalOpen(true)} className="btn-primary gap-2 ml-auto">
            <Zap className="w-4 h-4" /> Grafik yaratish
          </button>
        </div>

        {/* Calendar table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="sticky left-0 bg-[var(--bg-card)] z-10 text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase min-w-48">
                    Xodim
                  </th>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const d = dayjs(`${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`);
                    const isWeekend = d.day() === 0 || d.day() === 6;
                    const isToday = d.isSame(dayjs(), "day");
                    return (
                      <th
                        key={i}
                        className={cn(
                          "text-center py-2 px-0.5 font-medium min-w-9",
                          isWeekend ? "text-gray-600" : "text-[var(--text-muted)]",
                          isToday && "bg-indigo-950/30"
                        )}
                      >
                        <div className={cn(isToday && "text-indigo-400 font-bold")}>{i + 1}</div>
                        <div className="text-[10px] opacity-60">{d.format("dd")}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {isLoading &&
                  [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b border-[var(--border)]">
                      <td className="px-4 py-3">
                        <div className="h-4 w-36 rounded bg-[var(--bg-hover)] animate-pulse" />
                      </td>
                      {[...Array(daysInMonth)].map((_, j) => (
                        <td key={j} className="px-0.5 py-3">
                          <div className="h-5 w-8 rounded bg-[var(--bg-hover)] animate-pulse mx-auto" />
                        </td>
                      ))}
                    </tr>
                  ))}

                {!isLoading && employees.length === 0 && (
                  <tr>
                    <td
                      colSpan={daysInMonth + 1}
                      className="text-center py-12 text-[var(--text-muted)]"
                    >
                      Xodimlar topilmadi
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  employees.map((emp: any) => {
                    const empSchedules = scheduleMap.get(emp.id);
                    return (
                      <tr key={emp.id} className="border-b border-[var(--border)] group hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="sticky left-0 bg-[var(--bg-card)] group-hover:bg-[var(--bg-hover)] z-10 px-4 py-2.5 transition-colors">
                          <p className="font-medium text-[var(--text-primary)] truncate max-w-44">{emp.fullName}</p>
                          <p className="text-[10px] text-[var(--text-muted)] truncate">{emp.department?.name}</p>
                        </td>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
                          const d = dayjs(dateStr);
                          const isWeekend = d.day() === 0 || d.day() === 6;
                          const isToday = d.isSame(dayjs(), "day");
                          const sch = empSchedules?.get(dateStr);

                          return (
                            <td
                              key={i}
                              className={cn(
                                "text-center px-0.5 py-2",
                                isWeekend && "bg-[var(--bg-primary)]/30",
                                isToday && "bg-indigo-950/20",
                                sch && "cursor-pointer hover:bg-indigo-950/30 transition-colors"
                              )}
                              onClick={() => {
                                if (!sch) return;
                                setEditEntry({
                                  id: sch.id,
                                  status: sch.status,
                                  shiftId: sch.shiftId,
                                  employeeName: emp.fullName,
                                  date: dateStr,
                                });
                              }}
                            >
                              <CellBadge sch={sch} />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <span className="badge-blue px-1.5 py-0.5">K</span> Kunduzgi smen
            </span>
            <span className="flex items-center gap-1.5">
              <span className="badge-purple px-1.5 py-0.5">Tu</span> Kechki smen
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 text-center text-gray-500">○</span> Dam olish
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 text-center text-gray-700">—</span> Grafik yo'q
            </span>
            <span className="flex items-center gap-1.5 ml-auto">
              <Edit3 className="w-3 h-3" /> Katakchaga bosib tahrirlash
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <GenerateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        employees={allEmployees}
        shifts={shifts}
        departments={departments}
        targetHospitalId={targetHospitalId}
      />

      <CellEditModal
        entry={editEntry}
        shifts={shifts as any[]}
        onClose={() => setEditEntry(null)}
      />
    </div>
  );
}
