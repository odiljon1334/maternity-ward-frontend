"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { departmentsApi, positionsApi, hikconnectApi, hospitalsApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { useAuthStore } from "@/stores/auth";
import { useForm } from "react-hook-form";
import {
  Building2, Briefcase, Plus, Edit2, Trash2, X, Check, Camera, Zap, Bell, BellOff,
} from "lucide-react";
import { usePushNotification } from "@/hooks/usePushNotification";
import { cn, isSuperLike } from "@/lib/utils";

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
            onDelete={() => confirm("O'chirishni tasdiqlaysizmi?") && deleteMut.mutate(d.id)}
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
            onDelete={() => confirm("O'chirishni tasdiqlaysizmi?") && deleteMut.mutate(p.id)}
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
// CAMERAS PANEL
// ─────────────────────────────────────────────
function CamerasPanel({ targetHospitalId }: { targetHospitalId?: string }) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isSuper = isSuperLike(user?.role);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    hospitalId: targetHospitalId ?? "",
    name: "",
    rtspUrl: "",
    streamPath: "",
    cameraIndexCode: "",
    channelNo: 1,
    deviceSerial: "",
  });

  // targetHospitalId o'zgarganda form ni yangilaymiz
  useEffect(() => {
    setForm(f => ({ ...f, hospitalId: targetHospitalId ?? "" }));
  }, [targetHospitalId]);

  // SUPER_ADMIN uchun har doim kasalxonalar ro'yhatini yuklaymiz
  const { data: hospitals } = useQuery({
    queryKey: ["hospitals-list"],
    queryFn: () => hospitalsApi.list(),
    enabled: isSuper,
  });

  const { data: cameras = [], isLoading } = useQuery({
    queryKey: ["cameras", targetHospitalId],
    queryFn: () => hikconnectApi.cameras(targetHospitalId),
  });

  const createMut = useMutation({
    mutationFn: () => hikconnectApi.createCamera({
      hospitalId:      form.hospitalId || targetHospitalId!,
      name:            form.name,
      streamPath:      form.streamPath || undefined,
      cameraIndexCode: form.cameraIndexCode || undefined,
      channelNo:       form.channelNo,
      deviceSerial:    form.rtspUrl || form.deviceSerial || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cameras"] });
      toast.success("Kamera qo'shildi");
      setAdding(false);
      setForm({ hospitalId: targetHospitalId ?? "", name: "", rtspUrl: "", streamPath: "", cameraIndexCode: "", channelNo: 1, deviceSerial: "" });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  const [editingCam, setEditingCam] = useState<any | null>(null);

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      hikconnectApi.updateCamera(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cameras"] });
      toast.success("Yangilandi");
      setEditingCam(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      hikconnectApi.updateCamera(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cameras"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => hikconnectApi.deleteCamera(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cameras"] }); toast.success("O'chirildi"); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  return (
    <div className="card lg:col-span-3">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-red-400" />
          <h3 className="font-semibold text-[var(--text-primary)]">Kameralar</h3>
          <span className="badge-gray">{(cameras as any[]).length}</span>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="btn-primary py-1.5 px-3 text-xs"
        >
          <Plus className="w-3.5 h-3.5" /> Qo&apos;shish
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-hover)]">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            {/* Hospital selector — SUPER_ADMIN uchun har doim ko'rsatiladi */}
            {isSuper && hospitals && (
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Kasalxona</label>
                <select
                  value={form.hospitalId}
                  onChange={(e) => setForm(f => ({ ...f, hospitalId: e.target.value }))}
                  className="input-field text-sm py-1.5"
                >
                  <option value="">Tanlang...</option>
                  {(hospitals as any[]).map((h: any) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Kamera nomi *</label>
              <input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Qabul xonasi"
                className="input-field text-sm py-1.5"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                Kamera IP (RTSP URL)
              </label>
              <input
                value={form.rtspUrl}
                onChange={(e) => setForm(f => ({ ...f, rtspUrl: e.target.value }))}
                placeholder="rtsp://admin:pass@192.168.1.3:554/Streaming/Channels/101"
                className="input-field text-sm py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                Stream Path
                <span className="ml-1 text-emerald-400">(MediaMTX nom)</span>
              </label>
              <input
                value={form.streamPath}
                onChange={(e) => setForm(f => ({ ...f, streamPath: e.target.value }))}
                placeholder="hospital1/cam1"
                className="input-field text-sm py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Device Serial (ixtiyoriy)</label>
              <input
                value={form.deviceSerial}
                onChange={(e) => setForm(f => ({ ...f, deviceSerial: e.target.value }))}
                placeholder="Qurilma seriya raqami"
                className="input-field text-sm py-1.5"
              />
            </div>
          </div>

          {/* Hint */}
          <p className="text-xs text-[var(--text-muted)] bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 mb-3">
            📡 <b>Stream Path</b> — MediaMTX da stream nomi.{" "}
            <span className="text-emerald-300">
              Masalan: <code className="font-mono">tug01/cam1</code> →{" "}
              FFmpeg: <code className="font-mono">ffmpeg -i rtsp://192.168.1.3.../... -f rtsp rtsp://vps:8554/tug01/cam1</code>
            </span>
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setAdding(false)}
              className="btn-secondary py-1.5 px-4 text-sm"
            >
              Bekor
            </button>
            <button
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending || !form.name || (!isSuper ? false : !form.hospitalId)}
              className="btn-primary py-1.5 px-4 text-sm"
            >
              {createMut.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </div>
      )}

      {/* Camera list */}
      {isLoading ? (
        <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">Yuklanmoqda...</div>
      ) : (cameras as any[]).length === 0 ? (
        <div className="px-4 py-10 text-center">
          <Camera className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-[var(--text-muted)]">Kameralar yo'q</p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {(cameras as any[]).map((cam: any) => (
            <div key={cam.id}>
              {editingCam?.id === cam.id ? (
                /* ── Edit mode ── */
                <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-hover)]">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Kamera nomi *</label>
                      <input
                        value={editingCam.name}
                        onChange={(e) => setEditingCam((c: any) => ({ ...c, name: e.target.value }))}
                        className="input-field text-sm py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Kamera IP (RTSP URL)</label>
                      <input
                        value={editingCam.deviceSerial || ""}
                        onChange={(e) => setEditingCam((c: any) => ({ ...c, deviceSerial: e.target.value }))}
                        placeholder="rtsp://admin:pass@192.168.1.3:554/..."
                        className="input-field text-sm py-1.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Stream Path <span className="text-emerald-400">(MediaMTX)</span></label>
                      <input
                        value={editingCam.streamPath || ""}
                        onChange={(e) => setEditingCam((c: any) => ({ ...c, streamPath: e.target.value }))}
                        placeholder="hospital1/cam1"
                        className="input-field text-sm py-1.5 font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingCam(null)} className="btn-secondary py-1.5 px-4 text-sm">Bekor</button>
                    <button
                      onClick={() => updateMut.mutate({ id: cam.id, data: { name: editingCam.name, streamPath: editingCam.streamPath || undefined, deviceSerial: editingCam.deviceSerial || undefined } })}
                      disabled={updateMut.isPending || !editingCam.name}
                      className="btn-primary py-1.5 px-4 text-sm"
                    >
                      {updateMut.isPending ? "Saqlanmoqda..." : "Saqlash"}
                    </button>
                  </div>
                </div>
              ) : (
                /* ── View mode ── */
                <div className="flex items-center gap-4 px-5 py-3 border-b border-[var(--border)] table-row-hover group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full flex-shrink-0", cam.isActive ? "bg-emerald-500" : "bg-gray-500")} />
                      <p className="text-sm font-medium text-[var(--text-primary)]">{cam.name}</p>
                      {cam.hospital && (
                        <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-hover)] px-1.5 py-0.5 rounded">{cam.hospital.name}</span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5 truncate">
                      {cam.streamPath && <span className="text-emerald-400">{cam.streamPath}</span>}
                      {cam.deviceSerial && <span className="ml-2 opacity-60">{cam.deviceSerial}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingCam({ ...cam })}
                      className="p-1.5 rounded text-[var(--text-muted)] hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                      title="Tahrirlash"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleMut.mutate({ id: cam.id, isActive: !cam.isActive })}
                      className={cn("p-1.5 rounded text-xs transition-colors", cam.isActive ? "text-emerald-400 hover:bg-emerald-500/10" : "text-gray-500 hover:bg-[var(--bg-hover)]")}
                      title={cam.isActive ? "O'chirish" : "Yoqish"}
                    >
                      {cam.isActive ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => confirm("Kamerani o'chirishni tasdiqlaysizmi?") && deleteMut.mutate(cam.id)}
                      className="p-1.5 rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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

  return (
    <div>
      <Topbar title="Sozlamalar" subtitle="Bo'lim va lavozim boshqaruvi" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
          <DepartmentsPanel targetHospitalId={targetHospitalId} />
          <PositionsPanel targetHospitalId={targetHospitalId} />
        </div>
        <CamerasPanel targetHospitalId={targetHospitalId} />
        <PushNotificationsPanel />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Push Notifications Panel
// ─────────────────────────────────────────────
function PushNotificationsPanel() {
  const { supported, permission, subscribed, loading, subscribe, unsubscribe } = usePushNotification();

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
        <Bell className="w-4 h-4 text-indigo-400" />
        <h2 className="font-semibold text-[var(--text-primary)]">Push xabarnomalar</h2>
      </div>

      <div className="p-5 space-y-3">
        {!supported && (
          <p className="text-sm text-[var(--text-muted)] text-center py-4">
            Bu brauzer push xabarnomalarni qo'llab-quvvatlamaydi
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
                  Ta'til tasdiqlanganda, maosh hisoblanganda darhol xabar oling
                </p>
                {permission === "denied" && (
                  <p className="text-xs text-red-400 mt-1">
                    ⚠️ Brauzer sozlamalaridan ruxsat bering
                  </p>
                )}
              </div>

              <button
                onClick={subscribed ? unsubscribe : subscribe}
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
              <p>🔔 Qaysi hodisalar haqida xabar keladi:</p>
              <ul className="pl-4 space-y-0.5">
                <li>• Ta'til so'rovi tasdiqlandi / rad etildi</li>
                <li>• Oylik maosh hisoblandi</li>
                <li>• Yangi ta'til so'rovi (direktor uchun)</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
