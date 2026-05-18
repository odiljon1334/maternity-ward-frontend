"use client";

import { useRef, useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera, MapPin, CheckCircle2, XCircle, Loader2,
  RefreshCw, AlertTriangle, Clock, LogIn, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { attendanceApi, photoUrl } from "@/lib/api";
import dayjs from "dayjs";
import "dayjs/locale/uz";
dayjs.locale("uz");

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PRESENT:    { label: "Keldi",           cls: "bg-emerald-500/20 text-emerald-400" },
  LATE:       { label: "Kech keldi",      cls: "bg-amber-500/20  text-amber-400"   },
  ABSENT:     { label: "Kelmadi",         cls: "bg-red-500/20    text-red-400"      },
  EARLY_LEAVE:{ label: "Erta ketdi",      cls: "bg-orange-500/20 text-orange-400"  },
  LATE_EARLY: { label: "Kech+Erta",       cls: "bg-red-500/20    text-red-400"      },
};

function fmt(date?: string | Date | null) {
  if (!date) return "—";
  return dayjs(date).format("HH:mm");
}

// ─── Camera capture hook ───────────────────────────────────────────────────────
function useCameraCapture() {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const [active, setActive]   = useState(false);
  const [preview, setPreview] = useState<string | null>(null);   // base64
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [error, setError]     = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    setPreview(null);
    setCapturedFile(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
    } catch {
      setError("Kamera ruxsati berilmadi. Brauzer sozlamalarini tekshiring.");
    }
  }, []);

  const capture = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 640;
    canvas.getContext("2d")!.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
      setCapturedFile(file);
      setPreview(URL.createObjectURL(blob));
      stopCamera();
    }, "image/jpeg", 0.85);
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  const reset = useCallback(() => {
    stopCamera();
    setPreview(null);
    setCapturedFile(null);
    setError(null);
  }, [stopCamera]);

  return { videoRef, canvasRef, active, preview, capturedFile, error, startCamera, capture, stopCamera, reset };
}

// ─── GPS hook ──────────────────────────────────────────────────────────────────
function useGPS() {
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Brauzeringiz GPS ni qo'llab-quvvatlamaydi");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setLoading(false);
      },
      () => {
        setError("GPS joylashuvini aniqlab bo'lmadi. Ruxsat bering va qayta urinib ko'ring.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  }, []);

  return { coords, loading, error, locate };
}

// ─── Today status card ─────────────────────────────────────────────────────────
function TodayCard({ record }: { record: any }) {
  const status = STATUS_MAP[record.status] ?? { label: record.status, cls: "bg-slate-500/20 text-slate-400" };
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-primary)]">Bugungi holat</span>
        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", status.cls)}>
          {status.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-[var(--bg-main)] p-3 text-center">
          <p className="text-[10px] text-[var(--text-muted)] mb-1 flex items-center justify-center gap-1">
            <LogIn className="w-3 h-3" /> Keldi
          </p>
          <p className="text-lg font-bold text-emerald-400">{fmt(record.checkIn)}</p>
          {record.lateMinutes > 0 && (
            <p className="text-[10px] text-amber-400 mt-0.5">+{record.lateMinutes}min kech</p>
          )}
        </div>
        <div className="rounded-lg bg-[var(--bg-main)] p-3 text-center">
          <p className="text-[10px] text-[var(--text-muted)] mb-1 flex items-center justify-center gap-1">
            <LogOut className="w-3 h-3" /> Ketdi
          </p>
          <p className={cn("text-lg font-bold", record.checkOut ? "text-red-400" : "text-[var(--text-muted)]")}>
            {fmt(record.checkOut)}
          </p>
        </div>
      </div>
      {record.selfieUrl && (
        <img
          src={photoUrl(record.selfieUrl)}
          alt="selfie"
          className="w-16 h-16 rounded-full object-cover mx-auto ring-2 ring-indigo-500/40"
        />
      )}
    </div>
  );
}

