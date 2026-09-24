/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { departmentsApi, positionsApi, hikvisionApi, hospitalsApi, authApi, photoUrl } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { useAuthStore } from "@/stores/auth";
import { useForm } from "react-hook-form";
import {
  Building2, Briefcase, Plus, Edit2, Trash2, X, Check, Bell, BellOff,
  Cpu, Wifi, WifiOff, RefreshCw, ImageUp,
} from "lucide-react";
import { usePushNotification } from "@/hooks/usePushNotification";
import { cn, formatTerminalConnectivity, isSuperLike } from "@/lib/utils";
import { useConfirmation } from "@/components/ui";
import { TerminalSyncStatus, useTerminalSync } from "@/components/settings/TerminalSync";
import { TelegramBotAccessPanel } from "@/components/settings/TelegramBotAccessPanel";
import { GeofencePanel } from "@/components/settings/GeofencePanel";
import { WorkSitesPanel } from "@/components/settings/WorkSitesPanel";

// ─────────────────────────────────────────────
// SHARED: Inline Edit Row
// ─────────────────────────────────────────────
function EditableRow({
  value, onSave, onDelete,
}: { value: string; onSave: (v: string) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  return editing ? (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)]">
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { onSave(val); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
        className="input-field flex-1 py-1.5 text-sm"
      />
      <button onClick={() => { onSave(val); setEditing(false); }}
        className="p-1.5 rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors">
        <Check className="w-4 h-4" />
      </button>
      <button onClick={() => setEditing(false)}
        className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  ) : (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] table-row-hover group">
      <span className="text-sm text-[var(--text-primary)]">{value}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)}
          className="p-1.5 rounded text-[var(--text-muted)] hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete}
          className="p-1.5 rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DEPARTMENTS PANEL
