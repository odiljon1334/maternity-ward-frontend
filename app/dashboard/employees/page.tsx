"use client";
import { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { employeesApi, departmentsApi, positionsApi, attendanceApi, leaveApi, downloadBlob, photoUrl as buildPhotoUrl } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { getInitials, getAvatarColor, formatMoney, cn, isSuperLike } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import {
  Plus, Search, Download, Upload, Camera, ImageIcon,
  Trash2, X, FileSpreadsheet, Coffee, Building2, 
  CheckSquare, Square, Eye, EyeOff, KeyRound, Palmtree, ChevronRight, UserX, AlertTriangle
} from "lucide-react";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import { ArchivedBioModal } from "@/components/employees/ArchivedBioModal";

const LIMIT = 20;

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

const LEAVE_LABELS: Record<string, { label: string; emoji: string }> = {
  VACATION:  { label: "Yillik ta'til",  emoji: "🏖" },
  SICK:      { label: "Kasallik",        emoji: "🤒" },
  PERSONAL:  { label: "Shaxsiy sabab",   emoji: "🏠" },
  MATERNITY: { label: "Tug'ruq ta'tili", emoji: "🤱" },
  UNPAID:    { label: "Haqsiz ta'til",   emoji: "📋" },
};

type EmpForm = {
  fullName:     string;
  gender:       "MALE" | "FEMALE";
  phone:        string;
  employeeNo:   string;
  baseSalary:   number;
  departmentId: string;
  positionId:   string;
  username:     string;
  password:     string;
  birthDate?:   string;
};

// ── Employee Form Modal ──────────────────────────
function EmployeeModal({
  open, onClose, employee, departments, positions, targetHospitalId, currentUserRole,
}: {
  open: boolean;
  onClose: () => void;
  employee?: any;
  departments: any[];
  positions: any[];
  targetHospitalId?: string;
  currentUserRole?: string;
}) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<EmpForm>({
    defaultValues: { gender: "FEMALE" },
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const photoRef       = useRef<HTMLInputElement>(null);
  const photoRefCamera = useRef<HTMLInputElement>(null);
  const [lookupResults, setLookupResults] = useState<any[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [showLookup, setShowLookup]       = useState(false);
  const lookupDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [bioEmpId, setBioEmpId] = useState<string | null>(null);

  const qc = useQueryClient();

  const watchedName = watch("fullName");
  const watchedBirthDate = watch("birthDate");

  useEffect(() => {
    if (employee) return;
    if (!watchedName || watchedName.trim().length < 3) {
      setLookupResults([]);
      setShowLookup(false);
      return;
    }

    clearTimeout(lookupDebounceRef.current);
    lookupDebounceRef.current = setTimeout(async () => {
      setLookupLoading(true);
      try {
        const results = await employeesApi.lookup({
          fullName:  watchedName.trim(),
          birthDate: watchedBirthDate || undefined,
          ...(targetHospitalId ? { targetHospitalId } : {}),
        });
        setLookupResults(results ?? []);
        setShowLookup((results ?? []).length > 0);
      } catch {
        setLookupResults([]);
      } finally {
        setLookupLoading(false);
      }
    }, 600);

    return () => clearTimeout(lookupDebounceRef.current);
  }, [watchedName, watchedBirthDate, employee, targetHospitalId]);

  const hasAccount = !!employee?.user?.username;

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
        username:     employee.user?.username || "",
        password:     "",
        birthDate:    employee.birthDate ? employee.birthDate.split('T')[0] : "",
      });
    } else {
      reset({ 
        gender: "FEMALE", 
        fullName: "", 
        phone: "", 
        employeeNo: "", 
        baseSalary: 0, 
        departmentId: "", 
        positionId: "", 
        username: "", 
        password: "",
        birthDate: employee?.birthDate
          ? new Date(employee.birthDate).toISOString().slice(0, 10)
          : "",
      });
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowPassword(false);
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
      const { birthDate, ...rest } = data;
      const emp = employee
        ? await employeesApi.update(
            employee.id,
            { ...rest, birthDate: birthDate || undefined },
            params
          )
        : await employeesApi.create(
            { ...rest, birthDate: birthDate || undefined },
            params
          );
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative card w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[var(--border)] shadow-2xl bg-[var(--bg-card)] text-[var(--text-primary)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-card)]/90 backdrop-blur-md z-10">
          <h2 className="font-bold text-lg text-[var(--text-primary)]">
            {employee ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bg-hover)]/40 border border-[var(--border)]/50">
            <div
              onClick={() => setShowPhotoMenu(true)}
              className="relative group w-16 h-16 rounded-full flex-shrink-0 overflow-hidden border-2 border-dashed border-[var(--border)] hover:border-indigo-500 cursor-pointer transition-all flex items-center justify-center bg-[var(--bg-hover)]"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
              ) : employee?.photoUrl ? (
                <img src={buildPhotoUrl(employee.photoUrl)} alt="photo" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-6 h-6 text-[var(--text-muted)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Profil rasmi</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">JPG yoki PNG formatda</p>
              <button
                type="button"
                onClick={() => setShowPhotoMenu(true)}
                className="btn-secondary text-xs px-3 py-1 mt-2 inline-flex items-center gap-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                {photoFile ? photoFile.name.substring(0, 16) + "..." : "Rasm tanlash"}
              </button>
            </div>
            <input ref={photoRef}       type="file" accept="image/*"                    className="hidden" onChange={handlePhotoSelect} />
            <input ref={photoRefCamera} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">F.I.O *</label>
              <input
                {...register("fullName", { required: "Ism kiritish shart", minLength: { value: 2, message: "Kamida 2 harf" } })}
                className="input-field w-full text-[var(--text-primary)] font-medium"
                placeholder="Masalan: Aziza Karimova"
              />
              {errors.fullName && <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold">{errors.fullName.message}</p>}
            </div>

            {!employee && (
              <div className="col-span-2">
                {lookupLoading && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-hover)] text-xs text-[var(--text-muted)]">
                    <div className="w-3 h-3 border border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    Arxivdan mos keluvchi xodimlar qidirilmoqda...
                  </div>
                )}

                {showLookup && lookupResults.length > 0 && (
                  <div className="space-y-2.5 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Mos keluvchi arxiv yozuvlari topildi:
                    </p>
                    {lookupResults.map((r) => {
                      const confidenceColor =
                        r.confidence === 'HIGH'   ? 'border-red-500/30 bg-red-500/10'    :
                        r.confidence === 'MEDIUM' ? 'border-amber-500/30 bg-amber-500/10' :
                                          'border-slate-500/20 bg-slate-500/5';
                      const confidenceLabel =
                        r.confidence === 'HIGH'   ? '🔴 Yuqori moslik' :
                        r.confidence === 'MEDIUM' ? '🟡 O\'rta moslik'  :
                                          '⚪ Past moslik';

                      return (
                        <div key={r.id} className={`rounded-xl border p-3 space-y-2 ${confidenceColor}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              {r.photoUrl ? (
                                <img
                                  src={buildPhotoUrl(r.photoUrl)}
                                  alt={r.fullName}
                                  className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0", getAvatarColor(r.fullName))}>
                                  {getInitials(r.fullName)}
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-bold text-[var(--text-primary)]">{r.fullName}</p>
                                <p className="text-xs text-[var(--text-muted)] font-medium">{r.position} · {r.department}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-[var(--text-muted)] whitespace-nowrap">
                              {confidenceLabel}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[var(--text-muted)] pt-1 border-t border-[var(--border)] font-medium">
                            <span>🏥 {r.hospital?.name}</span>
                            <span>⏱ {r.duration}</span>
                            <span>💰 {formatMoney(r.lastSalary)}</span>
                            {r.fireReason && (
                            <span>🚪 {
                              r.fireReason === 'RESIGNED'    ? "O'z xohishi" :
                              r.fireReason === 'FIRED'       ? "Bo'shatildi"  :
                              r.fireReason === 'RETIRED'     ? "Pensiya"      :
                              r.fireReason === 'TRANSFERRED' ? "O'tkazildi"   : "Boshqa"
                            }</span>
                          )}
                          {r.hospital?.phone && <span>📞 {r.hospital.phone}</span>}
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setBioEmpId(r.id)} 
                          className="w-full mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors flex items-center justify-center gap-1"
                        >
                          Batafsil bio ko'rish <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                   })}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">Jinsi</label>
              <select {...register("gender")} className="input-field w-full font-medium">
                <option value="FEMALE">Ayol</option>
                <option value="MALE">Erkak</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">Terminal ID</label>
              <input {...register("employeeNo")} className="input-field w-full font-mono font-medium" placeholder="Avtomatik" />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">Telefon</label>
              <input {...register("phone")} className="input-field w-full font-medium" placeholder="+998901234567" />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">Tug'ilgan sana</label>
              <input
                {...register("birthDate")}
                type="date"
                className="input-field w-full font-medium"
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">Asosiy maosh</label>
              <input
                {...register("baseSalary", { valueAsNumber: true })}
                type="number"
                className="input-field w-full font-semibold"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">Bo'lim *</label>
              <select {...register("departmentId", { required: "Bo'lim tanlash shart" })} className="input-field w-full font-medium">
                <option value="">Tanlang</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {errors.departmentId && <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold">{errors.departmentId.message}</p>}
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">Lavozim *</label>
              <select {...register("positionId", { required: "Lavozim tanlash shart" })} className="input-field w-full font-medium">
                <option value="">Tanlang</option>
                {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {errors.positionId && <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold">{errors.positionId.message}</p>}
            </div>
          </div>

          <div className="border border-[var(--border)] rounded-2xl p-4 space-y-3 bg-[var(--bg-hover)]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Mobil Kirish (Login)</span>
              </div>
              {hasAccount && (
                <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                  Mavjud: {employee?.user?.username}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] font-medium">
              {hasAccount
                ? "Username yoki parolni o'zgartirish uchun kiriting (aks holda o'zgarmaydi)"
                : "Xodim mobil ilovaga kirishi uchun login ma'lumotlarini yarating"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">Username</label>
                <input
                  {...register("username")}
                  className="input-field w-full font-medium"
                  placeholder={hasAccount ? employee?.user?.username : "emp001"}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">Parol</label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    className="input-field w-full pr-9 font-medium"
                    placeholder={hasAccount ? "••••••••" : "min 6 belgi"}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 font-bold">Bekor</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 py-2.5 font-bold">
              {mutation.isPending ? "Saqlanmoqda..." : (employee ? "Yangilash" : "Qo'shish")}
            </button>
          </div>
        </form>
      </div>

      {showPhotoMenu && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={() => setShowPhotoMenu(false)}>
          <div className="w-full max-w-lg bg-[var(--bg-card)] rounded-t-2xl border-t border-[var(--border)] p-4 pb-8 space-y-2 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 rounded-full bg-[var(--border)] mx-auto mb-3 opacity-60" />
            <button type="button"
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-bold transition-colors"
              onClick={() => { setShowPhotoMenu(false); photoRefCamera.current?.click(); }}>
              <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Kameradan rasmga olish</span>
            </button>
            <button type="button"
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-bold transition-colors"
              onClick={() => { setShowPhotoMenu(false); photoRef.current?.click(); }}>
              <ImageIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Galereyadan tanlash</span>
            </button>
          </div>
        </div>
      )}
      {bioEmpId && (
        <ArchivedBioModal
          empId={bioEmpId}
          onClose={() => setBioEmpId(null)}
        />
      )}
    </div>
  );
}

const FIRE_REASONS = [
  { value: "RESIGNED",    label: "O'z xohishi bilan ketdi" },
  { value: "FIRED",       label: "Ishdan bo'shatildi"       },
  { value: "RETIRED",     label: "Pensiyaga chiqdi"         },
  { value: "TRANSFERRED", label: "Boshqa joyga o'tdi"       },
  { value: "OTHER",       label: "Boshqa sabab"             },
];

function FireModal({
  open,
  onClose,
  employee,
  targetHospitalId,
}: {
  open: boolean;
  onClose: () => void;
  employee: any;
  targetHospitalId?: string;
}) {
  const qc = useQueryClient();
  const [reason,  setReason]  = useState("RESIGNED");
  const [note,    setNote]    = useState("");
  const [firedAt, setFiredAt] = useState(dayjs().format("YYYY-MM-DD"));

  useEffect(() => {
    if (open) {
      setReason("RESIGNED");
      setNote("");
      setFiredAt(dayjs().format("YYYY-MM-DD"));
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      employeesApi.fire(
        employee.id,
        { fireReason: reason, fireNote: note || undefined, firedAt },
        targetHospitalId ? { targetHospitalId } : undefined,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success(`${employee.fullName} ishdan bo'shatildi`);
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  if (!open || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-[var(--border)] shadow-2xl bg-[var(--bg-card)] text-[var(--text-primary)]">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--text-primary)] text-base">Ishdan bo'shatish</h2>
              <p className="text-xs text-[var(--text-muted)] font-medium">{employee.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--bg-hover)]/40 border border-[var(--border)]">
            {employee.photoUrl ? (
              <img
                src={buildPhotoUrl(employee.photoUrl)}
                alt={employee.fullName}
                className="w-11 h-11 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className={cn("w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0", getAvatarColor(employee.fullName))}>
                {getInitials(employee.fullName)}
              </div>
            )}
            <div>
              <p className="font-bold text-[var(--text-primary)] text-sm">{employee.fullName}</p>
              <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
                {employee.department?.name} · {employee.position?.name}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] font-semibold opacity-90 mt-0.5">
                Ishga kirgan: {dayjs(employee.hiredAt).format("DD.MM.YYYY")}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
              Ketish sababi *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-field w-full font-medium"
            >
              {FIRE_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
              Ketgan sana *
            </label>
            <input
              type="date"
              value={firedAt}
              onChange={(e) => setFiredAt(e.target.value)}
              className="input-field w-full font-medium"
              max={dayjs().format("YYYY-MM-DD")}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
              Qo'shimcha izoh <span className="normal-case opacity-60 font-normal">(ixtiyoriy)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input-field w-full resize-none font-medium"
              rows={3}
              placeholder="Masalan: Shaxsiy sabablarga ko'ra..."
            />
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-800 dark:text-orange-300 font-medium">
            <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              Xodim ishdan bo'shatilgach arxivga o'tkaziladi. 
              Barcha tarixi (davomat, maosh) saqlanadi.
            </p>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="btn-secondary flex-1 py-2.5 font-bold"
          >
            Bekor
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold transition-colors disabled:opacity-50 shadow-lg shadow-orange-500/20"
          >
            {mutation.isPending ? "Saqlanmoqda..." : "Bo'shatishni tasdiqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Memoized table row ────────────────────────────
const EmpRow = memo(function EmpRow({
  emp, lunchLate, onLeave, onEdit, onFire, onDelete, onPhoto, uploadingId, router, selected, onSelect,
}: {
  emp: any;
  lunchLate?: number;
  onLeave: any;
  onEdit: (emp: any) => void;
  onDelete: (id: string) => void;
  onFire: (emp: any) => void;
  onPhoto: (id: string) => void;
  uploadingId: string | null;
  router: any;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
}) {
  return (
    <tr className={cn(
      "border-b border-[var(--border)] transition-colors hover:bg-[var(--bg-hover)]/60",
      selected && "bg-indigo-500/10 hover:bg-indigo-500/15"
    )}>
      <td className="pl-5 pr-2 py-3.5 w-10">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(emp.id, !selected); }}
          className="text-[var(--text-muted)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          {selected
            ? <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            : <Square className="w-4 h-4" />}
        </button>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <button onClick={(e) => { e.stopPropagation(); onPhoto(emp.id); }} className="relative group flex-shrink-0">
            {emp.photoUrl ? (
              <img src={buildPhotoUrl(emp.photoUrl)} alt={emp.fullName} className="w-10 h-10 rounded-full object-cover border border-[var(--border)]" />
            ) : (
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner", getAvatarColor(emp.fullName))}>
                {getInitials(emp.fullName)}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-4 h-4 text-white" />
            </div>
            {uploadingId === emp.id && (
              <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center">
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
          <button onClick={() => router.push(`/dashboard/employees/${emp.id}`)} className="text-left group/name">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-sm text-[var(--text-primary)] group-hover/name:text-indigo-600 dark:group-hover/name:text-indigo-400 transition-colors">{emp.fullName}</p>
              {lunchLate && lunchLate > 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-700 dark:text-orange-400 whitespace-nowrap">
                  <Coffee className="w-3 h-3" />+{lunchLate}m
                </span>
              ) : null}
              {onLeave && (
                <span
                  title={`${LEAVE_LABELS[onLeave.type]?.label ?? onLeave.type} · ${onLeave.startDate?.slice(0,10)} – ${onLeave.endDate?.slice(0,10)}`}
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 whitespace-nowrap cursor-help"
                >
                  <Palmtree className="w-3 h-3" />
                  {LEAVE_LABELS[onLeave.type]?.emoji} Ta'tilda
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">{emp.phone || "—"}</p>
          </button>
        </div>
      </td>
      <td className="px-5 py-3.5 font-bold text-[var(--text-primary)]">{emp.department?.name || "—"}</td>
      <td className="px-5 py-3.5 text-[var(--text-muted)] font-semibold">{emp.position?.name || "—"}</td>
      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-[var(--text-muted)]">{emp.employeeNo || <span className="opacity-30">—</span>}</td>
      <td className="px-5 py-3.5 font-extrabold text-[var(--text-primary)]">{formatMoney(emp.baseSalary)}</td>
      <td className="px-5 py-3.5">
      {emp.firedAt || emp.status === 'FIRED'
        ? <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-400">Ketgan</span>
        : emp.status === 'ON_LEAVE'
        ? <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400">Ta'tilda</span>
        : <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-700 dark:text-green-400">Faol</span>
      }
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => onEdit(emp)} 
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-500/10 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors">
            Tahrirlash
          </button>
          {!emp.firedAt && (
            <button
              onClick={() => onFire(emp)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 hover:bg-orange-500/10 transition-colors"
              title="Ishdan bo'shatish">
              Bo'shatish
            </button>
          )}
          <button
            onClick={() => confirm("O'chirishni tasdiqlaysizmi?") && onDelete(emp.id)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-4 h-4" />
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

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch]           = useState("");
  const [deptFilter, setDeptFilter]   = useState("");
  const [photoFilter, setPhotoFilter] = useState<"all" | "with" | "without">("all");
  const [modalOpen, setModalOpen]     = useState(false);
  const [editEmp, setEditEmp]         = useState<any>(null);
  const [uploadingEmpId, setUploadingEmpId]     = useState<string | null>(null);
  const [showPhotoMenuMain, setShowPhotoMenuMain] = useState(false);
  const [importing, setImporting]     = useState(false);
  const [fixing, setFixing]           = useState(false);
  const [fireModalOpen, setFireModalOpen] = useState(false);
  const [fireEmp, setFireEmp]         = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedIds, setSelectedIds]   = useState<string[]>([]);
  const [showBulkDept, setShowBulkDept] = useState(false);
  const [bulkDeptId, setBulkDeptId]     = useState("");

  const photoInputRef      = useRef<HTMLInputElement>(null);
  const photoInputCameraRef = useRef<HTMLInputElement>(null);
  const csvInputRef        = useRef<HTMLInputElement>(null);
  const sentinelRef        = useRef<HTMLDivElement>(null);
  const mobileSentinelRef  = useRef<HTMLDivElement>(null);
  const tableContainerRef  = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["employees", search, deptFilter, statusFilter, targetHospitalId],

    queryFn: ({ pageParam = 1 }) =>
      employeesApi.list({
        search,
        departmentId: deptFilter || undefined,
        employeeStatus: statusFilter || undefined,
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

  const allLoaded  = data?.pages.flatMap((p: any) => p?.data ?? []) ?? [];
  const total      = data?.pages[0]?.meta?.total ?? 0;

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

  const employees = photoFilter === "with"
    ? allLoaded.filter((e: any) => !!e.photoUrl)
    : photoFilter === "without"
    ? allLoaded.filter((e: any) => !e.photoUrl)
    : allLoaded;

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

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

  useEffect(() => {
    const el = mobileSentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  useEffect(() => {
    setDeptFilter("");
    setSearchInput("");
    setSearch("");
    setPhotoFilter("all");
    setStatusFilter("");
    setSelectedIds([]);
  }, [targetHospitalId]);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val.trim());
    }, 350);
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  useEffect(() => { window.scrollTo(0, 0); }, [search, deptFilter, targetHospitalId]);

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", targetHospitalId],
    queryFn: () => departmentsApi.list(params),
  });

  const { data: positions = [] } = useQuery({
    queryKey: ["positions", targetHospitalId],
    queryFn: () => positionsApi.list(params),
  });

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

  const { data: onLeaveRecords = [] } = useQuery({
    queryKey: ["employees-on-leave", today, targetHospitalId],
    queryFn: async () => {
      const data = await leaveApi.list({
        status: "APPROVED",
        limit: 500,
        ...(targetHospitalId ? { targetHospitalId } : {}),
      });
      const records: any[] = data?.records ?? [];
      return records.filter((r: any) => {
        const start = r.startDate?.slice(0, 10);
        const end   = r.endDate?.slice(0, 10);
        return today >= start && today <= end;
      });
    },
    staleTime: 5 * 60_000,
  });

  const onLeaveMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const r of onLeaveRecords) {
      map.set(r.employeeId, r);
    }
    return map;
  }, [onLeaveRecords]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeesApi.delete(id, params),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }); toast.success("Xodim o'chirildi"); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "O'chirishda xatolik"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: () => employeesApi.bulkDelete(selectedIds, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success(`${selectedIds.length} ta xodim o'chirildi`);
      setSelectedIds([]);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "O'chirishda xatolik"),
  });

  const bulkDeptMutation = useMutation({
    mutationFn: (deptId: string) => employeesApi.bulkMoveDepartment(selectedIds, deptId, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success(`${selectedIds.length} ta xodim bo'limi o'zgartirildi`);
      setSelectedIds([]);
      setShowBulkDept(false);
      setBulkDeptId("");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
  };
  const isAllSelected = employees.length > 0 && employees.every((e: any) => selectedIds.includes(e.id));
  const toggleSelectAll = () => {
    setSelectedIds(isAllSelected ? [] : employees.map((e: any) => e.id));
  };

  const handleExcel = async () => {
    try {
      const res = await employeesApi.exportExcel(params);
      downloadBlob(res.data, "xodimlar.xlsx");
    } catch { toast.error("Export xatoligi"); }
  };

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
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)]">
      <Topbar title="Xodimlar" subtitle={`Jami ${total} nafar xodim`} />

      <input ref={csvInputRef}         type="file" accept=".csv"    className="hidden" onChange={handleCsvChange} />
      <input ref={photoInputRef}       type="file" accept="image/*"                    className="hidden" onChange={handlePhotoChange} />
      <input ref={photoInputCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />

      <div className="p-4 lg:p-6 space-y-5 max-w-[1600px] mx-auto">
        {isSuperLike(user?.role) && !selectedHospital && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm font-semibold shadow-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Kasalxona tanlanmagan. <a href="/dashboard/hospitals" className="underline font-bold hover:text-amber-800 dark:hover:text-amber-300">Tanlash →</a></span>
          </div>
        )}

        {/* ── Filter & Search Toolbar ── */}
        <div className="card p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4 border border-[var(--border)] shadow-sm bg-[var(--bg-card)]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Ism, familiya, ID..."
                className="input-field w-full pl-10 pr-9 text-sm font-medium"
              />
              {searchInput && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="input-field text-sm sm:w-48 font-medium"
            >
              <option value="">Barcha bo'limlar</option>
              {(departments as any[]).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field text-sm sm:w-40 font-medium"
            >
              <option value="">Barcha holat</option>
              <option value="ACTIVE">✅ Faol</option>
              <option value="ON_LEAVE">🏖 Ta'tilda</option>
              <option value="FIRED">❌ Ketgan</option>
            </select>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border)]">
            <button
              onClick={async () => {
                try {
                  const res = await employeesApi.csvTemplate();
                  downloadBlob(res.data, "hodimlar_shablon.csv");
                } catch { toast.error("Shablon yuklab bo'lmadi"); }
              }}
              className="btn-ghost gap-1.5 text-xs px-3 py-2 font-bold"
              title="CSV shablon"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Shablon</span>
            </button>

            <button
              onClick={() => csvInputRef.current?.click()}
              disabled={importing}
              className="btn-secondary gap-1.5 text-xs sm:text-sm px-3 py-2 font-bold"
            >
              <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              {importing ? "Import..." : <><span className="hidden sm:inline">Import </span>CSV</>}
            </button>

            <button
              onClick={handleFixNumbers}
              disabled={fixing}
              className="btn-secondary gap-1.5 text-xs sm:text-sm px-3 py-2 font-bold"
              title="Terminal IDlarni tuzatish"
            >
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">#</span>
              <span className="hidden sm:inline">{fixing ? "..." : "ID tuzatish"}</span>
            </button>

            <button onClick={handleExcel} className="btn-secondary gap-1.5 text-xs sm:text-sm px-3 py-2 font-bold">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button onClick={() => { setEditEmp(null); setModalOpen(true); }} className="btn-primary gap-1.5 text-xs sm:text-sm px-3.5 py-2 font-bold whitespace-nowrap">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Xodim</span> qo&apos;shish
            </button>
          </div>
        </div>

        {/* ── Photo stats progress card ── */}
        {(statsLoading || photoStats.total > 0) && (
          <div className="card p-4 border border-[var(--border)] shadow-sm space-y-3 bg-[var(--bg-card)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider">Profil rasmi holati</span>
                {statsLoading && (
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 animate-pulse font-bold">yuklanmoqda...</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 bg-[var(--bg-hover)]/60 p-1 rounded-xl border border-[var(--border)]">
                {([
                  { v: "all",     l: "Barchasi",  count: photoStats.total,        color: "text-[var(--text-muted)]" },
                  { v: "with",    l: "✓ Rasmli",  count: photoStats.withPhoto,    color: "text-green-700 dark:text-green-400" },
                  { v: "without", l: "✕ Rasmsiz", count: photoStats.withoutPhoto, color: "text-amber-700 dark:text-amber-400" },
                ] as const).map((f) => (
                  <button
                    key={f.v}
                    onClick={() => setPhotoFilter(f.v)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all",
                      photoFilter === f.v
                        ? f.v === "without"
                          ? "bg-amber-500/20 border border-amber-500/40 text-amber-800 dark:text-amber-300 shadow-sm"
                          : f.v === "with"
                          ? "bg-green-500/20 border border-green-500/40 text-green-800 dark:text-green-300 shadow-sm"
                          : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] shadow-sm"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <span className={photoFilter !== f.v ? f.color : ""}>{f.l}</span>
                    <span className="bg-slate-200 dark:bg-black/20 px-1.5 py-0.5 rounded-full text-[10px] text-[var(--text-primary)]">{f.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden p-0.5">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  statsLoading ? "animate-pulse bg-indigo-500/40 w-full" : "bg-gradient-to-r from-emerald-500 to-green-500"
                )}
                style={statsLoading ? {} : { width: `${photoStats.pct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-[var(--text-muted)]">
              <span className="text-green-700 dark:text-green-400 font-bold">{photoStats.withPhoto} ta rasmli ({photoStats.pct}%)</span>
              <span className="text-amber-700 dark:text-amber-400 font-bold">{photoStats.withoutPhoto} ta rasmsiz</span>
            </div>
          </div>
        )}

        {/* ── Mobile cards ── */}
        <div className="sm:hidden space-y-3">
          {isLoading && [...Array(5)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse space-y-3">
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
            <div className="card p-8 text-center text-[var(--text-muted)] font-medium text-sm border border-[var(--border)]">Xodimlar topilmadi</div>
          )}
          {employees.map((emp: any) => (
            <div key={emp.id} className={cn("card p-4 border border-[var(--border)] transition-all bg-[var(--bg-card)]", selectedIds.includes(emp.id) && "ring-2 ring-indigo-500 bg-indigo-500/5")}>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleSelect(emp.id, !selectedIds.includes(emp.id))}
                  className="text-[var(--text-muted)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex-shrink-0"
                >
                  {selectedIds.includes(emp.id)
                    ? <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    : <Square className="w-5 h-5" />}
                </button>

                <button onClick={() => handlePhotoClick(emp.id)} className="relative group flex-shrink-0">
                  {emp.photoUrl
                    ? <img src={buildPhotoUrl(emp.photoUrl)} alt={emp.fullName} className="w-11 h-11 rounded-full object-cover border border-[var(--border)]" />
                    : <div className={cn("w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner", getAvatarColor(emp.fullName))}>
                        {getInitials(emp.fullName)}
                      </div>
                  }
                  <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </button>

                <button className="flex-1 min-w-0 text-left" onClick={() => router.push(`/dashboard/employees/${emp.id}`)}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-bold text-sm text-[var(--text-primary)]">{emp.fullName}</p>
                    {lunchLateMap.has(emp.id) && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-700 dark:text-orange-400">
                        <Coffee className="w-2.5 h-2.5" />+{lunchLateMap.get(emp.id)}m
                      </span>
                    )}
                    {onLeaveMap.has(emp.id) && (
                      <span
                        className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      >
                        <Palmtree className="w-2.5 h-2.5" />
                        {LEAVE_LABELS[onLeaveMap.get(emp.id)?.type]?.emoji} Ta'tilda
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] font-medium truncate mt-0.5">{emp.department?.name} · {emp.position?.name}</p>
                </button>

                {emp.firedAt || emp.status === 'FIRED'
                  ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 flex-shrink-0">Ketgan</span>
                  : emp.status === 'ON_LEAVE'
                  ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex-shrink-0">Ta'tilda</span>
                  : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/30 flex-shrink-0">Faol</span>
                }
              </div>

              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border)]">
                <span className="font-mono text-xs font-semibold text-[var(--text-muted)]">{emp.employeeNo || "—"}</span>
                <span className="text-xs font-bold text-[var(--text-primary)]">{formatMoney(emp.baseSalary)}</span>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={() => { setEditEmp(emp); setModalOpen(true); }}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 px-2 py-1 rounded text-xs font-bold"
                  >
                    Tahrirlash
                  </button>
                  {!emp.firedAt && emp.status !== 'FIRED' && (
                    <button
                      onClick={() => { setFireEmp(emp); setFireModalOpen(true); }}
                      className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 px-2 py-1 rounded text-xs font-bold"
                    >
                      Bo'shatish
                    </button>
                  )}
                  <button
                    onClick={() => confirm("O'chirishni tasdiqlaysizmi?") && deleteMutation.mutate(emp.id)}
                    className="p-1.5 rounded text-[var(--text-muted)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div ref={mobileSentinelRef} className="h-4 sm:hidden" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-3 sm:hidden">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ── Desktop Table ── */}
        <div className="hidden sm:block card overflow-hidden border border-[var(--border)] shadow-md bg-[var(--bg-card)]">
          <div ref={tableContainerRef} className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-250px)]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-20">
                <tr className="border-b border-[var(--border)] bg-[var(--bg-card)]/90 backdrop-blur-md">
                  <th className="pl-5 pr-2 py-3.5 w-10">
                    <button type="button" onClick={toggleSelectAll} className="text-[var(--text-muted)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      {isAllSelected
                        ? <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        : selectedIds.length > 0
                        ? <Square className="w-4 h-4 text-indigo-600/60 dark:text-indigo-400/60" />
                        : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  {["Xodim", "Bo'lim", "Lavozim", "Terminal ID", "Asosiy maosh", "Holat", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border)]">
                    {[...Array(8)].map((_, j) => (
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
                    onLeave={onLeaveMap.get(emp.id)}
                    onEdit={(e) => { setEditEmp(e); setModalOpen(true); }}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onFire={(e) => { setFireEmp(e); setFireModalOpen(true); }}
                    onPhoto={handlePhotoClick}
                    uploadingId={uploadingEmpId}
                    router={router}
                    selected={selectedIds.includes(emp.id)}
                    onSelect={toggleSelect}
                  />
                ))}

                {!isLoading && employees.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-[var(--text-muted)] text-sm font-bold">
                      Xodimlar topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div ref={sentinelRef} className="h-4" />
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!hasNextPage && employees.length > 0 && !isLoading && (
              <p className="text-center text-xs text-[var(--text-muted)] font-bold py-3 border-t border-[var(--border)]">
                Barcha {total} ta xodim yuklandi ✓
              </p>
            )}
          </div>

          {employees.length > 0 && (
            <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--bg-card)]/50 text-xs font-bold text-[var(--text-muted)]">
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
        currentUserRole={user?.role}
      />
      <FireModal 
        open={fireModalOpen} 
        onClose={() => { setFireModalOpen(false); setFireEmp(null); }} 
        employee={fireEmp} 
        targetHospitalId={targetHospitalId}
      />

      {/* ── Bulk Action Floating Bar ── */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 inset-x-4 z-50 max-w-xl mx-auto animate-in slide-in-from-bottom-5 duration-200">
          {showBulkDept && (
            <div className="mb-2 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-3.5 shadow-2xl space-y-2">
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">O'tkaziladigan bo'limni tanlang</p>
              <div className="flex gap-2">
                <select
                  className="input-field flex-1 text-sm font-medium"
                  value={bulkDeptId}
                  onChange={(e) => setBulkDeptId(e.target.value)}
                >
                  <option value="">Bo'lim tanlang</option>
                  {(departments as any[]).map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => bulkDeptId && bulkDeptMutation.mutate(bulkDeptId)}
                  disabled={!bulkDeptId || bulkDeptMutation.isPending}
                  className="btn-primary text-sm px-4 whitespace-nowrap font-bold"
                >
                  {bulkDeptMutation.isPending ? "..." : "Saqlash"}
                </button>
              </div>
            </div>
          )}
          <div className="bg-indigo-600 rounded-2xl px-5 py-3 shadow-2xl flex items-center justify-between gap-3 border border-indigo-400/30">
            <span className="text-white font-extrabold text-sm">
              {selectedIds.length} ta xodim tanlandi
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowBulkDept(v => !v); setBulkDeptId(""); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors"
              >
                <Building2 className="w-4 h-4" />
                <span>Bo'lim</span>
              </button>
              <button
                onClick={() => {
                  if (confirm(`${selectedIds.length} ta xodimni o'chirasizmi? Bu amalni qaytarib bo'lmaydi.`))
                    bulkDeleteMutation.mutate();
                }}
                disabled={bulkDeleteMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-xs font-bold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {bulkDeleteMutation.isPending ? "..." : <span>O'chirish</span>}
              </button>
              <button
                onClick={() => { setSelectedIds([]); setShowBulkDept(false); }}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showPhotoMenuMain && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => { setShowPhotoMenuMain(false); setUploadingEmpId(null); }}>
          <div className="w-full max-w-lg bg-[var(--bg-card)] rounded-t-2xl border-t border-[var(--border)] p-4 pb-8 space-y-2 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 rounded-full bg-[var(--border)] mx-auto mb-3 opacity-60" />
            <button type="button"
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-bold transition-colors"
              onClick={() => { setShowPhotoMenuMain(false); photoInputCameraRef.current?.click(); }}>
              <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Kameradan rasmga olish</span>
            </button>
            <button type="button"
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-bold transition-colors"
              onClick={() => { setShowPhotoMenuMain(false); photoInputRef.current?.click(); }}>
              <ImageIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Galereyadan tanlash</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}