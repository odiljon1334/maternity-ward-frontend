/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/**
 * Mobil check-in / check-out (FAZA 6 · 4c).
 *
 * Oqim: sahifa ochiladi → ruxsatlar oldin berilgan bo'lsa kamera va GPS o'zi
 * yoqiladi (aks holda bitta "Boshlash" tugmasi — iOS PWA ruxsat oynasi
 * foydalanuvchi bosishini talab qiladi) → xodim ish joyi ichida bo'lsa katta
 * tugma faollashadi → bosilganda surat DARHOL olinib yuboriladi (preview yo'q).
 *
 * Ketishda selfie majburiy emas: server GPS'ni doim tekshiradi, yuzni esa faqat
 * shubhali holatda (smena davomida tashqarida ko'rilgan / kuzatuv uzilgan)
 * solishtiradi. Kamera ochiq bo'lsa kadr baribir yuboriladi — kerak bo'lsa
 * ikkinchi urinishsiz ishlatiladi.
 *
 * Ish joyi ichida-tashqarisi ekranda serverdagi qoida bilan bir xil hisoblanadi:
 * masofa − radius ≤ min(GPS aniqligi, 50 m). Yakuniy qarorni baribir server
 * qiladi.
 */

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera, MapPin, XCircle, Loader2, RefreshCw, AlertTriangle, LogIn, LogOut,
  ScanFace, Check, Navigation, Building2, Clock3, CheckCircle2, Crosshair,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { attendanceApi, workSitesApi, type MyGeoCenter } from "@/lib/api";
import {
  createAccurateLocationRequest,
  detectLocationPlatform,
  getLocationIssueContent,
  type AccurateLocationRequest,
  type LocationIssue,
  type LocationIssueContent,
  type LocationPlatform,
} from "@/lib/mobile-geolocation";
import { useAuthStore } from "@/stores/auth";
import { Topbar } from "@/components/layout/Topbar";
import dayjs from "dayjs";
import "dayjs/locale/uz";
dayjs.locale("uz");

// ─── Qoidalar (backend bilan bir xil) ─────────────────────────────────────────
/** Server GPS aniqligidan ko'pi bilan shuncha metrni hisobga oladi */
const GPS_TOLERANCE_MAX_M = 50;
/** Bundan yomon aniqlikdagi nuqtani server qabul qilmaydi */
const GPS_MAX_ACCURACY_M = 150;
/** Shu aniqlikka yetganda qidiruv to'xtaydi */
const GPS_TARGET_ACCURACY_M = 25;
/** Sun'iy yo'ldosh qulfini kutish muddati */
const GPS_MAX_WAIT_MS = 25_000;
/** Kelgandan keyin eng kamida shuncha vaqt o'tib ketish mumkin */
const MIN_WORK_MINUTES = 120;
/** Serverga yuboriladigan selfining eng katta tomoni (px) */
const MAX_SELFIE_SIDE = 640;
/** Rasm juda qorong'u bo'lsa yuz ko'rinmaydi (0=qora, 255=oq) */
const MIN_BRIGHTNESS = 45;

// ─── Yordamchilar ─────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PRESENT:     { label: "Keldi",      cls: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30" },
  LATE:        { label: "Kech keldi", cls: "bg-amber-400/15 text-amber-300 border-amber-400/30" },
  ABSENT:      { label: "Kelmadi",    cls: "bg-rose-400/15 text-rose-300 border-rose-400/30" },
  EARLY_LEAVE: { label: "Erta ketdi", cls: "bg-orange-400/15 text-orange-300 border-orange-400/30" },
  LATE_EARLY:  { label: "Kech+Erta",  cls: "bg-rose-400/15 text-rose-300 border-rose-400/30" },
};

function fmt(date?: string | Date | null) {
  return date ? dayjs(date).format("HH:mm") : "—";
}

function fmtDistance(m: number) {
  if (m < 1000) return `${Math.max(0, Math.round(m))} m`;
  return `${(m / 1000).toFixed(m < 10_000 ? 1 : 0)} km`;
}

function fmtDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h} soat ${m} daq` : `${m} daq`;
}

function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function apiMessage(error: any, fallback: string): string {
  const msg = error?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string" && msg.trim()) return msg;
  if (error?.code === "ERR_NETWORK") return "Internet aloqasi yo'q. Tarmoqni tekshirib, qayta urinib ko'ring.";
  return fallback;
}

type PermState = "granted" | "denied" | "prompt" | "unknown";
async function queryPermission(name: "geolocation" | "camera"): Promise<PermState> {
  try {
    if (!navigator.permissions?.query) return "unknown";
    const res = await navigator.permissions.query({ name: name as PermissionName });
    return res.state as PermState;
  } catch {
    return "unknown"; // Firefox "camera" nomini bilmaydi
  }
}

/** Yuz ramkasi atrofidagi "yuguruvchi" nuqtalar (ellips bo'ylab) */
const FACE_DOTS = Array.from({ length: 24 }, (_, i) => {
  const t = (i / 24) * Math.PI * 2;
  return {
    cx: +(140 + 96 * Math.sin(t)).toFixed(1),
    cy: +(140 - 122 * Math.cos(t)).toFixed(1),
    delay: `${(i * 0.117).toFixed(2)}s`,
  };
});

// ─── Joylashuv muammosi ───────────────────────────────────────────────────────
function LocationIssueAlert({ issue, onRetry }: { issue: LocationIssueContent; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-500/35 bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-200" role="alert">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" />
        <div className="min-w-0 space-y-1.5">
          <p className="font-extrabold">{issue.title}</p>
          <p className="font-medium leading-5 opacity-90">{issue.message}</p>
          <ol className="list-decimal space-y-1 pl-4 opacity-80">
            {issue.details.map((d) => <li key={d}>{d}</li>)}
          </ol>
          {issue.canRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 rounded-xl border border-rose-400/40 bg-rose-500/15 px-3 py-2 font-bold transition hover:bg-rose-500/25"
            >
              Qayta urinish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tekshiruv oynasi ─────────────────────────────────────────────────────────
type VerifyState = "idle" | "verifying" | "success" | "error";

function VerificationOverlay({
  state, mode, errorMessage, onRetry, onClose,
}: {
  state: VerifyState;
  mode: "in" | "out";
  errorMessage: string | null;
  onRetry: () => void;
  onClose: () => void;
}) {
  if (state === "idle") return null;
  const isVerifying = state === "verifying";
  const isSuccess = state === "success";
  const isError = state === "error";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 px-5 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-live="assertive"
      aria-label="Tekshiruv holati"
    >
      <div className="face-verification-card w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/10 bg-[#12152B] px-7 pb-7 pt-9 text-center shadow-2xl">
        <div
          className={cn(
            "relative mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-[2rem] border",
            isVerifying && "border-indigo-300/60 bg-indigo-400/10",
            isSuccess && "face-verify-success border-emerald-300 bg-emerald-400/15",
            isError && "border-rose-400/70 bg-rose-400/10",
          )}
        >
          {isVerifying && (
            <>
              <span className="face-verify-orbit absolute inset-3 rounded-[1.5rem] border-2 border-dashed border-indigo-300/80" />
              <span className="face-verify-sweep absolute inset-x-5 top-5 h-0.5 rounded-full bg-indigo-300 shadow-[0_0_18px_rgba(165,180,252,1)]" />
              {mode === "in"
                ? <ScanFace className="h-12 w-12 text-indigo-200" strokeWidth={1.6} />
                : <MapPin className="h-12 w-12 text-indigo-200" strokeWidth={1.6} />}
            </>
          )}
          {isSuccess && (
            <span className="face-verify-check flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400 text-slate-950 shadow-[0_0_35px_rgba(52,211,153,0.7)]">
              <Check className="h-12 w-12" strokeWidth={3} />
            </span>
          )}
          {isError && <XCircle className="h-16 w-16 text-rose-300" strokeWidth={1.6} />}
        </div>

        <h2 className="text-xl font-black tracking-tight text-white">
          {isVerifying && (mode === "in" ? "Yuz va joylashuv tekshirilmoqda" : "Ketish qayd etilmoqda")}
          {isSuccess && (mode === "in" ? "Kelishingiz qayd etildi" : "Ketishingiz qayd etildi")}
          {isError && "Qayd etilmadi"}
        </h2>
        <p className="mx-auto mt-2 max-w-xs text-sm font-medium leading-6 text-slate-300">
          {isVerifying && (mode === "in"
            ? "Bir necha soniya — selfingiz profil rasmingiz bilan solishtirilmoqda."
            : "Joylashuvingiz tekshirilmoqda. Kerak bo'lsa yuz ham solishtiriladi.")}
          {isSuccess && (mode === "in" ? "Yaxshi ish kuni tilaymiz!" : "Rahmat, ish kuningiz yakunlandi.")}
          {isError && (errorMessage ?? "Tekshirib bo'lmadi. Qayta urinib ko'ring.")}
        </p>

        {isError && (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={onRetry}
              className="rounded-2xl bg-white px-3 py-3 text-sm font-extrabold text-slate-900 transition hover:bg-slate-100"
            >
              Qayta urinish
            </button>
            <button
              onClick={onClose}
              className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3 text-sm font-extrabold text-white transition hover:bg-white/10"
            >
              Yopish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Kamera ───────────────────────────────────────────────────────────────────
function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!active || !video || !streamRef.current) return;
    if (video.srcObject !== streamRef.current) video.srcObject = streamRef.current;
    video.play().catch(() => {});
  }, [active]);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) return;
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Bu brauzer kamerani qo'llab-quvvatlamaydi. Chrome yoki Safari'dan foydalaning.");
      return;
    }
    setStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      // Ilova fonga o'tganda (iOS) oqim uziladi — tugmani qayta ko'rsatamiz
      stream.getVideoTracks().forEach((t) => {
        t.onended = () => {
          streamRef.current = null;
          setActive(false);
        };
      });
      setActive(true);
    } catch {
      setError("Kameraga ruxsat berilmadi. Brauzer yoki telefon sozlamalarida ushbu sayt uchun kamerani yoqing.");
    } finally {
      setStarting(false);
    }
  }, []);

  useEffect(() => stop, [stop]);

  /** Joriy kadrni oladi: kichraytiradi (≤640px), yorug'likni tekshiradi, JPEG qiladi */
  const capture = useCallback(async (): Promise<{ file: File | null; error: string | null }> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current || !video.videoWidth) {
      return { file: null, error: "Kamera hali tayyor emas. Bir soniyadan so'ng qayta bosing." };
    }
    const scale = Math.min(1, MAX_SELFIE_SIDE / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return { file: null, error: "Suratni olib bo'lmadi." };
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let total = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 32) {
      total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      count++;
    }
    if (count > 0 && total / count < MIN_BRIGHTNESS) {
      return {
        file: null,
        error: "Rasm juda qorong'u — yuzingiz ko'rinmayapti. Yorug'roq joyga o'ting va qayta bosing.",
      };
    }

    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85));
    if (!blob) return { file: null, error: "Suratni olib bo'lmadi. Qayta bosing." };
    return { file: new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" }), error: null };
  }, []);

  return { videoRef, canvasRef, active, starting, error, start, stop, capture };
}

// ─── GPS ──────────────────────────────────────────────────────────────────────
function useGPS() {
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState<LocationIssue | null>(null);
  const [platform, setPlatform] = useState<LocationPlatform>("other");
  const requestRef = useRef<AccurateLocationRequest | null>(null);

  const stop = useCallback(() => {
    requestRef.current?.stop();
    requestRef.current = null;
    setLoading(false);
  }, []);

  /**
   * getCurrentPosition birinchi (odatda Wi-Fi/antenna, 500–3000 m) nuqtani
   * beradi; watchPosition aniqlikni sun'iy yo'ldosh bilan yaxshilaydi va
   * maqsadga (±25 m) yetganda yoki 25 soniyadan so'ng to'xtaydi.
   */
  const locate = useCallback(() => {
    requestRef.current?.stop();
    requestRef.current = null;
    setCoords(null);
    setIssue(null);

    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches === true ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setPlatform(detectLocationPlatform(navigator.userAgent, standalone));

    if (!window.isSecureContext) { setIssue("secure-context-required"); return; }
    if (!navigator.geolocation) { setIssue("unsupported"); return; }

    setLoading(true);
    requestRef.current = createAccurateLocationRequest({
      geolocation: navigator.geolocation,
      targetAccuracyM: GPS_TARGET_ACCURACY_M,
      maxWaitMs: GPS_MAX_WAIT_MS,
      onPosition: setCoords,
      onIssue: setIssue,
      onFinished: () => setLoading(false),
    });
  }, []);

  useEffect(() => stop, [stop]);

  const error = issue ? getLocationIssueContent(issue, platform) : null;
  return { coords, loading, error, locate, stop };
}

// ─── Joylashuv holati ─────────────────────────────────────────────────────────
type GeoStatus = "idle" | "locating" | "weak" | "inside" | "outside" | "no-centers" | "error";

interface CenterDistance extends MyGeoCenter {
  distance: number;
  /** masofa − radius: 0 dan kichik bo'lsa hudud ichida */
  gap: number;
}

function useGeoStatus(
  gps: ReturnType<typeof useGPS>,
  centers: MyGeoCenter[] | undefined,
): { status: GeoStatus; sorted: CenterDistance[]; nearest: CenterDistance | null; match: CenterDistance | null } {
  return useMemo(() => {
    const coords = gps.coords;
    const sorted: CenterDistance[] = coords && centers
      ? centers
          .map((c) => {
            const distance = distanceM(coords, c);
            return { ...c, distance, gap: distance - c.radius };
          })
          .sort((a, b) => a.gap - b.gap)
      : [];
    const nearest = sorted[0] ?? null;

    if (gps.error && !coords) return { status: "error", sorted, nearest, match: null };
    if (!coords) return { status: gps.loading ? "locating" : "idle", sorted, nearest, match: null };
    if (coords.accuracy > GPS_MAX_ACCURACY_M) {
      return { status: gps.loading ? "locating" : "weak", sorted, nearest, match: null };
    }
    if (!centers || centers.length === 0) return { status: "no-centers", sorted, nearest, match: null };

    const tolerance = Math.min(coords.accuracy, GPS_TOLERANCE_MAX_M);
    const match = sorted.find((c) => c.gap <= tolerance) ?? null;
    if (match) return { status: "inside", sorted, nearest, match };
    // Aniqlik hali yaxshilanayotgan bo'lsa "tashqaridasiz" deb shoshilmaymiz
    if (gps.loading && coords.accuracy > GPS_TOLERANCE_MAX_M) {
      return { status: "locating", sorted, nearest, match: null };
    }
    return { status: "outside", sorted, nearest, match: null };
  }, [gps.coords, gps.loading, gps.error, centers]);
}

// ─── SAHIFA ───────────────────────────────────────────────────────────────────
export default function MyCheckinPage() {
  const qc = useQueryClient();
  const cam = useCamera();
  const gps = useGPS();
  const { user } = useAuthStore();
  const empName = user?.employee?.fullName ?? user?.username ?? "Xodim";

  // Soat va "2 soat o'tdimi" hisobi uchun har 20 soniyada yangilanadi
  const [now, setNow] = useState(() => dayjs());
  useEffect(() => {
    const id = setInterval(() => setNow(dayjs()), 20_000);
    return () => clearInterval(id);
  }, []);

  const today = dayjs();
  const { data, isLoading } = useQuery({
    queryKey: ["my-attendance-today", today.month() + 1, today.year()],
    queryFn: () => attendanceApi.my({ month: today.month() + 1, year: today.year() }),
    select: (d: any) => {
      const todayStr = today.format("YYYY-MM-DD");
      return (d.records ?? []).find((r: any) => dayjs(r.workDate).format("YYYY-MM-DD") === todayStr) ?? null;
    },
    staleTime: 30_000,
  });

  const { data: centers } = useQuery({
    queryKey: ["my-work-sites"],
    queryFn: () => workSitesApi.my(),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const geo = useGeoStatus(gps, centers);

  const isCheckedIn = !!data?.checkIn;
  const isCheckedOut = !!data?.checkOut;
  const isComplete = isCheckedIn && isCheckedOut;
  const mode: "in" | "out" = isCheckedIn ? "out" : "in";

  const minutesSinceCheckIn = isCheckedIn ? now.diff(dayjs(data.checkIn), "minute") : 0;
  const tooEarlyToLeave = isCheckedIn && !isCheckedOut && minutesSinceCheckIn < MIN_WORK_MINUTES;
  const checkOutWaitMin = Math.max(0, MIN_WORK_MINUTES - minutesSinceCheckIn);
  const expectedCheckOut = data?.expectedCheckOut ? dayjs(data.expectedCheckOut) : null;
  const isEarlyLeave = isCheckedIn && !isCheckedOut && !!expectedCheckOut && now.isBefore(expectedCheckOut);

  /** Kamera va GPS faqat haqiqatan belgilash mumkin bo'lganda yoqiladi (batareya) */
  const wantsLive = !isLoading && !isComplete && !tooEarlyToLeave;

  const [verify, setVerify] = useState<VerifyState>("idle");
  /** Tugma bosilgan paytdagi rejim — javobdan keyin `data` yangilansa ham matn o'zgarmasin */
  const [verifyMode, setVerifyMode] = useState<"in" | "out">("in");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [showEarlyWarning, setShowEarlyWarning] = useState(false);
  const [flash, setFlash] = useState(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (successTimer.current) clearTimeout(successTimer.current); }, []);

  // Ruxsatlar oldin berilgan bo'lsa — hech narsa bosmasdan ishga tushadi
  useEffect(() => {
    if (!wantsLive) {
      cam.stop();
      gps.stop();
      return;
    }
    let cancelled = false;
    void (async () => {
      const [geoPerm, camPerm] = await Promise.all([queryPermission("geolocation"), queryPermission("camera")]);
      if (cancelled) return;
      if (geoPerm === "granted") gps.locate();
      if (camPerm === "granted") void cam.start();
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsLive]);

  const startAll = () => {
    if (!gps.coords && !gps.loading) gps.locate();
    if (!cam.active) void cam.start();
  };

  const mutation = useMutation({
    mutationFn: (vars: { selfie: File | null }) =>
      attendanceApi.selfCheckIn({
        gpsLat: gps.coords?.lat,
        gpsLng: gps.coords?.lng,
        gpsAccuracy: gps.coords?.accuracy,
        selfie: vars.selfie,
      }),
    onMutate: () => {
      setVerifyError(null);
      setVerify("verifying");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-attendance-today"] });
      qc.invalidateQueries({ queryKey: ["my-attendance"] });
      qc.invalidateQueries({ queryKey: ["live-location-tracking-session"] });
      setVerify("success");
      navigator.vibrate?.(45);
      successTimer.current = setTimeout(() => setVerify("idle"), 1400);
    },
    onError: (error: any) => {
      setVerifyError(apiMessage(error, "Tekshiruvni yakunlab bo'lmadi. Internetni tekshirib, qayta urinib ko'ring."));
      setVerify("error");
    },
  });

  const cameraRequired = mode === "in";
  const canPress =
    !mutation.isPending &&
    wantsLive &&
    (geo.status === "inside" || geo.status === "no-centers") &&
    (!cameraRequired || cam.active);

  const submit = async (confirmedEarly = false) => {
    if (!canPress && verify !== "error") return;
    if (mode === "out" && isEarlyLeave && !confirmedEarly) {
      setShowEarlyWarning(true);
      return;
    }
    setShowEarlyWarning(false);
    setCaptureError(null);

    let selfie: File | null = null;
    if (cam.active) {
      const shot = await cam.capture();
      if (shot.error && cameraRequired) {
        setCaptureError(shot.error);
        setVerify("idle");
        return;
      }
      selfie = shot.file;
      if (selfie) {
        setFlash(true);
        setTimeout(() => setFlash(false), 160);
      }
    } else if (cameraRequired) {
      setCaptureError("Kamera yoqilmagan. Avval kamerani yoqing.");
      return;
    }
    setVerifyMode(mode);
    mutation.mutate({ selfie });
  };

  // ── Ko'rsatkichlar ──
  const accent = mode === "in"
    ? { btn: "bg-indigo-700 hover:bg-indigo-800 shadow-indigo-700/30", ring: "ring-indigo-500/40", text: "text-indigo-600 dark:text-indigo-300" }
    : { btn: "bg-orange-700 hover:bg-orange-800 shadow-orange-700/30", ring: "ring-orange-500/40", text: "text-orange-600 dark:text-orange-300" };

  const hint = (() => {
    if (!wantsLive) return null;
    if (cameraRequired && !cam.active) return cam.starting ? "Kamera yoqilmoqda…" : "Kamerani yoqing";
    switch (geo.status) {
      case "idle": return "Joylashuvni aniqlang";
      case "locating": return "Joylashuv aniqlanmoqda…";
      case "weak": return `GPS aniqligi past (±${Math.round(gps.coords?.accuracy ?? 0)} m). Ochiq joyga chiqib qayta aniqlang.`;
      case "outside": return "Siz ish joyi hududidan tashqaridasiz";
      case "error": return "Joylashuvni aniqlab bo'lmadi";
      default: return mode === "in" ? "Bosing — surat olinadi va darhol yuboriladi" : "Bosing — ketishingiz qayd etiladi";
    }
  })();

  const status = data ? (STATUS_MAP[data.status] ?? { label: data.status, cls: "bg-white/10 text-white/80 border-white/20" }) : null;
  const planIn = data?.expectedCheckIn ? dayjs(data.expectedCheckIn).format("HH:mm") : null;
  const planOut = expectedCheckOut ? expectedCheckOut.format("HH:mm") : null;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] pb-8">
      <VerificationOverlay
        state={verify}
        mode={verifyMode}
        errorMessage={verifyError}
        onRetry={() => { mutation.reset(); void submit(true); }}
        onClose={() => { mutation.reset(); setVerify("idle"); }}
      />
      <Topbar title="Check-in" subtitle={`${empName} · ${today.format("D MMMM, dddd")}`} />

      <div className="mx-auto max-w-md space-y-3 px-4 pt-3">
        {/* ── Bugungi holat (ixcham: asosiy tugma birinchi ekranga sig'sin) ── */}
        <section className="relative overflow-hidden rounded-3xl bg-[#12152B] px-4 py-3.5 text-white shadow-xl">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[32px] font-black leading-none tabular-nums tracking-tight">{now.format("HH:mm")}</p>
              <p className="mt-1.5 truncate text-[11px] font-semibold text-white/55">
                {planIn && planOut ? `Grafik: ${planIn} – ${planOut}` : "Bugungi grafik"}
              </p>
            </div>
            <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
              {isLoading ? (
                <span className="h-6 w-20 animate-pulse rounded-full bg-white/10" />
              ) : status ? (
                <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-bold", status.cls)}>{status.label}</span>
              ) : (
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] font-bold text-white/70">
                  Hali belgilanmagan
                </span>
              )}
              <div className="flex gap-1.5 text-xs font-bold tabular-nums">
                <span className={cn("flex items-center gap-1 rounded-xl bg-white/[0.07] px-2 py-1", isCheckedIn ? "text-emerald-300" : "text-white/40")}>
                  <LogIn className="h-3 w-3" /> {fmt(data?.checkIn)}
                </span>
                <span className={cn("flex items-center gap-1 rounded-xl bg-white/[0.07] px-2 py-1", isCheckedOut ? "text-orange-300" : "text-white/40")}>
                  <LogOut className="h-3 w-3" /> {fmt(data?.checkOut)}
                </span>
              </div>
            </div>
          </div>
          {(data?.lateMinutes > 0 || (isCheckedIn && !isCheckedOut)) && (
            <p className="relative mt-2 flex flex-wrap gap-x-3 text-[11px] font-bold">
              {data?.lateMinutes > 0 && <span className="text-amber-300">+{data.lateMinutes} daq kech keldi</span>}
              {isCheckedIn && !isCheckedOut && <span className="text-white/55">{fmtDuration(minutesSinceCheckIn)} ishlandi</span>}
            </p>
          )}
        </section>

        {/* ── Kun yakunlandi ── */}
        {isComplete && (
          <section className="rounded-3xl border border-teal-600/25 bg-teal-600/10 p-5 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-700 text-white shadow-lg shadow-teal-700/30">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <p className="mt-3 text-base font-black text-[var(--text-primary)]">Bugungi ish kuni yakunlandi</p>
            <p className="mt-1 text-sm font-medium text-[var(--text-muted)]">
              {fmt(data.checkIn)} – {fmt(data.checkOut)} · {fmtDuration(Math.max(0, dayjs(data.checkOut).diff(dayjs(data.checkIn), "minute")))}
            </p>
          </section>
        )}

        {/* ── Ketishga hali erta ── */}
        {tooEarlyToLeave && (
          <section className="flex items-center gap-3 rounded-3xl border border-amber-500/25 bg-amber-500/10 px-5 py-4">
            <Clock3 className="h-6 w-6 flex-shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Kelishingiz qayd etildi</p>
              <p className="text-xs font-medium text-[var(--text-muted)]">
                Ketishni {checkOutWaitMin} daqiqadan so&apos;ng belgilash mumkin (kamida 2 soat).
              </p>
            </div>
          </section>
        )}

        {wantsLive && (
          <>
            {/* ── Kamera ── */}
            <section className={cn("relative mx-auto aspect-[5/4] max-h-[42vh] w-full overflow-hidden rounded-[2rem] bg-slate-950 shadow-xl ring-4", accent.ring)}>
              <video
                ref={cam.videoRef}
                className={cn("h-full w-full -scale-x-100 object-cover transition-opacity", cam.active ? "opacity-100" : "opacity-0")}
                autoPlay
                playsInline
                muted
              />
              <canvas ref={cam.canvasRef} className="hidden" />

              {cam.active ? (
                <>
                  <div className="face-camera-vignette pointer-events-none absolute inset-0" />
                  <svg viewBox="0 0 280 280" className="pointer-events-none absolute inset-0 h-full w-full">
                    <ellipse cx="140" cy="140" rx="96" ry="122" className="fill-none stroke-white/25" strokeWidth="1.5" strokeDasharray="1 7" strokeLinecap="round" />
                    {FACE_DOTS.map((d) => (
                      <circle key={d.delay} cx={d.cx} cy={d.cy} r="3.6" className="faceid-chase-dot" style={{ animationDelay: d.delay }} />
                    ))}
                  </svg>
                  <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[11px] font-semibold tracking-wide text-white/85">
                    Yuzingizni ramka ichiga joylang
                  </p>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                    {cam.starting ? <Loader2 className="h-7 w-7 animate-spin text-white" /> : <Camera className="h-7 w-7 text-white" />}
                  </span>
                  <p className="text-sm font-semibold text-white/80">
                    {mode === "in" ? "Kelishni belgilash uchun kamera va joylashuv kerak" : "Kamera ixtiyoriy — shubhali holatda yuz so'raladi"}
                  </p>
                  <button
                    type="button"
                    onClick={startAll}
                    disabled={cam.starting}
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-slate-900 shadow-lg transition active:scale-95"
                  >
                    {cam.starting ? "Yoqilmoqda…" : "Boshlash"}
                  </button>
                </div>
              )}

              {flash && <div className="pointer-events-none absolute inset-0 bg-white/80" />}

              {/* GPS chipi */}
              <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
                <GeoChip status={geo.status} accuracy={gps.coords?.accuracy} />
              </div>
            </section>

            {(cam.error || captureError) && (
              <p className="flex items-start gap-1.5 px-1 text-xs font-medium text-rose-500" role="alert">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                {captureError ?? cam.error}
              </p>
            )}

            {/* ── Ish joyi ── */}
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl",
                    geo.status === "inside" && "bg-emerald-500/15 text-emerald-500",
                    geo.status === "outside" && "bg-rose-500/15 text-rose-500",
                    !["inside", "outside"].includes(geo.status) && "bg-[var(--bg-main)] text-[var(--text-muted)]",
                  )}
                >
                  {geo.status === "locating" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Building2 className="h-5 w-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                    {geo.match?.name ?? geo.nearest?.name ?? (centers && centers.length === 0 ? "Ish joyi belgilanmagan" : "Ish joyi")}
                  </p>
                  <p className="text-xs font-medium text-[var(--text-muted)]">
                    {geo.status === "inside" && "Hudud ichidasiz ✓"}
                    {geo.status === "outside" && geo.nearest && `${fmtDistance(geo.nearest.gap)} uzoqdasiz`}
                    {geo.status === "locating" && (gps.coords ? `Aniqlik ±${Math.round(gps.coords.accuracy)} m · yaxshilanmoqda` : "Joylashuv aniqlanmoqda…")}
                    {geo.status === "weak" && `Aniqlik past: ±${Math.round(gps.coords?.accuracy ?? 0)} m`}
                    {geo.status === "no-centers" && "Rahbariyat ish joyini hali belgilamagan"}
                    {geo.status === "idle" && "Joylashuv hali aniqlanmagan"}
                    {geo.status === "error" && "Joylashuv aniqlanmadi"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={gps.locate}
                  disabled={gps.loading}
                  aria-label="Joylashuvni qayta aniqlash"
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] text-[var(--text-muted)] transition hover:text-[var(--text-primary)] disabled:opacity-50"
                >
                  {gps.coords || gps.error ? <RefreshCw className={cn("h-4 w-4", gps.loading && "animate-spin")} /> : <Crosshair className="h-4 w-4" />}
                </button>
              </div>

              {geo.status === "outside" && geo.sorted.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-[var(--border)] pt-3">
                  {geo.sorted.slice(0, 4).map((c) => (
                    <li key={`${c.source}-${c.workSiteId ?? c.name}`} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex min-w-0 items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                        <Navigation className="h-3.5 w-3.5 flex-shrink-0 text-[var(--text-muted)]" />
                        <span className="truncate">{c.name}</span>
                      </span>
                      <span className="flex-shrink-0 font-bold tabular-nums text-[var(--text-muted)]">{fmtDistance(c.distance)}</span>
                    </li>
                  ))}
                  <li className="pt-1 text-[11px] font-medium text-[var(--text-muted)]">
                    Ish joyiga yetib kelgach, yangilash tugmasini bosing. Manzil noto&apos;g&apos;ri bo&apos;lsa — rahbariyatga murojaat qiling.
                  </li>
                </ul>
              )}

              {gps.error && (
                <div className="mt-3">
                  <LocationIssueAlert issue={gps.error} onRetry={gps.locate} />
                </div>
              )}
            </section>

            {/* ── Erta ketish ogohlantirishi ── */}
            {showEarlyWarning && (
              <section className="space-y-3 rounded-3xl border border-orange-500/35 bg-orange-500/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500" />
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">Ish vaqti hali tugamadi</p>
                    <p className="mt-0.5 text-xs font-medium text-[var(--text-muted)]">
                      Grafik bo&apos;yicha tugash vaqti <b>{planOut}</b>. Hozir ketsangiz &quot;erta ketdi&quot; deb yoziladi.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => void submit(true)}
                    disabled={mutation.isPending}
                    className="rounded-2xl bg-orange-700 py-3 text-sm font-bold text-white transition hover:bg-orange-800"
                  >
                    Baribir ketish
                  </button>
                  <button
                    onClick={() => setShowEarlyWarning(false)}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] py-3 text-sm font-bold text-[var(--text-primary)]"
                  >
                    Bekor qilish
                  </button>
                </div>
              </section>
            )}

            {/* ── Asosiy tugma ── */}
            {!showEarlyWarning && (
              <div className="space-y-2 pb-2">
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={!canPress}
                  className={cn(
                    "flex w-full items-center justify-center gap-2.5 rounded-3xl py-4 text-base font-black text-white shadow-xl transition active:scale-[0.98]",
                    canPress ? accent.btn : "cursor-not-allowed bg-slate-400/40 text-white/80 shadow-none dark:bg-slate-700/60",
                  )}
                >
                  {mutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : mode === "in" ? (
                    <ScanFace className="h-5 w-5" />
                  ) : (
                    <LogOut className="h-5 w-5" />
                  )}
                  {mutation.isPending ? "Yuborilmoqda…" : mode === "in" ? "Keldim" : "Ketyapman"}
                </button>
                {hint && (
                  <p className={cn("text-center text-xs font-semibold", canPress ? accent.text : "text-[var(--text-muted)]")}>
                    {hint}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── GPS chipi (kamera ustida) ────────────────────────────────────────────────
function GeoChip({ status, accuracy }: { status: GeoStatus; accuracy?: number }) {
  const acc = accuracy != null ? `±${Math.round(accuracy)} m` : null;
  const view: Record<GeoStatus, { cls: string; text: string }> = {
    idle:        { cls: "border-white/20 text-white/80", text: "GPS o'chiq" },
    locating:    { cls: "border-sky-300/40 text-sky-100", text: acc ? `GPS ${acc}…` : "GPS aniqlanmoqda…" },
    weak:        { cls: "border-amber-300/50 text-amber-100", text: `Aniqlik past ${acc ?? ""}` },
    inside:      { cls: "border-emerald-300/50 text-emerald-100", text: `Ish joyidasiz ${acc ?? ""}` },
    outside:     { cls: "border-rose-300/50 text-rose-100", text: "Hududdan tashqarida" },
    "no-centers":{ cls: "border-white/25 text-white/85", text: `GPS ${acc ?? ""}` },
    error:       { cls: "border-rose-300/50 text-rose-100", text: "GPS xatosi" },
  };
  const v = view[status];
  return (
    <span className={cn("flex items-center gap-1.5 rounded-full border bg-slate-950/55 px-3 py-1.5 text-[11px] font-extrabold backdrop-blur-sm", v.cls)}>
      {status === "locating" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
      {v.text.trim()}
    </span>
  );
}