// ─────────────────────────────────────────────
function DepartmentsPanel({ targetHospitalId }: { targetHospitalId?: string }) {
  const qc = useQueryClient();
  const { confirm } = useConfirmation();
  const [adding, setAdding] = useState(false);
  const { register, handleSubmit, reset } = useForm<{ name: string; code: string }>();
  const params = targetHospitalId ? { targetHospitalId } : undefined;

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["departments", targetHospitalId],
    queryFn: () => departmentsApi.list(params),
  });

  const createMut = useMutation({
    mutationFn: (d: any) => departmentsApi.create(d, params),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["departments"] }); toast.success("Bo'lim qo'shildi"); reset(); setAdding(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => departmentsApi.update(id, { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["departments"] }); toast.success("Yangilandi"); },
    onError: () => toast.error("Yangilashda xatolik"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => departmentsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["departments"] }); toast.success("O'chirildi"); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "O'chirishda xatolik"),
  });

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-[var(--text-primary)]">Bo&apos;limlar</h3>
          <span className="badge-gray">{(departments as any[]).length}</span>
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary py-1.5 px-3 text-xs">
          <Plus className="w-3.5 h-3.5" /> Qo&apos;shish
        </button>
      </div>

      {adding && (
        <form
          onSubmit={handleSubmit((d) => createMut.mutate({ ...d, description: "" }))}
          className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-hover)] space-y-2"
        >
          <input {...register("name", { required: true })} placeholder="Bo'lim nomi" className="input-field text-sm" />
          <input {...register("code", { required: true })} placeholder="Kod (masalan: TUG, REA)" className="input-field text-sm" />
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={createMut.isPending} className="btn-primary py-1.5 px-3 text-xs flex-1">
              Saqlash
            </button>
            <button type="button" onClick={() => { setAdding(false); reset(); }} className="btn-secondary py-1.5 px-3 text-xs flex-1">
              Bekor
            </button>
          </div>
        </form>
      )}

      <div className="max-h-64 overflow-y-auto">
        {isLoading && <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">Yuklanmoqda...</div>}
        {(departments as any[]).map((d) => (
          <EditableRow
            key={d.id}
            value={d.name}
            onSave={(name) => updateMut.mutate({ id: d.id, name })}
            onDelete={() => void confirm({
              title: "Bo‘lim o‘chirilsinmi?",
              description: `${d.name} bo‘limi xodimlar yoki grafiklarda ishlatilsa, tizim o‘chirishni rad etishi mumkin.`,
              confirmLabel: "O‘chirish",
              tone: "danger",
            }).then((approved) => approved && deleteMut.mutate(d.id))}
          />
        ))}
        {!isLoading && (departments as any[]).length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">Bo&apos;limlar yo&apos;q</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// POSITIONS PANEL
// ─────────────────────────────────────────────
function PositionsPanel({ targetHospitalId }: { targetHospitalId?: string }) {
  const qc = useQueryClient();
  const { confirm } = useConfirmation();
  const [adding, setAdding] = useState(false);
  const { register, handleSubmit, reset } = useForm<{ name: string }>();
  const params = targetHospitalId ? { targetHospitalId } : undefined;

  const { data: positions = [], isLoading } = useQuery({
    queryKey: ["positions", targetHospitalId],
    queryFn: () => positionsApi.list(params),
  });

  const createMut = useMutation({
    mutationFn: (d: any) => positionsApi.create(d, params),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["positions"] }); toast.success("Lavozim qo'shildi"); reset(); setAdding(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => positionsApi.update(id, { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["positions"] }); toast.success("Yangilandi"); },
    onError: () => toast.error("Yangilashda xatolik"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => positionsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["positions"] }); toast.success("O'chirildi"); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "O'chirishda xatolik"),
  });

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-emerald-400" />
          <h3 className="font-semibold text-[var(--text-primary)]">Lavozimlar</h3>
          <span className="badge-gray">{(positions as any[]).length}</span>
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary py-1.5 px-3 text-xs">
          <Plus className="w-3.5 h-3.5" /> Qo&apos;shish
        </button>
      </div>

      {adding && (
        <form
          onSubmit={handleSubmit((d) => createMut.mutate(d))}
          className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-hover)] space-y-2"
        >
          <input {...register("name", { required: true })} placeholder="Lavozim nomi" className="input-field text-sm" />
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={createMut.isPending} className="btn-primary py-1.5 px-3 text-xs flex-1">Saqlash</button>
            <button type="button" onClick={() => { setAdding(false); reset(); }} className="btn-secondary py-1.5 px-3 text-xs flex-1">Bekor</button>
          </div>
        </form>
      )}

      <div className="max-h-64 overflow-y-auto">
        {isLoading && <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">Yuklanmoqda...</div>}
        {(positions as any[]).map((p) => (
          <EditableRow
            key={p.id}
            value={p.name}
            onSave={(name) => updateMut.mutate({ id: p.id, name })}
            onDelete={() => void confirm({
              title: "Lavozim o‘chirilsinmi?",
              description: `${p.name} lavozimi xodimlarda ishlatilsa, tizim o‘chirishni rad etishi mumkin.`,
              confirmLabel: "O‘chirish",
              tone: "danger",
            }).then((approved) => approved && deleteMut.mutate(p.id))}
          />
        ))}
        {!isLoading && (positions as any[]).length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">Lavozimlar yo&apos;q</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function SettingsPage() {
  const { user, selectedHospital } = useAuthStore();

  // MINISTRY roli settings sahifasiga kira olmaydi
  if (user?.role === "MINISTRY") {
    return (
      <div>
        <Topbar title="Sozlamalar" subtitle="" />
        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <p className="text-4xl mb-4">🔒</p>
          <p className="text-lg font-semibold text-[var(--text-primary)] mb-1">Kirish taqiqlangan</p>
          <p className="text-sm text-[var(--text-muted)]">Sozlamalar sahifasi faqat kasalxona administratorlari uchun.</p>
        </div>
      </div>
    );
  }

  const targetHospitalId = isSuperLike(user?.role)
    ? (selectedHospital?.id || undefined)
    : undefined;

  // Terminallar paneli: faqat DIRECTOR/ADMIN — o'z muassasasi (user.hospitalId).
  // SUPER_ADMIN/ASSISTANT_ADMIN uchun bu yerda ko'rsatilmaydi — ular
  // terminallarni "Muassasalar" bo'limidan (har bir kartochka ichida)
  // to'g'ri kontekst bilan boshqaradi, shu yerda dublikat va chalkash edi.
  const canManageTerminals = user?.role === "DIRECTOR" || user?.role === "ADMIN";
  const terminalsHospitalId = canManageTerminals
    ? (user?.hospitalId || undefined)
    : undefined;

  // Brendlash (nom + logotip) — faqat DIRECTOR/ADMIN o'zi sozlaydi
  // (backend `/hospitals/me`, `/hospitals/me/logo` ham shu ikki rolga ochiq).
  const canManageBranding = user?.role === "DIRECTOR" || user?.role === "ADMIN";

  // HR Telegram bot ruxsati — DIRECTOR/ADMIN o'z muassasasi uchun,
  // SUPER_ADMIN/ASSISTANT_ADMIN tanlangan muassasa uchun.
  const botAccessHospitalId = isSuperLike(user?.role)
    ? targetHospitalId
    : canManageBranding
      ? (user?.hospitalId || undefined)
      : undefined;

  return (
    <div>
      <Topbar title="Sozlamalar" subtitle="Bo'lim va lavozim boshqaruvi" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-5">
        {canManageBranding && <HospitalBrandingPanel />}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
          <DepartmentsPanel targetHospitalId={targetHospitalId} />
          <PositionsPanel targetHospitalId={targetHospitalId} />
        </div>
        {canManageBranding && <GeofencePanel />}
        {(canManageBranding || (isSuperLike(user?.role) && targetHospitalId)) && (
          <WorkSitesPanel targetHospitalId={isSuperLike(user?.role) ? targetHospitalId : undefined} />
        )}
        {canManageTerminals && <TerminalsPanel hospitalId={terminalsHospitalId} />}
        {botAccessHospitalId && (
          <TelegramBotAccessPanel
            hospitalId={botAccessHospitalId}
            sendHospitalId={isSuperLike(user?.role)}
          />
        )}
        <PushNotificationsPanel />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// HOSPITAL BRANDING PANEL (tenant self-service — 2026-09-19,
// faqat DIRECTOR/ADMIN, faqat o'z shifoxonasi)
// ─────────────────────────────────────────────
function HospitalBrandingPanel() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["auth-profile"],
    queryFn: () => authApi.profile(),
  });
  const hospital = (profile as any)?.hospital;

  useEffect(() => {
    if (hospital?.name) setName(hospital.name);
  }, [hospital?.name]);

  const nameMut = useMutation({
    mutationFn: () => hospitalsApi.updateOwnInfo(name.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth-profile"] });
      toast.success("Shifoxona nomi yangilandi");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  const logoMut = useMutation({
    mutationFn: (file: File) => hospitalsApi.updateOwnLogo(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth-profile"] });
      toast.success("Logotip yangilandi");
      setPreview(null);
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || "Xatolik");
      setPreview(null);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    logoMut.mutate(file);
    e.target.value = "";
  };

  const logoSrc = preview || (hospital?.logoUrl ? photoUrl(hospital.logoUrl) : null);

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
        <Building2 className="w-4 h-4 text-indigo-400" />
        <h3 className="font-semibold text-[var(--text-primary)]">Shifoxona ma&apos;lumotlari</h3>
      </div>

      <div className="p-5 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="Logotip" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-6 h-6 text-[var(--text-muted)] opacity-40" />
            )}
          </div>
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={logoMut.isPending}
              className="btn-secondary text-xs py-1.5 px-3 gap-1.5"
            >
              <ImageUp className="w-3.5 h-3.5" />
              {logoMut.isPending ? "Yuklanmoqda..." : "Logotip yuklash"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-xs text-[var(--text-muted)] mt-1.5">PNG yoki JPG, tavsiya etilgan hajm — 512x512</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--text-muted)]">Shifoxona nomi</label>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field flex-1 text-sm"
              placeholder="Shifoxona nomi"
            />
            <button
              onClick={() => nameMut.mutate()}
              disabled={!name.trim() || name.trim() === hospital?.name || nameMut.isPending}
              className="btn-primary text-xs py-1.5 px-4"
            >
              {nameMut.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TERMINALS PANEL (DIRECTOR/ADMIN — o'z shifoxonasi;
// SUPER_ADMIN/ASSISTANT_ADMIN — tanlangan shifoxona)
// ─────────────────────────────────────────────
function TerminalsPanel({ hospitalId }: { hospitalId?: string }) {
  const { confirm } = useConfirmation();
  const qc = useQueryClient();
  const [addMode, setAddMode] = useState(false);
  const [name, setName] = useState("");
  const [devIndex, setDevIndex] = useState("");
  const [password, setPassword] = useState("");
  const sync = useTerminalSync(hospitalId);
  const syncing = sync.running;

  const { data: terminals = [], isLoading } = useQuery({
    queryKey: ["settings-terminals", hospitalId],
    queryFn: () => hikvisionApi.getTerminals(hospitalId as string).then((r: any) => {
      const data = r.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.data)) return data.data;
      return [];
    }),
    enabled: !!hospitalId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const addMut = useMutation({
    mutationFn: () => hikvisionApi.addTerminal({
      hospitalId: hospitalId as string, name,
      devIndex: devIndex.trim(),
      password: password.trim() || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings-terminals", hospitalId] });
      toast.success("Terminal qo'shildi");
      setName(""); setDevIndex(""); setPassword(""); setAddMode(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => hikvisionApi.deleteTerminal(id, hospitalId as string),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings-terminals", hospitalId] });
      toast.success("Terminal o'chirildi");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      hikvisionApi.toggleTerminal(id, isActive, hospitalId as string),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings-terminals", hospitalId] });
      toast.success("Yangilandi");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  const handleSync = async () => {
    if (!hospitalId) return;
    const approved = await confirm({
      title: "Terminal sinxronizatsiyasi boshlansinmi?",
      description: "Muassasadagi barcha faol xodimlar terminallarga yuboriladi. Jarayon serverda davom etadi — progress shu yerda ko‘rinadi, oynani yopsangiz ham bo‘ladi.",
      confirmLabel: "Sinxronlash",
      tone: "warning",
    });
    if (!approved) return;
    sync.start();
  };

  if (!hospitalId) return null;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-[var(--text-primary)]">Terminallar</h3>
          <span className="badge-gray">{(terminals as any[]).length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSync} disabled={syncing || (terminals as any[]).length === 0} className="btn-secondary py-1.5 px-3 text-xs gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sinxronlanmoqda…" : "Sync"}
          </button>
          <button onClick={() => setAddMode((v) => !v)} className="btn-primary py-1.5 px-3 text-xs">
            <Plus className="w-3.5 h-3.5" /> Qo&apos;shish
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {addMode && (
          <div className="space-y-2 pb-3 border-b border-[var(--border)]">
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-field text-sm" placeholder="Terminal nomi" />
            <input value={devIndex} onChange={(e) => setDevIndex(e.target.value)} className="input-field font-mono text-sm" placeholder="devIndex (Gateway UUID)" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} className="input-field text-sm" placeholder="Terminal paroli (ixtiyoriy)" type="password" />
            <p className="text-xs text-[var(--text-muted)]">devIndex — Gateway Web UI → Device Management&apos;da ko&apos;rinadi</p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => addMut.mutate()} disabled={!name || !devIndex || addMut.isPending} className="btn-primary py-1.5 px-3 text-xs flex-1">
                {addMut.isPending ? "Qo'shilmoqda..." : "Saqlash"}
              </button>
              <button onClick={() => { setAddMode(false); setPassword(""); }} className="btn-secondary py-1.5 px-3 text-xs flex-1">Bekor</button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-14 rounded-xl bg-[var(--bg-hover)] animate-pulse" />)}
          </div>
        ) : (terminals as any[]).length === 0 ? (
          <div className="text-center py-6 text-sm text-[var(--text-muted)]">
            <Cpu className="w-7 h-7 mx-auto mb-2 opacity-30" />
            Hali terminal qo&apos;shilmagan
          </div>
        ) : (
          <div className="space-y-2">
            {(terminals as any[]).map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)]">
                <div className={`p-1.5 rounded-lg ${t.isActive ? "bg-emerald-500/15" : "bg-[var(--bg-card)]"}`}>
                  {t.onlineStatus === "online"
                    ? <Wifi className="w-4 h-4 text-emerald-400" />
                    : <WifiOff className="w-4 h-4 text-[var(--text-muted)]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{t.name}</p>
                  <p className="text-xs font-mono text-[var(--text-muted)] truncate">{t.devIndex}</p>
                  <p className={`text-[11px] mt-0.5 ${t.onlineStatus === "online" ? "text-emerald-400" : "text-amber-400"}`}>
                    {formatTerminalConnectivity(t)}
                  </p>
                </div>
                <button
                  onClick={() => toggleMut.mutate({ id: t.id, isActive: !t.isActive })}
                  disabled={toggleMut.isPending}
                  className={`text-xs px-2 py-1 rounded-lg border ${t.isActive ? "border-emerald-500/25 text-emerald-400 bg-emerald-500/10" : "border-[var(--border)] text-[var(--text-muted)]"}`}
                  title={t.isActive ? "Faol — o'chirish uchun bosing" : "Nofaol — yoqish uchun bosing"}
                >
                  {t.isActive ? "Faol" : "Nofaol"}
                </button>
                <button
                  onClick={() => void confirm({
                    title: "Terminal o‘chirilsinmi?",
                    description: `${t.name} terminali tizim ro‘yxatidan o‘chiriladi.`,
                    confirmLabel: "O‘chirish",
                    tone: "danger",
                  }).then((approved) => approved && deleteMut.mutate(t.id))}
                  disabled={deleteMut.isPending}
                  className="btn-ghost p-1.5 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <TerminalSyncStatus job={sync.job} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Push Notifications Panel
// ─────────────────────────────────────────────
function PushNotificationsPanel() {
  const { supported, permission, subscribed, loading, lastError, subscribe, unsubscribe } =
    usePushNotification();

  const handleToggle = async () => {
    if (subscribed) {
      await unsubscribe();
      return;
    }
    const ok = await subscribe();
    if (ok) {
      toast.success("Push xabarnomalar yoqildi! 🔔");
    } else {
      toast.error(lastError || "Push xabarnomani yoqib bo'lmadi. Qayta urinib ko'ring.");
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
        <Bell className="w-4 h-4 text-indigo-400" />
        <h2 className="font-semibold text-[var(--text-primary)]">Push xabarnomalar</h2>
      </div>

      <div className="p-5 space-y-3">
        {!supported && (
          <p className="text-sm text-[var(--text-muted)] text-center py-4">
            Bu brauzer push xabarnomalarni qo&apos;llab-quvvatlamaydi
          </p>
        )}

        {supported && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {subscribed ? "Push xabarnomalar yoqilgan" : "Push xabarnomalar o'chirilgan"}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Ta&apos;til tasdiqlanganda, maosh hisoblanganda darhol xabar oling
                </p>
                {permission === "denied" && (
                  <p className="text-xs text-red-400 mt-1">
                    ⚠️ Brauzer sozlamalaridan ruxsat bering
                  </p>
                )}
                {lastError && permission !== "denied" && (
                  <p className="text-xs text-red-400 mt-1">{lastError}</p>
                )}
              </div>

              <button
                onClick={handleToggle}
                disabled={loading || permission === "denied"}
                className={cn(
                  "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                  subscribed
                    ? "bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/25"
                    : "bg-indigo-600/20 border border-indigo-500/25 text-indigo-400 hover:bg-indigo-600/30",
                  (loading || permission === "denied") && "opacity-50 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : subscribed ? (
                  <BellOff className="w-4 h-4" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
                {loading ? "..." : subscribed ? "O'chirish" : "Yoqish"}
              </button>
            </div>

            <div className="text-xs text-[var(--text-muted)] space-y-1 pt-2 border-t border-[var(--border)]">
              <p>📱 Xabarnomalar faqat ushbu qurilmaga yuboriladi</p>
              <p>🔔 Hodisalar haqida xabar keladi:</p>
              <ul className="pl-4 space-y-0.5">
                <li>• Ta&apos;til so&apos;rovi tasdiqlandi / rad etildi</li>
                <li>• Oylik maosh hisoblandi</li>
                <li>• Yangi ta&apos;til so&apos;rovi (direktor uchun)</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
