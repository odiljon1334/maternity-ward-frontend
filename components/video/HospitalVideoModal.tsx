"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { hikconnectApi } from "@/lib/api";
import { VideoPlayer } from "./VideoPlayer";
import { cn } from "@/lib/utils";
import {
  X, Camera, WifiOff, AlertCircle, RefreshCw,
  Grid2x2, Maximize2, ChevronLeft,
} from "lucide-react";

interface Props {
  hospitalId:   string;
  hospitalName: string;
  onClose:      () => void;
}

type GridLayout = 1 | 2 | 4;

interface LiveCamera {
  id:              string;
  name:            string;
  cameraIndexCode: string;
  liveUrl:         string | null;
  loading:         boolean;
  error:           string | null;
}

// ─── Single camera tile ────────────────────────────────────────────────────

function CameraTile({
  cam,
  layout,
  onRefresh,
}: {
  cam: LiveCamera;
  layout: GridLayout;
  onRefresh: (id: string) => void;
}) {
  if (cam.loading) {
    return (
      <div className={cn(
        "bg-[#0d0f17] rounded-xl flex items-center justify-center border border-[#2d3748]",
        layout === 1 ? "aspect-video w-full" : "aspect-video"
      )}>
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-500">{cam.name}</p>
        </div>
      </div>
    );
  }

  if (cam.error || !cam.liveUrl) {
    return (
      <div className={cn(
        "bg-[#0d0f17] rounded-xl flex flex-col items-center justify-center gap-3 border border-[#2d3748] p-4",
        layout === 1 ? "aspect-video w-full" : "aspect-video"
      )}>
        <AlertCircle className="w-8 h-8 text-red-400/60" />
        <p className="text-xs text-gray-500 text-center">{cam.name}</p>
        <p className="text-[10px] text-red-400/70 text-center">{cam.error ?? "URL olinmadi"}</p>
        <button
          onClick={() => onRefresh(cam.id)}
          className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white px-2 py-1 bg-white/5 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Qayta
        </button>
      </div>
    );
  }

  return (
    <VideoPlayer
      src={cam.liveUrl}
      title={cam.name}
      cameraId={cam.id}
      className={cn(
        "w-full",
        layout === 1 ? "aspect-video" : "aspect-video"
      )}
    />
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function HospitalVideoModal({ hospitalId, hospitalName, onClose }: Props) {
  const [layout, setLayout] = useState<GridLayout>(4);
  const [liveUrls, setLiveUrls] = useState<Record<string, { url: string | null; loading: boolean; error: string | null }>>({});

  // 1. Kasalxona kameralarini olish
  const { data: cameras, isLoading: camsLoading, error: camsError } = useQuery({
    queryKey: ["hospital-cameras", hospitalId],
    queryFn: () => hikconnectApi.cameras(hospitalId),
  });

  // Kameralar yuklanganda live URL larni so'rash
  useEffect(() => {
    if (!cameras) return;
    (cameras as any[]).forEach((cam) => fetchLiveUrl(cam));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameras]);

  // 2. Live URL olish
  const fetchLiveUrl = async (cam: { id: string; cameraIndexCode?: string }) => {
    setLiveUrls((prev) => ({
      ...prev,
      [cam.id]: { url: null, loading: true, error: null },
    }));
    try {
      const result = await hikconnectApi.liveUrl(cam.id);
      setLiveUrls((prev) => ({
        ...prev,
        [cam.id]: { url: result.url, loading: false, error: null },
      }));
    } catch (err: any) {
      setLiveUrls((prev) => ({
        ...prev,
        [cam.id]: {
          url:     null,
          loading: false,
          error:   err?.response?.data?.message ?? "URL olinmadi",
        },
      }));
    }
  };

  const handleRefresh = (camId: string) => {
    const cam = (cameras as any[])?.find((c: any) => c.id === camId);
    if (cam) fetchLiveUrl(cam);
  };

  // Merged camera list
  const camList = (cameras as any[]) ?? [];
  const liveCameras: LiveCamera[] = camList.map((c: any) => ({
    id:              c.id,
    name:            c.name,
    cameraIndexCode: c.cameraIndexCode,
    liveUrl:         liveUrls[c.id]?.url    ?? null,
    loading:         liveUrls[c.id]?.loading ?? true,
    error:           liveUrls[c.id]?.error   ?? null,
  }));

  const gridClass: Record<GridLayout, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    4: "grid-cols-2 md:grid-cols-2 lg:grid-cols-2",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0d0f17] border border-[#2d3748] rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d3748] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <Camera className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">{hospitalName}</h2>
              <p className="text-[11px] text-gray-500">
                Real vaqt video kuzatuv
                {camList.length > 0 && ` — ${camList.length} ta kamera`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Layout switcher */}
            {camList.length > 1 && (
              <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                {([1, 2, 4] as GridLayout[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLayout(l)}
                    className={cn(
                      "p-1.5 rounded text-xs transition-colors",
                      layout === l ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-white"
                    )}
                    title={l === 1 ? "1 kamera" : l === 2 ? "2 kamera" : "4 kamera"}
                  >
                    <Grid2x2 className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* Loading cameras */}
          {camsLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Kameralar yuklanmoqda...</p>
              </div>
            </div>
          )}

          {/* Error */}
          {camsError && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3 text-center">
                <WifiOff className="w-12 h-12 text-red-400/50" />
                <p className="text-sm text-gray-500">Kameralarni yuklab bo'lmadi</p>
              </div>
            </div>
          )}

          {/* No cameras configured */}
          {!camsLoading && !camsError && camList.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3 text-center">
                <Camera className="w-12 h-12 text-gray-600" />
                <p className="text-sm text-gray-500">Bu kasalxona uchun kamera qo'shilmagan</p>
                <p className="text-xs text-gray-600">
                  Sozlamalar → Kameralar bo'limida qo'shing
                </p>
              </div>
            </div>
          )}

          {/* Camera grid */}
          {liveCameras.length > 0 && (
            <div className={cn(
              "grid gap-3",
              layout === 1
                ? "grid-cols-1 max-w-4xl mx-auto"
                : layout === 2
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-2 lg:grid-cols-2 xl:grid-cols-2"
            )}>
              {liveCameras
                .slice(0, layout === 1 ? 1 : layout === 2 ? 2 : 4)
                .map((cam) => (
                  <CameraTile
                    key={cam.id}
                    cam={cam}
                    layout={layout}
                    onRefresh={handleRefresh}
                  />
                ))}
            </div>
          )}

          {/* More cameras hint */}
          {camList.length > 4 && layout === 4 && (
            <p className="text-center text-xs text-gray-600 mt-3">
              + {camList.length - 4} ta kamera ko'rsatilmagan. Layout ni o'zgartiring.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#2d3748] flex items-center justify-between flex-shrink-0">
          <p className="text-[11px] text-gray-600">
            HikConnect OpenAPI • HLS stream
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[11px] text-gray-500">Real vaqt</span>
          </div>
        </div>
      </div>
    </div>
  );
}
