/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hikconnectApi, hospitalsApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { useAuthStore } from "@/stores/auth";
import { isSuperLike, cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Camera, Maximize2, X, Play, Loader2, RefreshCw,
  Video, AlertCircle, Minimize2, LayoutGrid,
  Plus, Edit2, Trash2, Settings2,
} from "lucide-react";
import Hls from "hls.js";

// ─── HLS Video Player ─────────────────────────────────────────────────────────
function HlsPlayer({ url, autoPlay = true, className = "", onError }: {
  url: string; autoPlay?: boolean; className?: string; onError?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;
    let hls: Hls | null = null;
    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: false, lowLatencyMode: true, backBufferLength: 10 });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { if (autoPlay) video.play().catch(() => {}); });
      hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) onError?.(); });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      if (autoPlay) video.play().catch(() => {});
    } else { onError?.(); }
    return () => { hls?.destroy(); video.pause(); video.src = ""; };
  }, [url, autoPlay, onError]);
  return <video ref={videoRef} className={cn("w-full h-full object-contain bg-black", className)} muted playsInline controls />;
}

// ─── Camera Modal (Add/Edit) ──────────────────────────────────────────────────
function CameraModal({ open, onClose, camera, hospitals, targetHospitalId, isSuper }: {
  open: boolean; onClose: () => void; camera?: any;
  hospitals: any[]; targetHospitalId?: string; isSuper: boolean;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ hospitalId: "", name: "", streamPath: "", deviceSerial: "" });

  useEffect(() => {
    if (open) {
      setForm({
        hospitalId: camera?.hospitalId ?? targetHospitalId ?? "",
        name: camera?.name ?? "",
        streamPath: camera?.streamPath ?? "",
        deviceSerial: camera?.deviceSerial ?? "",
      });
    }
  }, [open, camera, targetHospitalId]);

  const createMut = useMutation({
    mutationFn: () => hikconnectApi.createCamera({
      hospitalId: form.hospitalId || targetHospitalId!,
      name: form.name,
      streamPath: form.streamPath || undefined,
      deviceSerial: form.deviceSerial || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cameras"] }); toast.success("Kamera qo'shildi"); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  const updateMut = useMutation({
    mutationFn: () => hikconnectApi.updateCamera(camera.id, {
      name: form.name,
      streamPath: form.streamPath || undefined,
      deviceSerial: form.deviceSerial || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cameras"] }); toast.success("Yangilandi"); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  const isPending = createMut.isPending || updateMut.isPending;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-card)] z-10">
          <h2 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Camera className="w-4 h-4 text-red-400" />
            {camera ? "Kamerani tahrirlash" : "Yangi kamera"}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {isSuper && !camera && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Kasalxona *</label>
              <select value={form.hospitalId} onChange={e => setForm(f => ({ ...f, hospitalId: e.target.value }))} className="input-field">
                <option value="">Tanlang...</option>
                {hospitals.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Kamera nomi *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="Qabul xonasi" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Stream Path <span className="text-emerald-400">(MediaMTX)</span>
            </label>
            <input value={form.streamPath} onChange={e => setForm(f => ({ ...f, streamPath: e.target.value }))} className="input-field font-mono" placeholder="hospital1/cam1" />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              FFmpeg: <code className="font-mono text-emerald-400">ffmpeg -i rtsp://... -f rtsp rtsp://vps:8554/hospital1/cam1</code>
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">RTSP URL (ixtiyoriy)</label>
            <input value={form.deviceSerial} onChange={e => setForm(f => ({ ...f, deviceSerial: e.target.value }))} className="input-field font-mono" placeholder="rtsp://admin:pass@192.168.1.3:554/..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1">Bekor</button>
            <button
              onClick={() => camera ? updateMut.mutate() : createMut.mutate()}
              disabled={isPending || !form.name || (!camera && isSuper && !form.hospitalId)}
              className="btn-primary flex-1"
            >
              {isPending ? "Saqlanmoqda..." : camera ? "Yangilash" : "Qo'shish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Single Camera Tile ───────────────────────────────────────────────────────
function CameraTile({ cam, onExpand, onEdit, onDelete, onToggle, isSuper }: {
  cam: any; onExpand: (cam: any) => void;
  onEdit: (cam: any) => void; onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void; isSuper: boolean;
}) {
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const loadStream = async () => {
    setLoading(true); setError(null);
    try {
      const result = await hikconnectApi.liveUrl(cam.id);
      setLiveUrl(result.url); setPlaying(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Stream yuklab bo'lmadi");
    } finally { setLoading(false); }
  };

  const stopStream = () => { setPlaying(false); setLiveUrl(null); setError(null); };

  return (
    <div className="card overflow-hidden flex flex-col group">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("w-2 h-2 rounded-full flex-shrink-0", cam.isActive ? playing ? "bg-red-500 animate-pulse" : "bg-emerald-500" : "bg-gray-500")} />
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{cam.name}</p>
          {cam.hospital && (
            <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-hover)] px-1.5 py-0.5 rounded flex-shrink-0">{cam.hospital.name}</span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {playing && liveUrl && (
            <button onClick={() => onExpand({ ...cam, liveUrl })} className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-white" title="To'liq ekran">
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
          {playing && <button onClick={stopStream} className="p-1 rounded hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400"><X className="w-4 h-4" /></button>}
          {isSuper && (
            <>
              <button onClick={() => onEdit(cam)} className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-indigo-400"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => onToggle(cam.id, !cam.isActive)} className={cn("p-1 rounded text-[var(--text-muted)] transition-colors", cam.isActive ? "hover:text-amber-400 hover:bg-amber-500/10" : "hover:text-emerald-400 hover:bg-emerald-500/10")}>
                <Settings2 className="w-4 h-4" />
              </button>
              <button onClick={() => confirm("Kamerani o'chirishni tasdiqlaysizmi?") && onDelete(cam.id)} className="p-1 rounded hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </>
          )}
        </div>
      </div>

      {/* Video area */}
      <div className="relative bg-[#0a0a0a] aspect-video flex items-center justify-center overflow-hidden">
        {playing && liveUrl ? (
          <HlsPlayer url={liveUrl} onError={() => { setPlaying(false); setError("Stream to'xtatildi"); }} />
        ) : (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-14 h-14 rounded-full bg-[var(--bg-hover)] flex items-center justify-center">
              <Camera className="w-6 h-6 text-gray-500" />
            </div>
            {error ? (
              <>
                <div className="flex items-center gap-1.5 text-red-400 text-xs px-4 text-center">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /><span>{error}</span>
                </div>
                <button onClick={loadStream} className="btn-secondary py-1 px-3 text-xs flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3" /> Qayta urinish
                </button>
              </>
            ) : (
              <button
                onClick={loadStream}
                disabled={loading || !cam.isActive}
                className={cn("py-1.5 px-4 text-sm rounded-lg font-medium flex items-center gap-2 transition-colors",
                  cam.isActive ? "btn-primary" : "bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-not-allowed"
                )}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {loading ? "Ulanmoqda..." : cam.isActive ? "Jonli ko'rish" : "Nofaol"}
              </button>
            )}
          </div>
        )}
      </div>

      {(cam.streamPath || cam.cameraIndexCode) && (
        <div className="px-4 py-2 text-xs text-[var(--text-muted)] font-mono border-t border-[var(--border)] truncate">
          {cam.streamPath ? `📡 ${cam.streamPath}` : `🔗 ${cam.cameraIndexCode}`}
        </div>
      )}
    </div>
  );
}

// ─── Fullscreen Modal ─────────────────────────────────────────────────────────
function FullscreenModal({ cam, onClose }: { cam: any; onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 bg-black/80 border-b border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <Camera className="w-4 h-4 text-red-400" />
          <span className="text-sm font-semibold text-white">{cam.name}</span>
          {cam.hospital && <span className="text-xs text-gray-400 bg-white/10 px-2 py-0.5 rounded">{cam.hospital.name}</span>}
          <span className="text-xs bg-red-600/30 text-red-300 border border-red-500/30 px-2 py-0.5 rounded font-mono">LIVE</span>
        </div>
        <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-sm">
          <Minimize2 className="w-4 h-4" /><span>Yopish</span>
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <HlsPlayer url={cam.liveUrl} className="w-full h-full" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const GRID_OPTIONS = [{ cols: 1 }, { cols: 2 }, { cols: 3 }, { cols: 4 }];

export default function CamerasPage() {
  const { user, selectedHospital } = useAuthStore();
  const qc = useQueryClient();
  const isSuper = isSuperLike(user?.role);
  const targetHospitalId = isSuper ? selectedHospital?.id : undefined;

  const [fullscreenCam, setFullscreenCam] = useState<any>(null);
  const [gridCols, setGridCols] = useState(2);
  const [modal, setModal] = useState<{ open: boolean; camera?: any }>({ open: false });
  const [filterHospital, setFilterHospital] = useState("");

  const { data: hospitals = [] } = useQuery({
    queryKey: ["hospitals-list"],
    queryFn: () => hospitalsApi.list(),
    enabled: isSuper,
  });

  const effectiveHospitalId = isSuper ? (filterHospital || targetHospitalId) : undefined;

  const { data: cameras = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["cameras", effectiveHospitalId],
    queryFn: () => hikconnectApi.cameras(effectiveHospitalId),
    refetchOnWindowFocus: false,
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => hikconnectApi.updateCamera(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cameras"] }),
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => hikconnectApi.deleteCamera(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cameras"] }); toast.success("Kamera o'chirildi"); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xatolik"),
  });

  const camList = cameras as any[];
  const activeCams = camList.filter(c => c.isActive);

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Video Kuzatuv" subtitle={isLoading ? "yuklanmoqda..." : `${camList.length} ta kamera`} />

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            {activeCams.length > 0 && <span className="badge-green">{activeCams.length} faol</span>}
            {camList.length - activeCams.length > 0 && <span className="badge-gray">{camList.length - activeCams.length} nofaol</span>}
            {isSuper && (
              <select value={filterHospital} onChange={e => setFilterHospital(e.target.value)} className="input-field text-xs py-1.5 w-48">
                <option value="">Barcha kasalxonalar</option>
                {(hospitals as any[]).map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 bg-[var(--bg-hover)] rounded-lg p-1">
              <LayoutGrid className="w-3.5 h-3.5 text-[var(--text-muted)] mx-1.5" />
              {GRID_OPTIONS.map(({ cols }) => (
                <button key={cols} onClick={() => setGridCols(cols)}
                  className={cn("w-7 h-7 rounded text-xs font-medium transition-colors",
                    gridCols === cols ? "bg-indigo-600 text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  )}
                >{cols}</button>
              ))}
            </div>
            <button onClick={() => refetch()} disabled={isFetching} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5">
              <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} /> Yangilash
            </button>
            {isSuper && (
              <button onClick={() => setModal({ open: true })} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Kamera qo&apos;shish
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-sm text-[var(--text-muted)]">Kameralar yuklanmoqda...</p>
          </div>
        ) : camList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-hover)] flex items-center justify-center mb-4">
              <Video className="w-8 h-8 text-gray-500" />
            </div>
            <p className="font-medium text-[var(--text-primary)] mb-1">Kameralar yo&apos;q</p>
            {isSuper && (
              <button onClick={() => setModal({ open: true })} className="btn-primary mt-4 mx-auto">
                <Plus className="w-4 h-4" /> Kamera qo&apos;shish
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
            {camList.map((cam: any) => (
              <CameraTile
                key={cam.id}
                cam={cam}
                isSuper={isSuper}
                onExpand={setFullscreenCam}
                onEdit={(c) => setModal({ open: true, camera: c })}
                onDelete={(id) => deleteMut.mutate(id)}
                onToggle={(id, isActive) => toggleMut.mutate({ id, isActive })}
              />
            ))}
          </div>
        )}
      </div>

      {fullscreenCam && <FullscreenModal cam={fullscreenCam} onClose={() => setFullscreenCam(null)} />}

      <CameraModal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        camera={modal.camera}
        hospitals={hospitals as any[]}
        targetHospitalId={effectiveHospitalId}
        isSuper={isSuper}
      />
    </div>
  );
}