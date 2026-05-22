"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera, MapPin, CheckCircle2, XCircle, Loader2,
  RefreshCw, AlertTriangle, Clock, LogIn, LogOut, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { attendanceApi, photoUrl } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
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
// iOS Safari muammosi: <video> shartli render bo'lsa, videoRef null bo'ladi va
// srcObject o'rnatilmaydi → qora ekran.
// Yechim: video elementni DOIM DOM da saqlaymiz (faqat CSS bilan yashiramiz).
// srcObject useEffect orqali active=true bo'lgach o'rnatiladi.
function useCameraCapture() {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const [active,        setActive]        = useState(false);
  const [preview,       setPreview]       = useState<string | null>(null);
  const [capturedFile,  setCapturedFile]  = useState<File | null>(null);
  const [error,         setError]         = useState<string | null>(null);

  // ── Stream olinib, active=true bo'lgach video elementga o'rnatamiz ──────────
  // Bu iOS Safari da ishonchli ishlaydi: useEffect render dan keyin chaqiriladi,
  // video element visible bo'lgach srcObject + play() ishlaydi.
  useEffect(() => {
    if (!active || !streamRef.current) return;
    const video = videoRef.current;
    if (!video) return;

    // srcObject o'rnatilmagan bo'lsa — o'rnatamiz
    if (video.srcObject !== streamRef.current) {
      video.srcObject = streamRef.current;
    }
    // iOS Safari: muted video ni play() bilan ishga tushirish kerak
    video.play().catch(() => {
      // autoPlay attributi orqali ham ishga tushishi mumkin — ignore
    });
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
      setActive(true); // useEffect srcObject + play() ni bajaradi
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
      // Kamerani to'xtatamiz (video element DOM da qoladi, stream to'xtaydi)
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
  const qc   = useQueryClient();
  const cam  = useCameraCapture();
  const gps  = useGPS();
  const { user } = useAuthStore();

  // Erta ketish ogohlantirishi uchun state
  const [showEarlyWarning, setShowEarlyWarning] = useState(false);

  // Kasalxona GPS o'rnatish (birinchi marta)
  // hospitalGpsSet: null = yuklanmoqda, false = o'rnatilmagan, true = o'rnatilgan
  const hospitalGpsReady = !!(user?.hospital?.gpsLat && user?.hospital?.gpsLng);
  const [hospitalSetupDone, setHospitalSetupDone] = useState(hospitalGpsReady);
  const [hospitalSetupStep, setHospitalSetupStep] = useState<"idle" | "confirming" | "saving">("idle");
  const [hospitalSaveError, setHospitalSaveError] = useState<string | null>(null);

  // hospitalGpsReady o'zgarganda sinxronlaymiz (login refresh dan keyin)
  useEffect(() => {
    if (hospitalGpsReady) setHospitalSetupDone(true);
  }, [hospitalGpsReady]);

  // Bugungi davomat record
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

  // Kasalxona GPS saqlash
  const saveHospitalGps = useCallback(async () => {
    if (!gps.coords) return;
    setHospitalSetupStep("saving");
    setHospitalSaveError(null);
    try {
      await attendanceApi.setHospitalGps(gps.coords.lat, gps.coords.lng);
      setHospitalSetupDone(true);
      setHospitalSetupStep("idle");
    } catch (e: any) {
      setHospitalSaveError(e?.response?.data?.message ?? "Saqlashda xatolik");
      setHospitalSetupStep("confirming");
    }
  }, [gps.coords]);

  const isCheckedIn  = !!data?.checkIn;
  const isCheckedOut = !!data?.checkOut;
  const isComplete   = isCheckedIn && isCheckedOut;
  const actionLabel  = isCheckedIn ? "Check-out" : "Check-in";
  const ActionIcon   = isCheckedIn ? LogOut : LogIn;
  const actionColor  = isCheckedIn ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700";

  // GPS va Selfie ikkalasi ham majburiy
  const canSubmit = !mutation.isPending && !isComplete && gps.coords != null && cam.capturedFile != null;

  // Erta ketish tekshiruvi — check-out da expectedCheckOut dan oldin ketayotgan bo'lsa
  const expectedCheckOut = data?.expectedCheckOut ? dayjs(data.expectedCheckOut) : null;
  const isEarlyLeave = isCheckedIn && !isCheckedOut && expectedCheckOut
    ? dayjs().isBefore(expectedCheckOut)
    : false;
  const remainingMin = isEarlyLeave && expectedCheckOut
    ? expectedCheckOut.diff(dayjs(), "minute")
    : 0;

  // Submit handler — erta ketish bo'lsa dialog ko'rsatadi
  const handleSubmit = () => {
    if (isCheckedIn && isEarlyLeave && !showEarlyWarning) {
      setShowEarlyWarning(true);
      return;
    }
    mutation.mutate();
  };

  // Holat haqida xabar
  const getMissingMsg = () => {
    if (!gps.coords && !cam.capturedFile) return "GPS manzil va selfie kerak";
    if (!gps.coords) return "GPS manzilni aniqlang";
    if (!cam.capturedFile) return "Selfie oling";
    return null;
  };
  const missingMsg = getMissingMsg();

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Mobil Davomat</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {today.format("DD MMMM YYYY, dddd")}
        </p>
      </div>

      {/* ── Kasalxona GPS setup (birinchi marta) ─────────────────────────────── */}
      {!hospitalSetupDone && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-300">Ish joyi manzilini belgilang</p>
              <p className="text-xs text-amber-400/80 mt-0.5">
                Bu bir martalik sozlama. Hozirgi joylashuvingiz ish joyi sifatida saqlanadi
                va kelajakdagi check-in larda shunga nisbatan masofa ko'rsatiladi.
              </p>
            </div>
          </div>

          {hospitalSetupStep === "idle" && (
            <div className="space-y-2">
              {/* GPS yig'ish */}
              {!gps.coords ? (
                <button
                  onClick={gps.locate}
                  disabled={gps.loading}
                  className="w-full py-2.5 rounded-lg text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-2 transition-colors"
                >
                  {gps.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  {gps.loading ? "Aniqlanmoqda..." : "Joylashuvni aniqlash"}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-lg bg-amber-900/30 p-2.5 text-xs text-amber-200 space-y-1">
                    <p>📍 Kenglik: <span className="font-mono">{gps.coords.lat.toFixed(6)}</span></p>
                    <p>📍 Uzunlik: <span className="font-mono">{gps.coords.lng.toFixed(6)}</span></p>
                    <p>🎯 Aniqlik: ±{Math.round(gps.coords.accuracy)}m</p>
                  </div>
                  <button
                    onClick={() => setHospitalSetupStep("confirming")}
                    className="w-full py-2.5 rounded-lg text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-2 transition-colors"
                  >
                    <Building2 className="w-4 h-4" />
                    Shu joylashuvni ish joyi sifatida saqlash
                  </button>
                </div>
              )}
              {gps.error && (
                <p className="text-xs text-red-400 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {gps.error}
                </p>
              )}
            </div>
          )}

          {hospitalSetupStep === "confirming" && (
            <div className="space-y-2">
              <p className="text-xs text-amber-300 font-medium">
                ⚠️ Tasdiqlash: Hozirgi joylashuvingiz ({gps.coords?.lat.toFixed(5)}, {gps.coords?.lng.toFixed(5)}) ish joyi sifatida saqlansinmi?
              </p>
              {hospitalSaveError && (
                <p className="text-xs text-red-400">❌ {hospitalSaveError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={saveHospitalGps}
                  className="flex-1 py-2 rounded-lg text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                >
                  Ha, saqlash
                </button>
                <button
                  onClick={() => { setHospitalSetupStep("idle"); gps.locate(); }}
                  className="flex-1 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                >
                  Qayta aniqlash
                </button>
              </div>
            </div>
          )}

          {hospitalSetupStep === "saving" && (
            <div className="flex items-center justify-center gap-2 py-2 text-amber-300 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saqlanmoqda...
            </div>
          )}
        </div>
      )}

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
              {gps.coords ? (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                  Aniqlandi ✓
                </span>
              ) : (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium">
                  Majburiy
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
                <a
                  href={`https://yandex.uz/maps/?pt=${gps.coords.lng},${gps.coords.lat}&z=16&l=map`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <MapPin className="w-3 h-3" />
                  Yandex Maps da ko&apos;rish
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
              {gps.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
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
              {cam.capturedFile ? (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                  Olindi ✓
                </span>
              ) : (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium">
                  Majburiy
                </span>
              )}
            </div>

            {/* Camera error */}
            {cam.error && (
              <p className="text-xs text-red-400 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {cam.error}
              </p>
            )}

            {/* ── Video element DOIM DOM da — iOS safari uchun ── */}
            {/* CSS bilan yashiramiz (conditional render emas!) */}
            {/* active=false bo'lsa hidden, active=true bo'lsa ko'rinadi */}
            <div className={cn(
              "space-y-2",
              !cam.active && "hidden",
            )}>
              <div className="relative rounded-xl overflow-hidden bg-black aspect-square">
                <video
                  ref={cam.videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                {/* Oval guide */}
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

            {/* Preview — oldindan olingan selfie */}
            {cam.preview && !cam.active && (
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
            )}

            {/* Start camera button — preview yo'q va kamera ochiq emas */}
            {!cam.preview && !cam.active && (
              <button
                onClick={cam.startCamera}
                className="w-full py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 transition-colors"
              >
                <Camera className="w-4 h-4" />
                Kamerani ochish
              </button>
            )}
          </div>

          {/* ── Erta ketish ogohlantirishi (dialog) ─────────── */}
          {showEarlyWarning && (
            <div className="rounded-xl border border-orange-500/40 bg-orange-500/10 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-300">Ish vaqti hali tugamadi</p>
                  <p className="text-xs text-orange-400/80 mt-1">
                    Ish tugash vaqti:{" "}
                    <span className="font-bold text-orange-300">
                      {expectedCheckOut?.format("HH:mm")}
                    </span>
                    {remainingMin > 0 && (
                      <> — yana <span className="font-bold text-orange-300">{remainingMin} daqiqa</span> qoldi</>
                    )}
                  </p>
                  <p className="text-xs text-orange-400/70 mt-1">
                    Erta ketish sifatida belgilanadi va rahbariyatga xabar yuboriladi.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-2 transition-colors"
                >
                  {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  Baribir chiqish
                </button>
                <button
                  onClick={() => setShowEarlyWarning(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          )}

          {/* ── Submit button ────────────────────────────────── */}
          {!showEarlyWarning && (
            <button
              onClick={handleSubmit}
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
          )}

          {/* Hint */}
          {missingMsg && !mutation.isPending && !showEarlyWarning && (
            <p className="text-center text-xs text-[var(--text-muted)]">
              ⬆ {missingMsg}
            </p>
          )}
        </>
      )}
    </div>
  );
}
