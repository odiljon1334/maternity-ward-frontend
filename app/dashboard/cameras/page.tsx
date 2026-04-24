"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { hikconnectApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { useAuthStore } from "@/stores/auth";
import { isSuperLike, cn } from "@/lib/utils";
import {
  Camera, Maximize2, X, Play, Loader2, RefreshCw,
  Video, AlertCircle, Minimize2, LayoutGrid,
} from "lucide-react";
import Hls from "hls.js";

// ─── HLS Video Player ────────────────────────────────────────────────────────

function HlsPlayer({
  url,
  autoPlay = true,
  className = "",
  onError,
}: {
  url: string;
  autoPlay?: boolean;
  className?: string;
  onError?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        backBufferLength: 10,
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) onError?.();
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = url;
      if (autoPlay) video.play().catch(() => {});
    } else {
      onError?.();
    }

    return () => {
      hls?.destroy();
      video.pause();
      video.src = "";
    };
  }, [url, autoPlay, onError]);

  return (
    <video
      ref={videoRef}
      className={cn("w-full h-full object-contain bg-black", className)}
      muted
      playsInline
      controls
    />
  );
}

// ─── Single Camera Tile ───────────────────────────────────────────────────────

function CameraTile({
  cam,
  onExpand,
}: {
  cam: any;
  onExpand: (cam: any) => void;
}) {
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState<string | null>(null);
  const [playing, setPlaying]  = useState(false);

  const loadStream = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await hikconnectApi.liveUrl(cam.id);
      setLiveUrl(result.url);
      setPlaying(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Stream yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  const stopStream = () => {
    setPlaying(false);
    setLiveUrl(null);
    setError(null);
  };

  return (
    <div className="card overflow-hidden flex flex-col group">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "w-2 h-2 rounded-full flex-shrink-0 transition-colors",
              cam.isActive
                ? playing
                  ? "bg-red-500 animate-pulse"
                  : "bg-emerald-500"
                : "bg-gray-500"
            )}
          />
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
            {cam.name}
          </p>
          {cam.hospital && (
            <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-hover)] px-1.5 py-0.5 rounded flex-shrink-0">
              {cam.hospital.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {playing && liveUrl && (
            <button
              onClick={() => onExpand({ ...cam, liveUrl })}
              className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-white"
              title="To'liq ekran"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
          {playing && (
            <button
              onClick={stopStream}
              className="p-1 rounded hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400"
              title="To'xtatish"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Video area */}
      <div className="relative bg-[#0a0a0a] aspect-video flex items-center justify-center overflow-hidden">
        {playing && liveUrl ? (
          <HlsPlayer
            url={liveUrl}
            onError={() => {
              setPlaying(false);
              setError("Stream to'xtatildi yoki ulanish uzildi");
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-14 h-14 rounded-full bg-[var(--bg-hover)] flex items-center justify-center">
              <Camera className="w-6 h-6 text-gray-500" />
            </div>
            {error ? (
              <>
                <div className="flex items-center gap-1.5 text-red-400 text-xs px-4 text-center">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={loadStream}
                  className="btn-secondary py-1 px-3 text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" /> Qayta urinish
                </button>
              </>
            ) : (
              <button
                onClick={loadStream}
                disabled={loading || !cam.isActive}
                className={cn(
                  "py-1.5 px-4 text-sm rounded-lg font-medium flex items-center gap-2 transition-colors",
                  cam.isActive
                    ? "btn-primary"
                    : "bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-not-allowed"
                )}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {loading
                  ? "Ulanmoqda..."
                  : cam.isActive
                  ? "Jonli ko'rish"
                  : "Nofaol"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer — stream info */}
      {(cam.streamPath || cam.cameraIndexCode) && (
        <div className="px-4 py-2 text-xs text-[var(--text-muted)] font-mono border-t border-[var(--border)] truncate">
          {cam.streamPath
            ? `📡 ${cam.streamPath}`
            : `🔗 ${cam.cameraIndexCode}`}
        </div>
      )}
    </div>
  );
}

// ─── Fullscreen Modal ─────────────────────────────────────────────────────────

function FullscreenModal({
  cam,
  onClose,
}: {
  cam: { name: string; liveUrl: string; hospital?: { name: string } };
  onClose: () => void;
}) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Topbar */}
      <div className="flex items-center justify-between px-5 py-3 bg-black/80 border-b border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <Camera className="w-4 h-4 text-red-400" />
          <span className="text-sm font-semibold text-white">{cam.name}</span>
          {cam.hospital && (
            <span className="text-xs text-gray-400 bg-white/10 px-2 py-0.5 rounded">
              {cam.hospital.name}
            </span>
          )}
          <span className="text-xs bg-red-600/30 text-red-300 border border-red-500/30 px-2 py-0.5 rounded font-mono">
            LIVE
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-sm"
        >
          <Minimize2 className="w-4 h-4" />
          <span>Yopish</span>
        </button>
      </div>

      {/* Video */}
      <div className="flex-1 overflow-hidden">
        <HlsPlayer url={cam.liveUrl} className="w-full h-full" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const GRID_OPTIONS = [
  { cols: 1, label: "1" },
  { cols: 2, label: "2" },
  { cols: 3, label: "3" },
  { cols: 4, label: "4" },
];

export default function CamerasPage() {
  const { user, selectedHospital } = useAuthStore();
  const isSuper = isSuperLike(user?.role);
  const targetHospitalId = isSuper ? selectedHospital?.id : undefined;

  const { data: cameras = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["cameras", targetHospitalId],
    queryFn: () => hikconnectApi.cameras(targetHospitalId),
    refetchOnWindowFocus: false,
  });

  const [fullscreenCam, setFullscreenCam] = useState<any | null>(null);
  const [gridCols, setGridCols] = useState(2);

  const camList = cameras as any[];
  const activeCams  = camList.filter((c) => c.isActive);
  const inactiveCams = camList.filter((c) => !c.isActive);

  return (
    <div className="flex flex-col h-full">
      <Topbar
        title="Video Kuzatuv"
        subtitle={isLoading ? "yuklanmoqda..." : `${camList.length} ta kamera`}
      />

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        {/* Controls bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            {activeCams.length > 0 && (
              <span className="badge-green">{activeCams.length} faol</span>
            )}
            {inactiveCams.length > 0 && (
              <span className="badge-gray">{inactiveCams.length} nofaol</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Grid cols picker */}
            <div className="flex items-center gap-0.5 bg-[var(--bg-hover)] rounded-lg p-1">
              <LayoutGrid className="w-3.5 h-3.5 text-[var(--text-muted)] mx-1.5" />
              {GRID_OPTIONS.map(({ cols, label }) => (
                <button
                  key={cols}
                  onClick={() => setGridCols(cols)}
                  className={cn(
                    "w-7 h-7 rounded text-xs font-medium transition-colors",
                    gridCols === cols
                      ? "bg-indigo-600 text-white"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
              Yangilash
            </button>
          </div>
        </div>

        {/* States */}
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
            <p className="font-medium text-[var(--text-primary)] mb-1">Kameralar yo'q</p>
            <p className="text-sm text-[var(--text-muted)]">
              Sozlamalar → Kameralar bo&apos;limidan qo&apos;shing
            </p>
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
            }}
          >
            {camList.map((cam: any) => (
              <CameraTile key={cam.id} cam={cam} onExpand={setFullscreenCam} />
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen overlay */}
      {fullscreenCam && (
        <FullscreenModal
          cam={fullscreenCam}
          onClose={() => setFullscreenCam(null)}
        />
      )}
    </div>
  );
}
