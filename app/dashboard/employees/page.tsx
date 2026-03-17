"use client";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { employeesApi, departmentsApi, positionsApi, attendanceApi, downloadBlob, photoUrl as buildPhotoUrl } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { getInitials, getAvatarColor, formatMoney, cn, isSuperLike } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import {
  Plus, Search, Download, Upload, Camera,
  Trash2, X, ChevronLeft, ChevronRight, FileSpreadsheet, Coffee,
} from "lucide-react";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";

type EmpForm = {
  fullName:     string;
  gender:       "MALE" | "FEMALE";
  phone:        string;
  employeeNo:   string;
  baseSalary:   number;
  departmentId: string;
  positionId:   string;
};

// ── Employee Form Modal ──────────────────────────
function EmployeeModal({
  open, onClose, employee, departments, positions, targetHospitalId,
}: {
  open: boolean;
  onClose: () => void;
  employee?: any;
  departments: any[];
  positions: any[];
  targetHospitalId?: string;
}) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EmpForm>({
    defaultValues: { gender: "FEMALE" },
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (employee) {
      reset({
        fullName:     employee.fullName,
        gender:       employee.gender,
        phone:        employee.phone || "",
        employeeNo:   employee.employeeNo || "",
        baseSalary:   Number(employee.baseSalary) || 0,
        departmentId: employee.departmentId,
        positionId:   employee.positionId,
      });
    } else {
      reset({ gender: "FEMALE", fullName: "", phone: "", employeeNo: "", baseSalary: 0, departmentId: "", positionId: "" });
    }
    // Reset photo state when modal opens/closes
    setPhotoFile(null);
    setPhotoPreview(null);
  }, [employee, reset, open]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const params = targetHospitalId ? { targetHospitalId } : undefined;

  const mutation = useMutation({
    mutationFn: async (data: EmpForm) => {
      const emp = employee
        ? await employeesApi.update(employee.id, data, params)
        : await employeesApi.create(data, params);
      // Rasm yuklash (optional) — employeeNo ham shu yerda yaratiladi
      if (photoFile) {
        await employeesApi.uploadPhoto(emp.id, photoFile, params);
      }
      return emp;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success(employee ? "Xodim yangilandi" : "Xodim qo'shildi");
      onClose();
      reset();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[var(--text-primary)]">
            {employee ? "Xodimni tahrirlash" : "Yangi xodim"}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          {/* Photo upload */}
          <div className="flex items-center gap-4">
            <div
              onClick={() => photoRef.current?.click()}
              className="w-16 h-16 rounded-full flex-shrink-0 overflow-hidden border-2 border-dashed border-[var(--border)] hover:border-indigo-500/60 cursor-pointer transition-colors flex items-center justify-center bg-[var(--bg-hover)]"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
              ) : employee?.photoUrl ? (
                <img src={buildPhotoUrl(employee.photoUrl)} alt="photo" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-6 h-6 text-[var(--text-muted)]" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Rasm yuklash</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Ixtiyoriy · JPG, PNG · Terminal ID avtomatik yaratiladi</p>
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="btn-secondary text-xs px-3 py-1 mt-1.5"
              >
                {photoFile ? photoFile.name.substring(0, 20) + "..." : "Rasm tanlash"}
              </button>
            </div>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">F.I.O *</label>
              <input
                {...register("fullName", { required: "Ism kiritish shart", minLength: { value: 2, message: "Kamida 2 harf" } })}
                className="input-field"
                placeholder="Aziza Karimova"
              />
              {errors.fullName && <p className="text-xs text-red-400 mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Jinsi</label>
              <select {...register("gender")} className="input-field">
                <option value="FEMALE">Ayol</option>
                <option value="MALE">Erkak</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Terminal ID <span className="text-[var(--text-muted)] font-normal">(ixtiyoriy)</span>
              </label>
              <input {...register("employeeNo")} className="input-field" placeholder="Avtomatik belgilanadi" />
              <p className="text-xs text-[var(--text-muted)] mt-1">Rasm yuklanganda avtomatik belgilanadi</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Telefon</label>
              <input {...register("phone")} className="input-field" placeholder="+998901234567" />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Asosiy maosh <span className="text-[var(--text-muted)] font-normal">(ixtiyoriy)</span>
              </label>
              <input
                {...register("baseSalary", { valueAsNumber: true })}
                type="number"
                className="input-field"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Bo'lim *</label>
              <select {...register("departmentId", { required: "Bo'lim tanlash shart" })} className="input-field">
                <option value="">Tanlang</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {errors.departmentId && <p className="text-xs text-red-400 mt-1">{errors.departmentId.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Lavozim *</label>
              <select {...register("positionId", { required: "Lavozim tanlash shart" })} className="input-field">
                <option value="">Tanlang</option>
                {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {errors.positionId && <p className="text-xs text-red-400 mt-1">{errors.positionId.message}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Bekor qilish</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? "Saqlanmoqda..." : (employee ? "Yangilash" : "Qo'shish")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────
export default function EmployeesPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const { user, selectedHospital } = useAuthStore();

  // SUPER_ADMIN uchun targetHospitalId
  const targetHospitalId = isSuperLike(user?.role)
    ? (selectedHospital?.id || undefined)
    : undefined;
  const params = targetHospitalId ? { targetHospitalId } : undefined;

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editEmp, setEditEmp] = useState<any>(null);

  // Photo upload state
  const [uploadingEmpId, setUploadingEmpId] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // CSV import state
  const [importing, setImporting] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const LIMIT = 15;

  const { data, isLoading } = useQuery({
    queryKey: ["employees", search, deptFilter, page, targetHospitalId],
    queryFn: () => employeesApi.list({
      search,
      departmentId: deptFilter || undefined,
      page,
      limit: LIMIT,
      ...(params || {}),
    }),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", targetHospitalId],
    queryFn: () => departmentsApi.list(params),
  });

  const { data: positions = [] } = useQuery({
    queryKey: ["positions", targetHospitalId],
    queryFn: () => positionsApi.list(params),
  });

  // Bugungi davomat — tushlikdan kech qaytganlarni belgilash uchun
  const today = dayjs().format("YYYY-MM-DD");
  const { data: todayAttRaw } = useQuery({
    queryKey: ["attendance-daily-lunch", today, targetHospitalId],
    queryFn: () => attendanceApi.daily({ date: today, targetHospitalId }),
    staleTime: 2 * 60 * 1000, // 2 daqiqa cache
  });
  // employeeId → lunchLateMin xaritasi
  const lunchLateMap = new Map<string, number>();
  if (Array.isArray(todayAttRaw)) {
    for (const r of todayAttRaw) {
      if (r.employeeId && (r.lunchLateMin ?? 0) > 0) {
        lunchLateMap.set(r.employeeId, r.lunchLateMin);
      }
    }
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeesApi.delete(id, params),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }); toast.success("Xodim o'chirildi"); },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  // ── Export Excel ────────────────────────────
  const handleExcel = async () => {
    try {
      const res = await employeesApi.exportExcel(params);
      downloadBlob(res.data, "xodimlar.xlsx");
    } catch { toast.error("Export xatoligi"); }
  };

  // ── Fix Terminal IDs (EMP-XXXXX → raqamli format) ─
  const [fixing, setFixing] = useState(false);
  const handleFixNumbers = async () => {
    setFixing(true);
    try {
      const res = await employeesApi.fixEmployeeNumbers(params);
      const result = res?.data ?? res;
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success(`Terminal ID tuzatildi: ${result?.fixed ?? 0} ta | o'tkazildi: ${result?.skipped ?? 0} ta`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Xatolik");
    } finally {
      setFixing(false);
    }
  };

  // ── CSV Import ───────────────────────────────
  const handleCsvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setImporting(true);
    try {
      const result = await employeesApi.importCsv(file, params);
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["departments"] });
      qc.invalidateQueries({ queryKey: ["positions"] });
      const imported = result?.imported ?? 0;
      const newDepts: string[] = result?.created?.departments ?? [];
      const newPos: string[] = result?.created?.positions ?? [];
      const errs: string[] = result?.errors ?? [];
      if (imported > 0) {
        const extras: string[] = [];
        if (newDepts.length > 0) extras.push(`${newDepts.length} yangi bo'lim`);
        if (newPos.length > 0) extras.push(`${newPos.length} yangi lavozim`);
        const extra = extras.length > 0 ? ` (${extras.join(", ")} yaratildi)` : "";
        toast.success(`${imported} ta xodim import qilindi${extra}`);
      } else {
        toast.warning("Hech qanday xodim import qilinmadi");
      }
      if (errs.length > 0) {
        toast.error(`${errs.length} ta xatolik: ${errs.slice(0, 2).join("; ")}${errs.length > 2 ? " ..." : ""}`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Import xatoligi");
    } finally {
      setImporting(false);
    }
  };

  // ── Photo Upload ─────────────────────────────
  const handlePhotoClick = (empId: string) => {
    setUploadingEmpId(empId);
    photoInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingEmpId) return;
    e.target.value = "";

    const toastId = toast.loading("Rasm yuklanmoqda...");
    try {
      await employeesApi.uploadPhoto(uploadingEmpId, file, params);
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Rasm yuklandi va Terminal ID belgilandi", { id: toastId });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Rasm yuklashda xatolik", { id: toastId });
    } finally {
      setUploadingEmpId(null);
    }
  };

  const employees = data?.data || data || [];
  const total = data?.total || employees.length;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <Topbar
        title="Xodimlar"
        subtitle={`Jami ${total} nafar xodim`}
      />

      {/* Hidden inputs */}
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleCsvChange}
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoChange}
      />

      <div className="p-6 space-y-4">
        {/* ── SUPER_ADMIN: hospital not selected warning ── */}
        {isSuperLike(user?.role) && !selectedHospital && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
            <span className="text-base">⚠️</span>
            <span>Kasalxona tanlanmagan. <a href="/dashboard/hospitals" className="underline font-medium">Kasalxonalar sahifasiga o'ting</a> va bir kasalxonani tanlang.</span>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Qidirish (ism, ID)..."
              className="input-field pl-9"
            />
          </div>

          {/* Dept filter */}
          <select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
            className="input-field w-44"
          >
            <option value="">Barcha bo'limlar</option>
            {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <div className="flex items-center gap-2 ml-auto">
            {/* CSV Template download */}
            <button
              onClick={async () => {
                try {
                  const res = await employeesApi.csvTemplate();
                  downloadBlob(res.data, "hodimlar_shablon.csv");
                } catch { toast.error("Shablon yuklab bo'lmadi"); }
              }}
              className="btn-ghost gap-2 text-xs"
              title="CSV shablon yuklab olish"
            >
              <Download className="w-3.5 h-3.5" /> Shablon
            </button>

            {/* CSV Import */}
            <button
              onClick={() => csvInputRef.current?.click()}
              disabled={importing}
              className="btn-secondary gap-2"
              title="CSV import qilish"
            >
              <Upload className="w-4 h-4" />
              {importing ? "Import..." : "Import CSV"}
            </button>

            {/* Fix Terminal IDs */}
            <button
              onClick={handleFixNumbers}
              disabled={fixing}
              className="btn-secondary gap-2"
              title="EMP-XXXXX formatli Terminal IDlarni raqamli formatga o'tkazish"
            >
              <span className="text-xs font-mono">#</span>
              {fixing ? "Tuzatilmoqda..." : "ID tuzatish"}
            </button>

            {/* Excel Export */}
            <button onClick={handleExcel} className="btn-secondary gap-2" title="Excel yuklab olish">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>

            {/* Add employee */}
            <button onClick={() => { setEditEmp(null); setModalOpen(true); }} className="btn-primary gap-2">
              <Plus className="w-4 h-4" /> Xodim qo'shish
            </button>
          </div>
        </div>

        {/* ── CSV format hint ── */}
        <p className="text-xs text-[var(--text-muted)]">
          CSV ustunlar: <code className="font-mono bg-[var(--bg-hover)] px-1 rounded">ism_familiya, jinsi, bolim_kodi, lavozim, telefon</code>
        </p>

        {/* ── Table ── */}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {["Xodim", "Bo'lim", "Lavozim", "Terminal ID", "Asosiy maosh", "Holat", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-[var(--border)]">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 rounded bg-[var(--bg-hover)] animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}

              {!isLoading && employees.map((emp: any) => (
                <tr key={emp.id} className="border-b border-[var(--border)] table-row-hover">
                  {/* Avatar + name */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {/* Clickable avatar → photo upload */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePhotoClick(emp.id); }}
                        className="relative group flex-shrink-0"
                        title="Rasm yuklash"
                      >
                        {emp.photoUrl ? (
                          <img src={buildPhotoUrl(emp.photoUrl)} alt={emp.fullName} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white", getAvatarColor(emp.fullName))}>
                            {getInitials(emp.fullName)}
                          </div>
                        )}
                        {/* Hover overlay */}
                        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-3.5 h-3.5 text-white" />
                        </div>
                        {/* Uploading spinner */}
                        {uploadingEmpId === emp.id && (
                          <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </button>

                      <button
                        onClick={() => router.push(`/dashboard/employees/${emp.id}`)}
                        className="text-left hover:text-indigo-400 transition-colors group/name"
                      >
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-[var(--text-primary)] group-hover/name:text-indigo-400">{emp.fullName}</p>
                          {lunchLateMap.has(emp.id) && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 whitespace-nowrap">
                              <Coffee className="w-2.5 h-2.5" />
                              +{lunchLateMap.get(emp.id)}min
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">{emp.phone || emp.email || "—"}</p>
                      </button>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <p className="text-[var(--text-primary)]">{emp.department?.name}</p>
                  </td>

                  <td className="px-5 py-3.5">
                    <p className="text-[var(--text-muted)]">{emp.position?.name}</p>
                  </td>

                  <td className="px-5 py-3.5 font-mono text-xs text-[var(--text-muted)]">
                    {emp.employeeNo || <span className="text-[var(--text-muted)] opacity-40">—</span>}
                  </td>

                  <td className="px-5 py-3.5 text-[var(--text-primary)]">
                    {formatMoney(emp.baseSalary)}
                  </td>

                  <td className="px-5 py-3.5">
                    {emp.firedAt
                      ? <span className="badge-red">Ishdan ketgan</span>
                      : <span className="badge-green">Aktiv</span>
                    }
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => { setEditEmp(emp); setModalOpen(true); }}
                        className="text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded text-xs font-medium transition-colors"
                      >
                        Tahrirlash
                      </button>
                      <button
                        onClick={() => confirm("O'chirishni tasdiqlaysizmi?") && deleteMutation.mutate(emp.id)}
                        className="p-1.5 rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!isLoading && employees.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[var(--text-muted)] text-sm">
                    Xodimlar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)]">
                {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} / {total} ta xodim
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(1)} disabled={page === 1} className="btn-ghost p-1.5 disabled:opacity-30 text-xs px-2">
                  «
                </button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost p-1.5 disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const p = start + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        "btn-ghost px-3 py-1.5 text-xs rounded",
                        p === page && "bg-indigo-600 text-white hover:bg-indigo-500"
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost p-1.5 disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="btn-ghost p-1.5 disabled:opacity-30 text-xs px-2">
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <EmployeeModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditEmp(null); }}
        employee={editEmp}
        departments={departments}
        positions={positions}
        targetHospitalId={targetHospitalId}
      />
    </div>
  );
}