// ─── PAGE ──────────────────────────────────────────────────────────────────────
export default function MyCheckinPage() {
  const qc = useQueryClient();
  const cam = useCameraCapture();
  const gps = useGPS();

  // Bugungi davomat record (oy=bugun)
  const today = dayjs();
  const { data, isLoading } = useQuery({
    queryKey: ["my-attendance-today", today.month() + 1, today.year()],
    queryFn: () => attendanceApi.my({ month: today.month() + 1, year: today.year() }),
    select: (d) => {
      const todayStr = today.format("YYYY-MM-DD");
      return (d.records ?? []).find(
        (r: any) => dayjs(r.workDate).format("YYYY-MM-DD") === todayStr,
      ) ?? null;
    },
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: () =>
      attendanceApi.selfCheckIn({
        gpsLat:      gps.coords?.lat,
        gpsLng:      gps.coords?.lng,
        gpsAccuracy: gps.coords?.accuracy,
        selfie:      cam.capturedFile,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-attendance-today"] });
      qc.invalidateQueries({ queryKey: ["my-attendance"] });
      cam.reset();
    },
  });

  // Holat: check-in bo'lgan va check-out bo'lmagan → CHECK_OUT mode
  const isCheckedIn  = !!data?.checkIn;
  const isCheckedOut = !!data?.checkOut;
  const isComplete   = isCheckedIn && isCheckedOut;
  const actionLabel  = isCheckedIn ? "Check-out" : "Check-in";
  const ActionIcon   = isCheckedIn ? LogOut : LogIn;
  const actionColor  = isCheckedIn ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700";

  // GPS talab: har doim aniqlansin (selfie optional)
  const canSubmit = !mutation.isPending && !isComplete && gps.coords != null;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Mobil Davomat</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {today.format("DD MMMM YYYY, dddd")}
        </p>
      </div>

      {/* Today card */}
      {isLoading ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 animate-pulse h-32" />
      ) : data ? (
        <TodayCard record={data} />
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-center text-sm text-[var(--text-muted)]">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Bugun hali davomat belgilanmagan
        </div>
      )}

      {/* Completed banner */}
      {isComplete && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-emerald-400 font-medium">
            Bugungi davomat to&apos;liq belgilandi!
          </p>
        </div>
      )}

      {/* Success banner */}
      {mutation.isSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-emerald-400 font-medium">
            {mutation.data?.action === "CHECK_IN" ? "Check-in muvaffaqiyatli!" : "Check-out muvaffaqiyatli!"}
          </p>
        </div>
      )}

      {/* Error banner */}
      {mutation.isError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">
            {(mutation.error as any)?.response?.data?.message
              ?? "Xatolik yuz berdi. Qayta urinib ko'ring."}
          </p>
        </div>
      )}

      {!isComplete && (
        <>
          {/* ── GPS section ─────────────────────────────────── */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-[var(--text-primary)]">Hozirgi ish joyi</span>
              </div>
              {gps.coords && (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Aniqlandi ✓
                </span>
              )}
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              Manzil direktor va rahbariyatga Telegram orqali yuboriladi
            </p>

            {gps.coords ? (
              <div className="space-y-1.5">
                <div className="text-xs text-[var(--text-muted)] space-y-1">
                  <p>Kenglik: <span className="text-[var(--text-primary)]">{gps.coords.lat.toFixed(6)}</span></p>
                  <p>Uzunlik: <span className="text-[var(--text-primary)]">{gps.coords.lng.toFixed(6)}</span></p>
                  <p>Aniqlik: <span className="text-[var(--text-primary)]">±{Math.round(gps.coords.accuracy)}m</span></p>
                </div>
                {/* Google Maps preview link */}
                <a
                  href={`https://maps.google.com/?q=${gps.coords.lat},${gps.coords.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <MapPin className="w-3 h-3" />
                  Xaritada ko&apos;rish
                </a>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">
                Ish joyingizning manzilini aniqlash uchun quyidagi tugmani bosing
              </p>
            )}

            {gps.error && (
              <p className="text-xs text-red-400 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {gps.error}
              </p>
            )}

            <button
              onClick={gps.locate}
              disabled={gps.loading}
              className={cn(
                "w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                gps.coords
                  ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white",
              )}
            >
              {gps.loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
              {gps.loading ? "Aniqlanmoqda..." : gps.coords ? "Qayta aniqlash" : "Manzilni aniqlash"}
            </button>
          </div>

          {/* ── Selfie section ───────────────────────────────── */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-[var(--text-primary)]">Selfie</span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] bg-slate-700/50 px-2 py-0.5 rounded-full">
                Ixtiyoriy
              </span>
            </div>

            {/* Camera error */}
            {cam.error && (
              <p className="text-xs text-red-400 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {cam.error}
              </p>
            )}

            {/* Preview */}
            {cam.preview ? (
              <div className="space-y-2">
                <img
                  src={cam.preview}
                  alt="selfie preview"
                  className="w-32 h-32 rounded-full object-cover mx-auto ring-2 ring-indigo-500/40"
                />
                <button
                  onClick={cam.reset}
                  className="w-full py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Qayta olish
                </button>
              </div>
            ) : cam.active ? (
              /* Live camera */
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden bg-black aspect-square">
                  <video
                    ref={cam.videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  {/* Oval guide overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-44 h-52 rounded-full border-2 border-white/60 border-dashed" />
                  </div>
                </div>
                <canvas ref={cam.canvasRef} className="hidden" />
                <div className="flex gap-2">
                  <button
                    onClick={cam.capture}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    Suratga olish
                  </button>
                  <button
                    onClick={cam.stopCamera}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                  >
                    Bekor
                  </button>
                </div>
              </div>
            ) : (
              /* Start camera button */
              <button
                onClick={cam.startCamera}
                className="w-full py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center gap-2 transition-colors"
              >
                <Camera className="w-4 h-4" />
                Kamerani ochish
              </button>
            )}
          </div>

          {/* ── Submit button ────────────────────────────────── */}
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit}
            className={cn(
              "w-full py-3.5 rounded-xl text-base font-semibold flex items-center justify-center gap-2.5 transition-all",
              canSubmit
                ? `${actionColor} text-white shadow-lg`
                : "bg-slate-700/50 text-slate-500 cursor-not-allowed",
            )}
          >
            {mutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ActionIcon className="w-5 h-5" />
            )}
            {mutation.isPending ? "Yuborilmoqda..." : actionLabel}
          </button>

          {!gps.coords && (
            <p className="text-center text-xs text-[var(--text-muted)]">
              GPS joylashuvingizni aniqlang (selfie ixtiyoriy)
            </p>
          )}
        </>
      )}
    </div>
  );
}
