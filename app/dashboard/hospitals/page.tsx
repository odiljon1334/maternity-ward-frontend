/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hospitalsApi, employeesApi, paymentsApi, downloadBlob, hikvisionApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { useAuthStore } from "@/stores/auth";
import { useForm } from "react-hook-form";
import {
  Building2, Plus, Edit2, X, MapPin, Phone,
  UserPlus, Trash2, Archive, Send, ShieldOff, ShieldCheck,
  Cpu, Wifi, WifiOff, RefreshCw,
} from "lucide-react";

// ── Hospital Form Modal ─────────────────────────
type HospForm = { name: string; code: string; address?: string; phone?: string };

function HospitalModal({ open, onClose, hospital }: {
  open: boolean; onClose: () => void; hospital?: any;
}) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<HospForm>();

  useEffect(() => {
    if (hospital) {
      reset({ name: hospital.name, code: hospital.code, address: hospital.address || "", phone: hospital.phone || "" });
    } else {
      reset({ name: "", code: "", address: "", phone: "" });
    }
  }, [hospital, open, reset]);

  const mutation = useMutation({
    mutationFn: (data: HospForm) =>
      hospital ? hospitalsApi.update(hospital.id, data) : hospitalsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hospitals"] });
      toast.success(hospital ? "Yangilandi" : "Kasalxona qo'shildi");
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-card)] z-10">
          <h2 className="font-semibold text-[var(--text-primary)]">
            {hospital ? "Kasalxonani tahrirlash" : "Yangi kasalxona"}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Nomi *</label>
            <input {...register("name", { required: "Nom kiritish shart" })} className="input-field" placeholder="1-son Tug'ruq xona" />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Kod *</label>
            <input {...register("code", { required: "Kod kiritish shart" })} className="input-field font-mono" placeholder="TUG-04" disabled={!!hospital} />
            {errors.code && <p className="text-xs text-red-400 mt-1">{errors.code.message}</p>}
            {hospital && <p className="text-xs text-[var(--text-muted)] mt-1">Kod o&apos;zgartirib bo&apos;lmaydi</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Manzil</label>
            <input {...register("address")} className="input-field" placeholder="Toshkent sh., Chilonzor tumani" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Telefon</label>
            <input {...register("phone")} className="input-field" placeholder="+998711234567" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Bekor qilish</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? "Saqlanmoqda..." : (hospital ? "Yangilash" : "Qo'shish")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Director Form Modal ─────────────────────────
type DirCreateForm = { username: string; password: string; fullName: string; phone?: string };
type DirEditForm = { fullName: string; phone?: string; password?: string };

function DirectorModal({ open, onClose, hospitalId, hospitalName, director }: {
  open: boolean; onClose: () => void; hospitalId: string; hospitalName: string;
  director?: { id: string; username: string; name: string; phone?: string } | null;
}) {
  const qc = useQueryClient();
  const hasDirector = !!director;
  const [replaceMode, setReplaceMode] = useState(false);
  const showCreateForm = !hasDirector || replaceMode;
  const createForm = useForm<DirCreateForm>();
  const editForm = useForm<DirEditForm>();

  useEffect(() => {
    if (open) {
      setReplaceMode(false);
      if (hasDirector && director) {
        editForm.reset({ fullName: director.name, phone: director.phone || "", password: "" });
      } else {
        createForm.reset({ username: "", password: "", fullName: "", phone: "" });
      }
    }
  }, [open, hasDirector, director]);

  useEffect(() => {
    if (replaceMode) {
      createForm.reset({ username: "", password: "", fullName: "", phone: "" });
    }
  }, [replaceMode]);

  const createMut = useMutation({
    mutationFn: (data: DirCreateForm) => hospitalsApi.createDirector(hospitalId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hospitals"] });
      toast.success(replaceMode ? "Direktor almashtirildi." : "Direktor yaratildi");
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  const editMut = useMutation({
    mutationFn: (data: DirEditForm) => {
      const payload: any = { fullName: data.fullName, phone: data.phone || undefined };
      if (data.password) payload.password = data.password;
      return hospitalsApi.updateDirector(hospitalId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hospitals"] });
      toast.success("Direktor yangilandi");
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-card)] z-10">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">
              {replaceMode ? "Direktor almashtirish" : hasDirector ? "Direktori tahrirlash" : "Direktor yaratish"}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{hospitalName}</p>
          </div>
          <div className="flex items-center gap-2">
            {hasDirector && !replaceMode && (
              <button type="button" onClick={() => setReplaceMode(true)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors">
                Almashtirish
              </button>
            )}
            {replaceMode && (
              <button type="button" onClick={() => setReplaceMode(false)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-[var(--bg-hover)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-[var(--bg-card)] transition-colors">
                Orqaga
              </button>
            )}
            <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {showCreateForm && (
          <form onSubmit={createForm.handleSubmit((d) => createMut.mutate(d))} className="p-6 space-y-4">
            {replaceMode && director && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                <span className="mt-0.5">⚠️</span>
                <span><b>{director.name}</b> ({director.username}) — roli <b>EMPLOYEE</b> ga o&apos;zgartiriladi.</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">F.I.O *</label>
              <input {...createForm.register("fullName", { required: "Ism shart" })} className="input-field" placeholder="Aziz Karimov" />
              {createForm.formState.errors.fullName && <p className="text-xs text-red-400 mt-1">{createForm.formState.errors.fullName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Login *</label>
              <input {...createForm.register("username", { required: "Login shart", minLength: { value: 4, message: "Kamida 4 belgi" } })} className="input-field" placeholder="director4" />
              {createForm.formState.errors.username && <p className="text-xs text-red-400 mt-1">{createForm.formState.errors.username.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Parol *</label>
              <input {...createForm.register("password", { required: "Parol shart", minLength: { value: 6, message: "Kamida 6 belgi" } })} type="password" className="input-field" placeholder="••••••••" />
              {createForm.formState.errors.password && <p className="text-xs text-red-400 mt-1">{createForm.formState.errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Telefon</label>
              <input {...createForm.register("phone")} className="input-field" placeholder="+998901234567" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Bekor qilish</button>
              <button type="submit" disabled={createMut.isPending} className="btn-primary flex-1">
                {createMut.isPending ? (replaceMode ? "Almashtirilmoqda..." : "Yaratilmoqda...") : (replaceMode ? "Almashtirish" : "Yaratish")}
              </button>
            </div>
          </form>
        )}

        {!showCreateForm && (
          <form onSubmit={editForm.handleSubmit((d) => editMut.mutate(d))} className="p-6 space-y-4">
            {director?.username && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-hover)] text-xs text-[var(--text-muted)]">
                Login: <span className="font-mono font-medium text-[var(--text-primary)]">{director.username}</span>
                <span className="ml-1 opacity-60">(o&apos;zgartirib bo&apos;lmaydi)</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">F.I.O *</label>
              <input {...editForm.register("fullName", { required: "Ism shart" })} className="input-field" />
              {editForm.formState.errors.fullName && <p className="text-xs text-red-400 mt-1">{editForm.formState.errors.fullName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Telefon</label>
              <input {...editForm.register("phone")} className="input-field" placeholder="+998901234567" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Yangi parol <span className="font-normal opacity-60">(bo&apos;sh qoldirsa o&apos;zgarmaydi)</span>
              </label>
              <input {...editForm.register("password", { minLength: { value: 6, message: "Kamida 6 belgi" } })} type="password" className="input-field" placeholder="••••••••" />
              {editForm.formState.errors.password && <p className="text-xs text-red-400 mt-1">{editForm.formState.errors.password.message}</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Bekor qilish</button>
              <button type="submit" disabled={editMut.isPending} className="btn-primary flex-1">
                {editMut.isPending ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function TerminalModal({ open, onClose, hospital }: {
  open: boolean; onClose: () => void; hospital: any;
}) {
  const qc = useQueryClient();
  const [addMode, setAddMode] = useState(false);
  const [name, setName] = useState("");
  const [devIndex, setDevIndex] = useState("");
  const [password, setPassword] = useState(""); // <-- Parol uchun state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    total: number;
    created: number;
    skipped: number;
    failed: number;
    errors: { employeeNo: string; name: string; reason: string }[];
  } | null>(null);

  const { data: terminals = [], isLoading } = useQuery({
    queryKey: ["terminals", hospital?.id],
    queryFn: () => hikvisionApi.getTerminals(hospital.id).then((r: any) => {
      const data = r.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.data)) return data.data;
      return [];
    }),
    enabled: open && !!hospital?.id,
  });

  const addMut = useMutation({
    mutationFn: () => {
      console.log('name:', name, 'devIndex:', devIndex, 'password:', password, 'hospitalId:', hospital.id);
      return hikvisionApi.addTerminal({
        hospitalId: hospital.id,
        name,
        devIndex: devIndex.trim(),
        password: password.trim() || undefined, // Agar bo'sh bo'lsa yubormaymiz
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["terminals", hospital.id] });
      toast.success("Terminal qo'shildi");
      setName(""); setDevIndex(""); setPassword(""); setAddMode(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => hikvisionApi.deleteTerminal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["terminals", hospital?.id] });
      toast.success("Terminal o'chirildi");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  const handleSync = async () => {
    if (!confirm(`"${hospital?.name}" kasalxonasidagi barcha xodimlarni terminallarga yuklaysizmi?`)) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const result: any = await hikvisionApi.syncHospital(hospital.id);
      const { total, created, skipped, failed, errors } = result;
      setSyncResult({ total, created, skipped, failed, errors: errors ?? [] });
      toast.success(`Sync tugadi: ${created} yaratildi, ${skipped} skip, ${failed} xato`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Sync xatolik");
    } finally {
      setSyncing(false);
    }
  };

if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full sm:max-w-lg rounded-2xl max-h-[85vh] flex flex-col overflow-hidden z-10 shadow-2xl">
        
        {/* Header (Yuqori qism - o'zgarmaydi) */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-card)] shrink-0">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" /> Terminallar
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{hospital?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={syncing || (terminals as any[]).length === 0}
              className="btn-secondary text-xs gap-1.5"
              title="Barcha xodimlarni terminallarga yuklash"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Sync..." : "Sync"}
            </button>
            <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Scroll bo'ladigan asosiy tana qismi */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-14 rounded-xl bg-[var(--bg-hover)] animate-pulse" />)}
            </div>
          ) : (terminals as any[]).length === 0 ? (
            <div className="text-center py-8 text-sm text-[var(--text-muted)]">
              <Cpu className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Hali terminal qo&apos;shilmagan
            </div>
          ) : (
            <div className="space-y-2">
              {(terminals as any[]).map((t: any) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)]">
                  <div className={`p-1.5 rounded-lg ${t.isActive ? "bg-emerald-500/15" : "bg-[var(--bg-card)]"}`}>
                    {t.onlineStatus === 'online'
                      ? <Wifi className="w-4 h-4 text-emerald-400" />
                      : <WifiOff className="w-4 h-4 text-[var(--text-muted)]" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{t.name}</p>
                    <p className="text-xs font-mono text-[var(--text-muted)] truncate">{t.devIndex}</p>
                  </div>
                  <button
                    onClick={() => deleteMut.mutate(t.id)}
                    disabled={deleteMut.isPending}
                    className="btn-ghost p-1.5 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {syncResult && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-hover)] p-4 space-y-3">
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                Oxirgi sync natijasi
              </p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg bg-[var(--bg-card)] py-2">
                  <p className="text-sm font-bold text-[var(--text-primary)]">{syncResult.total}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Jami</p>
                </div>
                <div className="rounded-lg bg-emerald-500/10 py-2">
                  <p className="text-sm font-bold text-emerald-400">{syncResult.created}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Yangi</p>
                </div>
                <div className="rounded-lg bg-sky-500/10 py-2">
                  <p className="text-sm font-bold text-sky-400">{syncResult.skipped}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Skip</p>
                </div>
                <div className="rounded-lg bg-red-500/10 py-2">
                  <p className="text-sm font-bold text-red-400">{syncResult.failed}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Xato</p>
                </div>
              </div>

              {syncResult.errors.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto pt-1 border-t border-[var(--border)]">
                  {syncResult.errors.map((e, i) => (
                    <div key={i} className="text-xs px-2 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10">
                      <span className="font-medium text-[var(--text-primary)]">{e.name || e.employeeNo}</span>
                      <span className="text-[var(--text-muted)]"> — {e.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {addMode ? (
            <div className="space-y-3 pt-2 border-t border-[var(--border)]">
              <p className="text-xs font-medium text-[var(--text-muted)]">Yangi terminal</p>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-field"
                placeholder="Terminal nomi (masalan: Kirish terminali)"
              />
              <input
                value={devIndex}
                onChange={e => setDevIndex(e.target.value)}
                className="input-field font-mono text-sm"
                placeholder="devIndex (Gateway UUID)"
              />
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="Terminal paroli (ixtiyoriy)"
                type="password"
                />
              <p className="text-xs text-[var(--text-muted)]">
                devIndex — Gateway Web UI → Device Management da ko&apos;rinadi
              </p>
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setAddMode(false); setPassword(""); }} className="btn-secondary flex-1">Bekor</button>
                <button
                  onClick={() => addMut.mutate()}
                  disabled={!name || !devIndex || addMut.isPending}
                  className="btn-primary flex-1"
                >
                  {addMut.isPending ? "Qo'shilmoqda..." : "Qo'shish"}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddMode(true)} className="btn-secondary w-full gap-2">
              <Plus className="w-4 h-4" /> Terminal qo&apos;shish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────
export default function HospitalsPage() {
  const qc = useQueryClient();
  const { setSelectedHospital } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editHosp, setEditHosp] = useState<any>(null);
  const [dirModal, setDirModal] = useState<{ open: boolean; hospital: any; director?: any }>({ open: false, hospital: null });
  const [terminalModal, setTerminalModal] = useState<{ open: boolean; hospital: any }>({ open: false, hospital: null });
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data: hospitals = [], isLoading } = useQuery({
    queryKey: ["hospitals"],
    queryFn: hospitalsApi.list,
  });

  const { data: paymentOverview = [] } = useQuery({
    queryKey: ["payments-overview"],
    queryFn: () => paymentsApi.overview(),
  });

  // hospitals query dan keyin qo'shing
const { data: allTerminals = [] } = useQuery({
  queryKey: ["all-terminals"],
  queryFn: async () => {
    const res = await hikvisionApi.getTerminals("all");
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  },
  refetchInterval: 30_000, // 30 soniyada bir yangilanadi
});

// terminalStatusMap — hospitalId → {total, online}
const terminalStatusMap = (allTerminals as any[]).reduce((acc: any, t: any) => {
  if (!acc[t.hospitalId]) acc[t.hospitalId] = { total: 0, online: 0 };
  acc[t.hospitalId].total++;
  if (t.onlineStatus === 'online') acc[t.hospitalId].online++;
  return acc;
}, {});

  const paymentStatusMap = (paymentOverview as any[]).reduce((acc: any, p: any) => {
    acc[p.hospitalId] = p.status;
    return acc;
  }, {});

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hospitalsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hospitals"] });
      toast.success("Kasalxona o'chirildi");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "O'chirishda xatolik"),
  });

  const blockMutation = useMutation({
    mutationFn: ({ id, block }: { id: string; block: boolean }) =>
      block ? hospitalsApi.block(id) : hospitalsApi.unblock(id),
    onSuccess: (_, { block }) => {
      qc.invalidateQueries({ queryKey: ["hospitals"] });
      toast.success(block ? "Kasalxona bloklandi" : "Blok olib tashlandi");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  const handleResetTelegram = async (h: any) => {
    if (!confirm(`"${h.name}" kasalxonasining Telegram obunalarini o'chirasizmi?`)) return;
    try {
      const res = await hospitalsApi.resetTelegramSubs(h.id);
      toast.success(res?.message || "Telegram obunalar o'chirildi");
      qc.invalidateQueries({ queryKey: ["hospitals"] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Xatolik");
    }
  };

  const handleEnrollPic = async (h: any) => {
    setDownloading(h.id);
    try {
      const res = await employeesApi.exportEnrollPic({ targetHospitalId: h.id });
      downloadBlob(res.data, `enroll_pic_${h.code}_${new Date().toISOString().slice(0, 10)}.zip`);
      toast.success("Enroll rasmlar yuklab olindi");
    } catch {
      toast.error("Yuklab olishda xatolik");
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = (h: any) => {
    if (!confirm(`"${h.name}" ni o'chirishni tasdiqlaysizmi?\n\nDIQQAT: Barcha xodimlar, jadvallar va maosh ma'lumotlari ham o'chadi!`)) return;
    deleteMutation.mutate(h.id);
  };

  return (
    <div>
      <Topbar title="Kasalxonalar" subtitle="Barcha tug'ruq xonalar boshqaruvi" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--text-muted)]">
            Jami <span className="font-semibold text-[var(--text-primary)]">{(hospitals as any[]).length}</span> ta kasalxona
          </p>
          <button onClick={() => { setEditHosp(null); setModalOpen(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> Yangi kasalxona
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-5 h-56 animate-pulse bg-[var(--bg-hover)]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(hospitals as any[]).map((h) => (
              <div key={h.id} className={`card p-5 flex flex-col gap-3 ${(h.isBlocked || paymentStatusMap[h.id] === 'OVERDUE') ? 'border border-red-500/40' : ''}`}>

                {(h.isBlocked || paymentStatusMap[h.id] === 'OVERDUE') && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
                    <span>🔴</span>
                    <span>
                      {h.isBlocked && paymentStatusMap[h.id] !== 'OVERDUE'
                        ? "Admin tomonidan bloklangan"
                        : "To'lov kechikkan — tizim bloklangan"}
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${(h.isBlocked || paymentStatusMap[h.id] === 'OVERDUE') ? 'bg-red-600' : 'bg-indigo-600'}`}>
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)] text-sm leading-tight">{h.name}</h3>
                      <span className="text-xs font-mono text-indigo-400">{h.code}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {h.isActive ? <span className="badge-green">Aktiv</span> : <span className="badge-gray">Nofaol</span>}
                    {paymentStatusMap[h.id] === 'PAID' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        💳 To&apos;langan
                      </span>
                    )}
                    {paymentStatusMap[h.id] === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        ⏳ Kutilmoqda
                      </span>
                    )}
                    {paymentStatusMap[h.id] === 'OVERDUE' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/30">
                        🔴 Qarzdor
                      </span>
                    )}
                    {(h as any).telegramLinked ? (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${paymentStatusMap[h.id] === 'OVERDUE' ? 'bg-red-500/10 text-red-400/50 border border-red-500/20 line-through' : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'}`}>
                        <Send className="w-2.5 h-2.5" /> TG Aktiv
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border ${(h as any).directorHasPhone ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-[var(--bg-hover)] text-[var(--text-muted)] border-[var(--border)]'}`}>
                        <Send className="w-2.5 h-2.5" />
                        {(h as any).directorHasPhone ? 'TG ulanmagan' : "Tel yo'q"}
                      </span>
                    )}
                  </div>
                </div>

                {h._count && (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Xodim", val: h._count.employees },
                      { label: "Bo'lim", val: h._count.departments },
                      { label: "Foydalanuvchi", val: h._count.users },
                    ].map(({ label, val }) => (
                      <div key={label} className="bg-[var(--bg-hover)] rounded-lg p-2 text-center">
                        <p className="text-sm font-bold text-[var(--text-primary)]">{val}</p>
                        <p className="text-xs text-[var(--text-muted)]">{label}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-1">
                  {(h as any).directorName ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[var(--text-muted)] flex-shrink-0">👤</span>
                      <span className="text-[var(--text-primary)] font-medium truncate">{(h as any).directorName}</span>
                      {(h as any).directorPhone && (
                        <span className="text-[var(--text-muted)] ml-auto flex-shrink-0">{(h as any).directorPhone}</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-amber-400/70">
                      <span>⚠️</span><span>Direktor biriktirilmagan</span>
                    </div>
                  )}
                  {h.address && (
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{h.address}</span>
                    </div>
                  )}
                  {h.phone && (
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <Phone className="w-3 h-3 flex-shrink-0" /><span>{h.phone}</span>
                    </div>
                  )}
                </div>

                {terminalStatusMap[h.id] && (
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border ${
                    terminalStatusMap[h.id].online > 0
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                    {terminalStatusMap[h.id].online > 0
                      ? <Wifi className="w-3 h-3" />
                      : <WifiOff className="w-3 h-3" />
                    }
                    <span>
                      {terminalStatusMap[h.id].online}/{terminalStatusMap[h.id].total} terminal
                    </span>
                  </div>
                </div>
                )}

                {/* Actions row 1 */}
                <div className="flex gap-2 pt-1 border-t border-[var(--border)]">
                  <button
                    onClick={() => { setSelectedHospital(h); toast.success(`${h.name} tanlandi`); }}
                    className="btn-primary text-xs flex-1 justify-center gap-1.5"
                  >
                    Ko&apos;rish
                  </button>
                  <button onClick={() => { setEditHosp(h); setModalOpen(true); }} className="btn-ghost text-xs px-3 justify-center">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDirModal({
                      open: true, hospital: h,
                      director: (h as any).directorId
                        ? { id: (h as any).directorId, username: (h as any).directorUsername, name: (h as any).directorName, phone: (h as any).directorPhone }
                        : undefined,
                    })}
                    className="btn-ghost text-xs px-3 justify-center"
                    title={(h as any).directorId ? "Direktori tahrirlash" : "Direktor yaratish"}
                  >
                    {(h as any).directorId
                      ? <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                      : <UserPlus className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>

                {/* Actions row 2 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEnrollPic(h)}
                    disabled={downloading === h.id}
                    className="btn-secondary text-xs flex-1 justify-center gap-1.5"
                    title="Hikvision uchun rasmlarni zip yuklab olish"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    {downloading === h.id ? "Yuklanmoqda..." : "Enroll Pic"}
                  </button>
                  <button
                    onClick={() => setTerminalModal({ open: true, hospital: h })}
                    className="btn-ghost text-xs px-3 justify-center text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                    title="Terminallarni boshqarish"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => blockMutation.mutate({ id: h.id, block: !h.isBlocked })}
                    disabled={blockMutation.isPending}
                    className={`btn-ghost text-xs px-3 justify-center ${h.isBlocked ? "text-emerald-400 hover:bg-emerald-500/10" : "text-amber-400 hover:bg-amber-500/10"}`}
                    title={h.isBlocked ? "Blokni ochish" : "Kasalxonani bloklash"}
                  >
                    {h.isBlocked ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleResetTelegram(h)}
                    className="btn-ghost text-xs px-3 text-sky-400 hover:bg-sky-500/10 justify-center"
                    title="Telegram obunani reset qilish"
                  >
                    <span className="text-base leading-none">✈️</span>
                  </button>
                  <button
                    onClick={() => handleDelete(h)}
                    disabled={deleteMutation.isPending}
                    className="btn-ghost text-xs px-3 text-red-400 hover:bg-red-500/10 justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (hospitals as any[]).length === 0 && (
          <div className="card p-12 text-center">
            <Building2 className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-50" />
            <p className="text-sm text-[var(--text-muted)]">Hali kasalxona qo&apos;shilmagan</p>
            <button onClick={() => { setEditHosp(null); setModalOpen(true); }} className="btn-primary mt-4 mx-auto">
              <Plus className="w-4 h-4" /> Birinchi kasalxonani qo&apos;shing
            </button>
          </div>
        )}
      </div>

      <HospitalModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditHosp(null); }}
        hospital={editHosp}
      />
      <DirectorModal
        open={dirModal.open}
        onClose={() => setDirModal({ open: false, hospital: null })}
        hospitalId={dirModal.hospital?.id || ""}
        hospitalName={dirModal.hospital?.name || ""}
        director={dirModal.director}
      />
      <TerminalModal
        open={terminalModal.open}
        onClose={() => setTerminalModal({ open: false, hospital: null })}
        hospital={terminalModal.hospital}
      />
    </div>
  );
}
