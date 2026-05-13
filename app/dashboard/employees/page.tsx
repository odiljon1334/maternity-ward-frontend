"use client";
import { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { employeesApi, departmentsApi, positionsApi, attendanceApi, downloadBlob, photoUrl as buildPhotoUrl } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { getInitials, getAvatarColor, formatMoney, cn, isSuperLike } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import {
  Plus, Search, Download, Upload, Camera, ImageIcon,
  Trash2, X, FileSpreadsheet, Coffee,
} from "lucide-react";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";

const LIMIT = 20;

// ─── Kirill → Lotin normalizer ────────────────────────────────────────────────
function normalizeStr(str: string): string {
  const cyr: Record<string, string> = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'j','з':'z',
    'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
    'с':'s','т':'t','у':'u','ф':'f','х':'x','ц':'c','ч':'ch','ш':'sh',
    'ъ':"'",'ь':"'",'э':'e','ю':'yu','я':'ya',
    'ғ':'g','қ':'q','ҳ':'h','ў':'o',
  };
  return str.toLowerCase().split('').map(c => cyr[c] || c).join('');
}

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
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const photoRef       = useRef<HTMLInputElement>(null); // galereya
  const photoRefCamera = useRef<HTMLInputElement>(null); // kamera

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
      if (photoFile) await employeesApi.uploadPhoto(emp.id, photoFile, params);
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-card)] z-10">
          <h2 className="font-semibold text-[var(--text-primary)]">
            {employee ? "Xodimni tahrirlash" : "Yangi xodim"}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div
              onClick={() => setShowPhotoMenu(true)}
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
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Ixtiyoriy · JPG, PNG</p>
              <button
                type="button"
                onClick={() => setShowPhotoMenu(true)}
                className="btn-secondary text-xs px-3 py-1 mt-1.5"
              >
                {photoFile ? photoFile.name.substring(0, 18) + "..." : "Rasm tanlash"}
              </button>
            </div>
            <input ref={photoRef}       type="file" accept="image/*"                    className="hidden" onChange={handlePhotoSelect} />
            <input ref={photoRefCamera} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Terminal ID</label>
              <input {...register("employeeNo")} className="input-field" placeholder="Avtomatik" />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Telefon</label>
              <input {...register("phone")} className="input-field" placeholder="+998901234567" />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Asosiy maosh</label>
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
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Bekor</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? "Saqlanmoqda..." : (employee ? "Yangilash" : "Qo'shish")}
            </button>
          </div>
        </form>
      </div>

      {/* Rasm manbasi tanlash menyusi */}
      {showPhotoMenu && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={() => setShowPhotoMenu(false)}>
          <div className="w-full max-w-lg bg-[var(--bg-card)] rounded-t-2xl border-t border-[var(--border)] p-4 pb-8 space-y-1" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-[var(--border)] mx-auto mb-4" />
            <button type="button"
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors"
              onClick={() => { setShowPhotoMenu(false); photoRefCamera.current?.click(); }}>
              <Camera className="w-5 h-5 text-indigo-400" />
              <span className="font-medium">Kamera</span>
            </button>
            <button type="button"
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors"
              onClick={() => { setShowPhotoMenu(false); photoRef.current?.click(); }}>
              <ImageIcon className="w-5 h-5 text-indigo-400" />
              <span className="font-medium">Galereya</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Memoized table row ────────────────────────────
const EmpRow = memo(function EmpRow({
  emp, lunchLate, onEdit, onDelete, onPhoto, uploadingId, router,
}: {
  emp: any;
  lunchLate?: number;
  onEdit: (emp: any) => void;
  onDelete: (id: string) => void;
  onPhoto: (id: string) => void;
  uploadingId: string | null;
  router: any;
}) {
  return (
    <tr className="border-b border-[var(--border)] table-row-hover">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <button onClick={(e) => { e.stopPropagation(); onPhoto(emp.id); }} className="relative group flex-shrink-0">
            {emp.photoUrl ? (
              <img src={buildPhotoUrl(emp.photoUrl)} alt={emp.fullName} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white", getAvatarColor(emp.fullName))}>
                {getInitials(emp.fullName)}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-3.5 h-3.5 text-white" />
            </div>
            {uploadingId === emp.id && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
          <button onClick={() => router.push(`/dashboard/employees/${emp.id}`)} className="text-left hover:text-indigo-400 transition-colors group/name">
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-[var(--text-primary)] group-hover/name:text-indigo-400">{emp.fullName}</p>
              {lunchLate && lunchLate > 0 ? (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 whitespace-nowrap">
                  <Coffee className="w-2.5 h-2.5" />+{lunchLate}min
                </span>
              ) : null}
            </div>
            <p className="text-xs text-[var(--text-muted)]">{emp.phone || "—"}</p>
          </button>
        </div>
      </td>
      <td className="px-5 py-3.5 text-[var(--text-primary)]">{emp.department?.name}</td>
      <td className="px-5 py-3.5 text-[var(--text-muted)]">{emp.position?.name}</td>
      <td className="px-5 py-3.5 font-mono text-xs text-[var(--text-muted)]">{emp.employeeNo || <span className="opacity-40">—</span>}</td>
      <td className="px-5 py-3.5">{formatMoney(emp.baseSalary)}</td>
      <td className="px-5 py-3.5">
        {emp.firedAt ? <span className="badge-red">Ketgan</span> : <span className="badge-green">Aktiv</span>}
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => onEdit(emp)} className="text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded text-xs font-medium">
            Tahrirlash
          </button>
          <button
            onClick={() => confirm("O'chirishni tasdiqlaysizmi?") && onDelete(emp.id)}
            className="p-1.5 rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
});

// ── Main Page ────────────────────────────────────
export default function EmployeesPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const { user, selectedHospital } = useAuthStore();

  const targetHospitalId = isSuperLike(user?.role)
    ? (selectedHospital?.id || undefined)
    : undefined;
  const params = targetHospitalId ? { targetHospitalId } : undefined;

  const [searchInput, setSearchInput] = useState("");  // foydalanuvchi kiritgan (Lotin/Kirill)
  const [search, setSearch]           = useState("");  // API ga ketadigan (normallashtirilgan)
  const [deptFilter, setDeptFilter]   = useState("");
  const [photoFilter, setPhotoFilter] = useState<"all" | "with" | "without">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editEmp, setEditEmp]     = useState<any>(null);
  const [uploadingEmpId, setUploadingEmpId]     = useState<string | null>(null);
  const [showPhotoMenuMain, setShowPhotoMenuMain] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fixing, setFixing]       = useState(false);

  const photoInputRef      = useRef<HTMLInputElement>(null); // galereya
  const photoInputCameraRef = useRef<HTMLInputElement>(null); // kamera
  const csvInputRef        = useRef<HTMLInputElement>(null);
  const sentinelRef        = useRef<HTMLDivElement>(null);
  const mobileSentinelRef  = useRef<HTMLDivElement>(null);
  const tableContainerRef  = useRef<HTMLDivElement>(null);

  // ── Infinite query ───────────────────────────
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["employees", search, deptFilter, targetHospitalId],

    queryFn: ({ pageParam = 1 }) =>
      employeesApi.list({
        search,
        departmentId: deptFilter || undefined,
        page: pageParam as number,
        limit: LIMIT,
        ...(params || {}),
      }),
    getNextPageParam: (lastPage: any) => {
      const meta = lastPage?.meta;
      if (!meta) return undefined;
      return meta.page < meta.totalPages ? meta.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  // Flatten all pages
  const allLoaded  = data?.pages.flatMap((p: any) => p?.data ?? []) ?? [];
  const total      = data?.pages[0]?.meta?.total ?? 0;

  // ── Photo stats — alohida to'liq query (scroll ta'sir qilmaydi) ──
  const { data: statsRaw, isLoading: statsLoading } = useQuery({
    queryKey: ["employees-photo-stats", deptFilter, targetHospitalId],
    queryFn: () => employeesApi.list({
      limit: 2000,
      page: 1,
      departmentId: deptFilter || undefined,
      ...(params || {}),
    }),
    staleTime: 60_000,
    select: (d: any) => {
      const list: any[] = d?.data ?? [];
      const withPhoto = list.filter((e) => !!e.photoUrl).length;
      return {
        total:       d?.meta?.total ?? list.length,
        withPhoto,
        withoutPhoto: list.length - withPhoto,
        pct: list.length > 0 ? Math.round((withPhoto / list.length) * 100) : 0,
      };
    },
  });

  const photoStats = statsRaw ?? { total: 0, withPhoto: 0, withoutPhoto: 0, pct: 0 };

  // Photo filter (client-side, faqat yuklangan sahifalar ichida)
  const employees = photoFilter === "with"
    ? allLoaded.filter((e: any) => !!e.photoUrl)
    : photoFilter === "without"
    ? allLoaded.filter((e: any) => !e.photoUrl)
    : allLoaded;

  // ── IntersectionObserver for infinite scroll ─
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  // Desktop: sentinel table container ichida — root = tableContainerRef
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, {
      root: tableContainerRef.current,
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  // Mobile: sentinel window da — root = null (viewport)
  useEffect(() => {
    const el = mobileSentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  // Kasalxona o'zgarganda filtrlni tozalaymiz (eski bo'lim IDsi yangi kasalxonada yo'q)
  useEffect(() => {
    setDeptFilter("");
    setSearchInput("");
    setSearch("");
    setPhotoFilter("all");
  }, [targetHospitalId]);

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Search: kiritishni ko'rsatadi, 350ms kutib API ga normallashtirilgan yuboradi
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val.trim()); // raw input — normalizatsiya backend tomonida
    }, 350);
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // Reset scroll when filters change
  useEffect(() => { window.scrollTo(0, 0); }, [search, deptFilter, targetHospitalId]);

  // ── Departments / Positions ──────────────────
  const { data: departments = [] } = useQuery({
    queryKey: ["departments", targetHospitalId],
    queryFn: () => departmentsApi.list(params),
  });

  const { data: positions = [] } = useQuery({
    queryKey: ["positions", targetHospitalId],
    queryFn: () => positionsApi.list(params),
  });

  // ── Today attendance ─────────────────────────
  const today = dayjs().format("YYYY-MM-DD");
  const { data: todayAttRaw } = useQuery({
    queryKey: ["attendance-daily-lunch", today, targetHospitalId],
    queryFn: () => attendanceApi.daily({ date: today, targetHospitalId }),
    staleTime: 2 * 60 * 1000,
  });
  const lunchLateMap = new Map<string, number>();
  if (Array.isArray(todayAttRaw)) {
    for (const r of todayAttRaw) {
      if (r.employeeId && (r.lunchLateMin ?? 0) > 0) lunchLateMap.set(r.employeeId, r.lunchLateMin);
    }
  }

  // ── Delete ───────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeesApi.delete(id, params),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }); toast.success("Xodim o'chirildi"); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "O'chirishda xatolik"),
  });

  // ── Excel export ─────────────────────────────
  const handleExcel = async () => {
    try {
      const res = await employeesApi.exportExcel(params);
      downloadBlob(res.data, "xodimlar.xlsx");
    } catch { toast.error("Export xatoligi"); }
  };

  // ── Fix employee numbers ─────────────────────
  const handleFixNumbers = async () => {
    setFixing(true);
    try {
      const res = await employeesApi.fixEmployeeNumbers(params);
      const result = res?.data ?? res;
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success(`Terminal ID tuzatildi: ${result?.fixed ?? 0} ta | o'tkazildi: ${result?.skipped ?? 0} ta`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Xatolik");
    } finally { setFixing(false); }
  };

  // ── CSV import ───────────────────────────────
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
      const imported  = result?.imported ?? 0;
      const newDepts  = result?.created?.departments ?? [];
      const newPos    = result?.created?.positions ?? [];
      const errs      = result?.errors ?? [];
      if (imported > 0) {
        const extras: string[] = [];
        if (newDepts.length > 0) extras.push(`${newDepts.length} yangi bo'lim`);
        if (newPos.length > 0)   extras.push(`${newPos.length} yangi lavozim`);
        toast.success(`${imported} ta xodim import qilindi${extras.length ? ` (${extras.join(", ")} yaratildi)` : ""}`);
      } else {
        toast.warning("Hech qanday xodim import qilinmadi");
      }
      if (errs.length > 0) toast.error(`${errs.length} ta xatolik: ${errs.slice(0, 2).join("; ")}${errs.length > 2 ? " ..." : ""}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Import xatoligi");
    } finally { setImporting(false); }
  };

  // ── Photo upload ─────────────────────────────
  const handlePhotoClick = (empId: string) => {
    setUploadingEmpId(empId);
    setShowPhotoMenuMain(true);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingEmpId) return;
    e.target.value = "";
    const toastId = toast.loading("Rasm yuklanmoqda...");
    try {
      await employeesApi.uploadPhoto(uploadingEmpId, file, params);
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Rasm yuklandi", { id: toastId });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Rasm yuklashda xatolik", { id: toastId });
    } finally { setUploadingEmpId(null); }
  };

  return (
    <div>
      <Topbar title="Xodimlar" subtitle={`Jami ${total} nafar`} />

      <input ref={csvInputRef}         type="file" accept=".csv"    className="hidden" onChange={handleCsvChange} />
      <input ref={photoInputRef}       type="file" accept="image/*"                    className="hidden" onChange={handlePhotoChange} />
      <input ref={photoInputCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />

      <div className="p-4 lg:p-6 space-y-4">
        {isSuperLike(user?.role) && !selectedHospital && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
            <span className="text-base">⚠️</span>
            <span>Kasalxona tanlanmagan. <a href="/dashboard/hospitals" className="underline font-medium">Tanlash →</a></span>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          {/* Search — full width on mobile, flex-1 on sm+ */}
          <div className="relative sm:flex-1 sm:min-w-48">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] z-10" />
            <input
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Ism, familiya, ID..."
              className="input-field w-full"
              style={{ paddingLeft: '2.25rem' }}
            />
            {searchInput && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Row 2 on mobile: dept select + action buttons (sm:contents unwraps into outer flex-row) */}
          <div className="flex flex-wrap items-center gap-2 sm:contents">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="input-field flex-1 sm:w-44 sm:flex-none sm:flex-shrink-0"
            >
              <option value="">Barcha bo'limlar</option>
              {(departments as any[]).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>

            <div className="flex flex-wrap items-center gap-2 ml-auto sm:ml-auto">
              <button
                onClick={async () => {
                  try {
                    const res = await employeesApi.csvTemplate();
                    downloadBlob(res.data, "hodimlar_shablon.csv");
                  } catch { toast.error("Shablon yuklab bo'lmadi"); }
                }}
                className="btn-ghost gap-1.5 text-xs"
                title="CSV shablon"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Shablon</span>
              </button>

              <button
                onClick={() => csvInputRef.current?.click()}
                disabled={importing}
                className="btn-secondary gap-1.5 text-xs sm:text-sm"
              >
                <Upload className="w-4 h-4" />
                {importing ? "Import..." : <><span className="hidden sm:inline">Import </span>CSV</>}
              </button>

              <button
                onClick={handleFixNumbers}
                disabled={fixing}
                className="btn-secondary gap-1.5 text-xs sm:text-sm"
                title="Terminal IDlarni tuzatish"
              >
                <span className="font-mono">#</span>
                <span className="hidden sm:inline">{fixing ? "Tuzatilmoqda..." : "ID tuzatish"}</span>
              </button>

              <button onClick={handleExcel} className="btn-secondary gap-1.5 text-xs sm:text-sm">
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Excel</span>
              </button>

              <button onClick={() => { setEditEmp(null); setModalOpen(true); }} className="btn-primary gap-1.5 text-xs sm:text-sm">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Xodim</span> qo&apos;shish
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-[var(--text-muted)] hidden sm:block">
          CSV ustunlar: <code className="font-mono bg-[var(--bg-hover)] px-1 rounded">ism_familiya, jinsi, bolim_kodi, lavozim, telefon</code>
        </p>

        {/* ── Photo stats progress ── */}
        {(statsLoading || photoStats.total > 0) && (
          <div className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--text-primary)]">Profil rasmi holati</span>
                {statsLoading && (
                  <span className="text-[10px] text-[var(--text-muted)] animate-pulse">yuklanmoqda...</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {([
                  { v: "all",     l: "Barchasi",  count: photoStats.total,        color: "text-[var(--text-muted)]" },
                  { v: "with",    l: "✓ Rasmli",  count: photoStats.withPhoto,    color: "text-green-400"           },
                  { v: "without", l: "✕ Rasmsiz", count: photoStats.withoutPhoto, color: "text-amber-400"           },
                ] as const).map((f) => (
                  <button
                    key={f.v}
                    onClick={() => setPhotoFilter(f.v)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                      photoFilter === f.v
                        ? f.v === "without"
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                          : f.v === "with"
                          ? "bg-green-500/20 border-green-500/40 text-green-300"
                          : "bg-[var(--bg-hover)] border-[var(--border)] text-[var(--text-primary)]"
                        : "border-transparent text-[var(--text-muted)] hover:border-[var(--border)]"
                    )}
                  >
                    <span className={photoFilter !== f.v ? f.color : ""}>{f.l}</span>
                    <span className="font-semibold">{f.count}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-2.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  statsLoading ? "animate-pulse bg-[var(--bg-hover)] w-full" : "bg-gradient-to-r from-green-600 to-green-400"
                )}
                style={statsLoading ? {} : { width: `${photoStats.pct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1.5">
              <span className="text-green-400 font-medium">{photoStats.withPhoto} ta rasmli</span>
              <span className="font-semibold text-[var(--text-primary)]">{photoStats.pct}%</span>
              <span className="text-amber-400 font-medium">{photoStats.withoutPhoto} ta rasmsiz</span>
            </div>
          </div>
        )}

        {/* ── Mobile cards ── */}
        <div className="sm:hidden space-y-3">
          {isLoading && [...Array(5)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded bg-[var(--bg-hover)] w-3/4" />
                  <div className="h-3 rounded bg-[var(--bg-hover)] w-1/2" />
                </div>
              </div>
            </div>
          ))}
          {!isLoading && employees.length === 0 && (
            <div className="card p-8 text-center text-[var(--text-muted)] text-sm">Xodimlar topilmadi</div>
          )}
          {employees.map((emp: any) => (
            <div key={emp.id} className="card p-4">
              <div className="flex items-center gap-3">
                <button onClick={() => handlePhotoClick(emp.id)} className="relative group flex-shrink-0">
                  {emp.photoUrl
                    ? <img src={buildPhotoUrl(emp.photoUrl)} alt={emp.fullName} className="w-10 h-10 rounded-full object-cover" />
                    : <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold text-white", getAvatarColor(emp.fullName))}>
                        {getInitials(emp.fullName)}
                      </div>
                  }
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-3.5 h-3.5 text-white" />
                  </div>
                </button>
                <button className="flex-1 min-w-0 text-left" onClick={() => router.push(`/dashboard/employees/${emp.id}`)}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-medium text-[var(--text-primary)] text-sm">{emp.fullName}</p>
                    {lunchLateMap.has(emp.id) && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400">
                        <Coffee className="w-2.5 h-2.5" />+{lunchLateMap.get(emp.id)}min
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate">{emp.department?.name} · {emp.position?.name}</p>
                </button>
                {emp.firedAt ? <span className="badge-red flex-shrink-0">Ketgan</span> : <span className="badge-green flex-shrink-0">Aktiv</span>}
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border)]">
                <span className="font-mono text-xs text-[var(--text-muted)]">{emp.employeeNo || "—"}</span>
                <span className="text-xs text-[var(--text-primary)] font-medium">{formatMoney(emp.baseSalary)}</span>
                <div className="ml-auto flex items-center gap-1">
                  <button onClick={() => { setEditEmp(emp); setModalOpen(true); }} className="text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded text-xs font-medium">
                    Tahrirlash
                  </button>
                  <button
                    onClick={() => confirm("O'chirishni tasdiqlaysizmi?") && deleteMutation.mutate(emp.id)}
                    className="p-1.5 rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile sentinel — infinite scroll uchun */}
        <div ref={mobileSentinelRef} className="h-4 sm:hidden" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-3 sm:hidden">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ── Desktop table ── */}
        <div className="hidden sm:block card overflow-hidden">
          <div ref={tableContainerRef} className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-240px)]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-20">
                <tr className="border-b border-[var(--border)]">
                  {["Xodim", "Bo'lim", "Lavozim", "Terminal ID", "Asosiy maosh", "Holat", ""].map((h) => (
                    <th key={h} className="bg-[var(--bg-card)] text-left px-5 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap">
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
                  <EmpRow
                    key={emp.id}
                    emp={emp}
                    lunchLate={lunchLateMap.get(emp.id)}
                    onEdit={(e) => { setEditEmp(e); setModalOpen(true); }}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onPhoto={handlePhotoClick}
                    uploadingId={uploadingEmpId}
                    router={router}
                  />
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

            {/* Sentinel container ichida — IntersectionObserver root bilan ishlaydi */}
            <div ref={sentinelRef} className="h-4" />
            {isFetchingNextPage && (
              <div className="flex justify-center py-3">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!hasNextPage && employees.length > 0 && !isLoading && (
              <p className="text-center text-xs text-[var(--text-muted)] py-2">
                Barcha {total} ta xodim yuklandi ✓
              </p>
            )}
          </div>

          {/* Ko'rsatilmoqda footer */}
          {employees.length > 0 && (
            <div className="px-5 py-2.5 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
              {employees.length} / {total} ta ko'rsatilmoqda
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

      {/* Rasm manbasi — kamera yoki galereya */}
      {showPhotoMenuMain && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => { setShowPhotoMenuMain(false); setUploadingEmpId(null); }}>
          <div className="w-full max-w-lg bg-[var(--bg-card)] rounded-t-2xl border-t border-[var(--border)] p-4 pb-8 space-y-1" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-[var(--border)] mx-auto mb-4" />
            <button type="button"
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors"
              onClick={() => { setShowPhotoMenuMain(false); photoInputCameraRef.current?.click(); }}>
              <Camera className="w-5 h-5 text-indigo-400" />
              <span className="font-medium">Kamera</span>
            </button>
            <button type="button"
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors"
              onClick={() => { setShowPhotoMenuMain(false); photoInputRef.current?.click(); }}>
              <ImageIcon className="w-5 h-5 text-indigo-400" />
              <span className="font-medium">Galereya</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
