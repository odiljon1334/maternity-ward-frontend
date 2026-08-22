/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { locationApi } from "@/lib/api";
import {
  Camera, MapPin, CheckCircle2, XCircle, Loader2,
  RefreshCw, AlertTriangle, Clock, LogIn, LogOut, Building2, Sparkles, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { attendanceApi, photoUrl } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { Topbar } from "@/components/layout/Topbar";
import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps";
import dayjs from "dayjs";
import "dayjs/locale/uz";
dayjs.locale("uz");

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PRESENT:    { label: "Keldi",           cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  LATE:       { label: "Kech keldi",      cls: "bg-amber-500/20  text-amber-400 border-amber-500/30"   },
  ABSENT:     { label: "Kelmadi",         cls: "bg-red-500/20    text-red-400 border-red-500/30"      },
  EARLY_LEAVE:{ label: "Erta ketdi",      cls: "bg-orange-500/20 text-orange-400 border-orange-500/30"  },
  LATE_EARLY: { label: "Kech+Erta",       cls: "bg-red-500/20    text-red-400 border-red-500/30"      },
};

function fmt(date?: string | Date | null) {
  if (!date) return "—";
  return dayjs(date).format("HH:mm");
}

// ─── Camera capture hook ───────────────────────────────────────────────────────
function useCameraCapture() {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const [active,        setActive]        = useState(false);
  const [preview,       setPreview]       = useState<string | null>(null);
  const [capturedFile,  setCapturedFile]  = useState<File | null>(null);
  const [error,         setError]         = useState<string | null>(null);

  useEffect(() => {
    if (!active || !streamRef.current) return;
    const video = videoRef.current;
    if (!video) return;

    if (video.srcObject !== streamRef.current) {
      video.srcObject = streamRef.current;
    }
    video.play().catch(() => {});
  }, [active]);

  const startCamera = useCallback(async () => {
    setError(null);
    setPreview(null);
    setCapturedFile(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      setActive(true);
    } catch {
      setError("Kamera ruxsati berilmadi. Brauzer sozlamalarida kamera ruxsatini bering.");
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
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setActive(false);
    }, "image/jpeg", 0.85);
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
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
  const [coords,  setCoords]  = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

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

// ─── Live location tracking ───────────────────────────────────────────────────
function useLiveTracking(isCheckedIn: boolean, isCheckedOut: boolean) {
 const sendLocation = useCallback(async () => {
  if (process.env.NODE_ENV === "development") {
    console.log('📍 sendLocation called', { isCheckedIn, isCheckedOut });
  }
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        if (process.env.NODE_ENV === "development") {
          console.log('📍 GPS olindi, location yuborilmoqda...');
        }
        let battery: number | undefined;
        if ('getBattery' in navigator) {
          const bat = await (navigator as any).getBattery();
          battery = Math.round(bat.level * 100);
        }
        const result = await locationApi.sendLive({
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy:  pos.coords.accuracy,
          battery,
        });
        if (process.env.NODE_ENV === "development") {
          console.log('✅ location yuborildi:', result);    
        }
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          console.log('❌ location yuborishda xato:', e);
        }
      }
    },
    (err) => {
      console.error('❌ GPS xato:', err);
    },
    { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
  );
}, [isCheckedIn, isCheckedOut]);

  useEffect(() => {
    if (!isCheckedIn || isCheckedOut) return;

    // Darhol bir marta yuborish
    sendLocation();

    // Har 3 daqiqada yuborish
    const interval = setInterval(sendLocation, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isCheckedIn, isCheckedOut, sendLocation]);
}

// ─── Today status card (Profil sahifasidagi kabi gradientli va bezakli card) ────
function TodayCard({ record }: { record: any }) {
  const status = STATUS_MAP[record.status] ?? { label: record.status, cls: "bg-slate-500/20 text-slate-400 border-slate-500/30" };
  
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/60 via-[var(--bg-card)] to-purple-950/40 border border-[var(--border)] p-6 shadow-2xl space-y-5">
      {/* Orqa fondagi nafis yulduzcha/bezak elementlari */}
      <div className="absolute -right-6 -top-6 text-indigo-500/10 pointer-events-none">
        <Sparkles className="w-36 h-36" />
      </div>

      {/* Yuqori qism: Sarlavha va Status */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse" />
          <span className="text-sm font-extrabold text-[var(--text-primary)]">Bugungi holat</span>
        </div>
        <span className={cn("text-xs font-bold px-3 py-1.5 rounded-xl border shadow-sm", status.cls)}>
          {status.label}
        </span>
      </div>

      {/* Markaziy qism: Vaqtlar va Selfie */}
      <div className="grid grid-cols-3 items-center gap-2 bg-[var(--bg-main)]/80 backdrop-blur-md rounded-2xl p-4 border border-[var(--border)] relative z-10">
        {/* Keldi vaqti */}
        <div className="text-center border-r border-[var(--border)] pr-2">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 flex items-center justify-center gap-1 font-bold">
            <LogIn className="w-3 h-3 text-emerald-400" /> Keldi
          </p>
          <p className="text-xl font-black text-emerald-400 tracking-tight">{fmt(record.checkIn)}</p>
          {record.lateMinutes > 0 && (
            <span className="inline-block text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded mt-1 font-semibold border border-amber-500/20">
              +{record.lateMinutes} min kech
            </span>
          )}
        </div>

        {/* Selfie */}
        <div className="flex justify-center">
          {record.selfieUrl ? (
            <div className="relative">
              <img
                src={photoUrl(record.selfieUrl)}
                alt="selfie"
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/40 shadow-lg"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
              <User className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Ketdi vaqti */}
        <div className="text-center pl-2">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 flex items-center justify-center gap-1 font-bold">
            <LogOut className="w-3 h-3 text-rose-400" /> Ketdi
          </p>
          <p className={cn("text-xl font-black tracking-tight", record.checkOut ? "text-rose-400" : "text-[var(--text-muted)] opacity-60")}>
            {fmt(record.checkOut)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ──────────────────────────────────────────────────────────────────────
export default function MyCheckinPage() {
  const qc   = useQueryClient();
  const cam  = useCameraCapture();
  const gps  = useGPS();
  const { user } = useAuthStore();

  const empName = user?.employee?.fullName ?? user?.username ?? "Xodim";

  const [showEarlyWarning, setShowEarlyWarning] = useState(false);

  const positionGpsReady = !!(user?.employee?.position?.gpsLat && user?.employee?.position?.gpsLng);
  const [positionSetupDone, setPositionSetupDone] = useState(
    positionGpsReady || localStorage.getItem('position_gps_set') === 'true'
  );
  const [positionSetupStep, setPositionSetupStep] = useState<"idle" | "confirming" | "saving">("idle");
  const [positionSaveError, setPositionSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (positionGpsReady) setPositionSetupDone(true);
  }, [positionGpsReady]);

  const today = dayjs();
  const { data, isLoading } = useQuery({
    queryKey: ["my-attendance-today", today.month() + 1, today.year()],
    queryFn:  () => attendanceApi.my({ month: today.month() + 1, year: today.year() }),
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
      setShowEarlyWarning(false);
    },
  });

 const savePositionGps = useCallback(async () => {
  if (!gps.coords) return;
  setPositionSetupStep("saving");
  setPositionSaveError(null);
  try {
    await attendanceApi.setPositionGps(gps.coords.lat, gps.coords.lng);
    localStorage.setItem('position_gps_set', 'true');
    setPositionSetupDone(true);
    setPositionSetupStep("idle");
  } catch (e: any) {
    setPositionSaveError(e?.response?.data?.message ?? "Saqlashda xatolik");
    setPositionSetupStep("confirming");
  }
}, [gps.coords]);

  const isCheckedIn  = !!data?.checkIn;
  const isCheckedOut = !!data?.checkOut;
  const isComplete   = isCheckedIn && isCheckedOut;
  useLiveTracking(isCheckedIn, isCheckedOut);
  const actionLabel  = isCheckedIn ? "Check-out" : "Check-in";
  const ActionIcon   = isCheckedIn ? LogOut : LogIn;
  const actionColor  = isCheckedIn ? "bg-red-600 hover:bg-red-700 shadow-red-600/25" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25";

  const minutesSinceCheckIn = isCheckedIn && data?.checkIn
    ? dayjs().diff(dayjs(data.checkIn), "minute")
    : 999;
  const minWorkMinutes = 120;
  const canCheckOut = minutesSinceCheckIn >= minWorkMinutes;
  const checkOutWaitMin = Math.max(0, minWorkMinutes - minutesSinceCheckIn);

  const canSubmit = !mutation.isPending && !isComplete && gps.coords != null && cam.capturedFile != null
    && (!isCheckedIn || canCheckOut);

  const expectedCheckOut = data?.expectedCheckOut ? dayjs(data.expectedCheckOut) : null;
  const isEarlyLeave = isCheckedIn && !isCheckedOut && expectedCheckOut
    ? dayjs().isBefore(expectedCheckOut)
    : false;

  const handleSubmit = () => {
    if (isCheckedIn && isEarlyLeave && !showEarlyWarning) {
      setShowEarlyWarning(true);
      return;
    }
    mutation.mutate();
  };

  const getMissingMsg = () => {
    if (!gps.coords && !cam.capturedFile) return "GPS manzil va selfie kerak";
    if (!gps.coords) return "GPS manzilni aniqlang";
    if (!cam.capturedFile) return "Selfie oling";
    return null;
  };
  const missingMsg = getMissingMsg();

  return (
    <div className="min-h-screen bg-[var(--bg-main)] pb-16">
      {/* Ta'til sahifasidagi kabi yagona Topbar */}
      <Topbar
        title="Bugungi holat"
        subtitle={`${empName} · Shaxsiy vaqt nazorati`}
      />

      <div className="max-w-4xl mx-auto px-4 lg:px-6 pt-6 space-y-6">
        <div className="px-1">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Sana</h2>
          <p className="text-xs font-medium text-[var(--text-muted)] capitalize mt-0.5">
            {today.format("DD MMMM YYYY, dddd")}
          </p>
        </div>

        {!positionSetupDone && (
          <div className="rounded-3xl border border-amber-500/40 bg-amber-500/10 p-6 space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-300">Ish joyi manzilini belgilang</p>
                <p className="text-xs text-amber-400/80 mt-0.5">
                  Bu bir martalik sozlama. Hozirgi joylashuvingiz ish joyi sifatida saqlanadi.
                </p>
              </div>
            </div>

            {positionSetupStep === "idle" && (
              <div className="space-y-3">
                {!gps.coords ? (
                  <button
                    onClick={gps.locate}
                    disabled={gps.loading}
                    className="w-full py-3 rounded-2xl text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-600/25"
                  >
                    {gps.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    {gps.loading ? "Aniqlanmoqda..." : "Joylashuvni aniqlash"}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-[var(--bg-main)] p-4 text-xs text-amber-200 space-y-1 border border-amber-500/20">
                      <p>📍 Kenglik: <span className="font-mono">{gps.coords.lat.toFixed(6)}</span></p>
                      <p>📍 Uzunlik: <span className="font-mono">{gps.coords.lng.toFixed(6)}</span></p>
                      <p>🎯 Aniqlik: ±{Math.round(gps.coords.accuracy)}m</p>
                    </div>

                    <div className="w-full h-48 rounded-2xl overflow-hidden border border-amber-500/30">
                      <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY }}>
                        <Map
                          state={{ center: [gps.coords.lat, gps.coords.lng], zoom: 16 }}
                          style={{ width: "100%", height: "100%" }}
                        >
                          <Placemark geometry={[gps.coords.lat, gps.coords.lng]} />
                        </Map>
                      </YMaps>
                    </div>

                    <button
                      onClick={() => setPositionSetupStep("confirming")}
                      className="w-full py-3 rounded-2xl text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-600/25"
                    >
                      <Building2 className="w-4 h-4" />
                      Shu joylashuvni ish joyi sifatida saqlash
                    </button>
                  </div>
                )}
                {gps.error && (
                  <p className="text-xs text-red-400 flex items-start gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {gps.error}
                  </p>
                )}
              </div>
            )}

            {positionSetupStep === "confirming" && (
              <div className="space-y-3">
                <p className="text-xs text-amber-300 font-semibold">
                  ⚠️ Tasdiqlash: Hozirgi joylashuvingiz ish joyi sifatida saqlansinmi?
                </p>
                {positionSaveError && (
                  <p className="text-xs text-red-400 font-medium">❌ {positionSaveError}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={savePositionGps}
                    className="flex-1 py-2.5 rounded-2xl text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                  >
                    Ha, saqlash
                  </button>
                  <button
                    onClick={() => { setPositionSetupStep("idle"); gps.locate(); }}
                    className="flex-1 py-2.5 rounded-2xl text-sm font-bold bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                  >
                    Qayta aniqlash
                  </button>
                </div>
              </div>
            )}

            {positionSetupStep === "saving" && (
              <div className="flex items-center justify-center gap-2 py-2 text-amber-300 text-sm font-semibold">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saqlanmoqda...
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-6 animate-pulse h-36" />
        ) : data ? (
          <TodayCard record={data} />
        ) : (
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center text-sm text-[var(--text-muted)] space-y-3 shadow-xl">
            <Clock className="w-8 h-8 mx-auto opacity-40 text-indigo-400" />
            <p className="font-semibold">Bugun hali davomat belgilanmagan</p>
          </div>
        )}

        {isComplete && (
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex items-center gap-3 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-400 font-bold">
              Bugungi davomat to&apos;liq belgilandi!
            </p>
          </div>
        )}

        {mutation.isSuccess && (
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex items-center gap-3 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-400 font-bold">
              {mutation.data?.action === "CHECK_IN" ? "Check-in muvaffaqiyatli!" : "Check-out muvaffaqiyatli!"}
            </p>
          </div>
        )}

        {mutation.isError && (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5 flex items-start gap-3 shadow-lg">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400 font-medium">
              {(mutation.error as any)?.response?.data?.message
                ?? "Xatolik yuz berdi. Qayta urinib ko'ring."}
            </p>
          </div>
        )}

        {!isComplete && (
          <div className="space-y-5">
            {/* Ish joyi cardi */}
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-bold text-[var(--text-primary)]">Hozirgi ish joyi</span>
                </div>
                {gps.coords ? (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full font-bold border border-emerald-500/20">
                    Aniqlandi ✓
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full font-bold border border-amber-500/20">
                    Majburiy
                  </span>
                )}
              </div>

              {gps.coords ? (
                <div className="space-y-3">
                  <div className="text-xs text-[var(--text-muted)] space-y-1 bg-[var(--bg-main)] p-3.5 rounded-2xl border border-[var(--border)] font-medium">
                    <p>Kenglik: <span className="text-[var(--text-primary)] font-mono">{gps.coords.lat.toFixed(6)}</span></p>
                    <p>Uzunlik: <span className="text-[var(--text-primary)] font-mono">{gps.coords.lng.toFixed(6)}</span></p>
                    <p>Aniqlik: <span className="text-[var(--text-primary)] font-mono">±{Math.round(gps.coords.accuracy)}m</span></p>
                  </div>

                  <div className="w-full h-48 rounded-2xl overflow-hidden border border-[var(--border)] shadow-inner">
                    <YMaps query={{ apikey: "SIZNING_YANDEX_MAP_KEYINGIZ" }}>
                      <Map
                        state={{ center: [gps.coords.lat, gps.coords.lng], zoom: 16 }}
                        style={{ width: "100%", height: "100%" }}
                      >
                        <Placemark geometry={[gps.coords.lat, gps.coords.lng]} />
                      </Map>
                    </YMaps>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-muted)] font-medium">
                  Ish joyingizning manzilini aniqlash uchun quyidagi tugmani bosing
                </p>
              )}

              {gps.error && (
                <p className="text-xs text-red-400 flex items-start gap-1.5 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {gps.error}
                </p>
              )}

              <button
                onClick={gps.locate}
                disabled={gps.loading}
                className={cn(
                  "w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm",
                  gps.coords
                    ? "bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border)]"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25",
                )}
              >
                {gps.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                {gps.loading ? "Aniqlanmoqda..." : gps.coords ? "Qayta aniqlash" : "Manzilni aniqlash"}
              </button>
            </div>

            {/* Selfie cardi */}
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-bold text-[var(--text-primary)]">Selfie</span>
                </div>
                {cam.capturedFile ? (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full font-bold border border-emerald-500/20">
                    Olindi ✓
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full font-bold border border-amber-500/20">
                    Majburiy
                  </span>
                )}
              </div>

              {cam.error && (
                <p className="text-xs text-red-400 flex items-start gap-1.5 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {cam.error}
                </p>
              )}

              <div className={cn("space-y-3", !cam.active && "hidden")}>
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-square shadow-inner">
                  <video
                    ref={cam.videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-44 h-52 rounded-full border-2 border-white/60 border-dashed" />
                  </div>
                </div>
                <canvas ref={cam.canvasRef} className="hidden" />
                <div className="flex gap-3">
                  <button
                    onClick={cam.capture}
                    className="flex-1 py-3 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/25"
                  >
                    <Camera className="w-4 h-4" />
                    Suratga olish
                  </button>
                  <button
                    onClick={cam.stopCamera}
                    className="px-5 py-3 rounded-2xl text-sm font-bold bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors border border-[var(--border)]"
                  >
                    Bekor
                  </button>
                </div>
              </div>

              {cam.preview && !cam.active && (
                <div className="space-y-3 text-center">
                  <img
                    src={cam.preview}
                    alt="selfie preview"
                    className="w-32 h-32 rounded-2xl object-cover mx-auto ring-4 ring-indigo-500/30 shadow-lg"
                  />
                  <button
                    onClick={cam.reset}
                    className="w-full py-3 rounded-2xl text-sm font-bold bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] flex items-center justify-center gap-2 transition-colors border border-[var(--border)]"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Qayta olish
                  </button>
                </div>
              )}

              {!cam.preview && !cam.active && (
                <button
                  onClick={cam.startCamera}
                  className="w-full py-3 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/25"
                >
                  <Camera className="w-4 h-4" />
                  Kamerani ochish
                </button>
              )}
            </div>

            {showEarlyWarning && (
              <div className="rounded-3xl border border-orange-500/40 bg-orange-500/10 p-5 space-y-3 shadow-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-orange-300">Ish vaqti hali tugamadi</p>
                    <p className="text-xs text-orange-400/80 mt-1 font-medium">
                      Ish tugash vaqti: <span className="font-bold text-orange-300">{expectedCheckOut?.format("HH:mm")}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => mutation.mutate()}
                    disabled={mutation.isPending}
                    className="flex-1 py-3 rounded-2xl text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-600/25"
                  >
                    {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                    Baribir chiqish
                  </button>
                  <button
                    onClick={() => setShowEarlyWarning(false)}
                    className="flex-1 py-3 rounded-2xl text-sm font-bold bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors border border-[var(--border)]"
                  >
                    Bekor qilish
                  </button>
                </div>
              </div>
            )}

            {!showEarlyWarning && (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={cn(
                  "w-full py-4 rounded-3xl text-base font-black flex items-center justify-center gap-2.5 transition-all shadow-xl",
                  canSubmit
                    ? `${actionColor} text-white`
                    : "bg-[var(--bg-card)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border)] opacity-60",
                )}
              >
                {mutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ActionIcon className="w-5 h-5" />
                )}
                {mutation.isPending ? "Yuborilmoqda..." : actionLabel}
              </button>
            )}

            {isCheckedIn && !isCheckedOut && !canCheckOut && (
              <div className="flex items-center gap-3 px-5 py-4 rounded-3xl bg-amber-500/10 border border-amber-500/25 shadow-xl">
                <span className="text-xl">⏳</span>
                <div>
                  <p className="text-xs font-bold text-amber-300">Check-out hali erta</p>
                  <p className="text-xs text-amber-400/85 font-medium">
                    {checkOutWaitMin} daqiqadan so&apos;ng check-out qilish mumkin (minimum 2 soat)
                  </p>
                </div>
              </div>
            )}

            {missingMsg && !mutation.isPending && !showEarlyWarning && canCheckOut && (
              <p className="text-center text-xs text-[var(--text-muted)] font-bold">
                ⬆ {missingMsg}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}