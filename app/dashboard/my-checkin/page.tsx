/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

/**
 * Mobil check-in / check-out (FAZA 6 · 4c) — dizayn kanvasi bo'yicha.
 *
 * Oqim: sahifa ochiladi → ruxsatlar oldin berilgan bo'lsa kamera va GPS o'zi
 * yoqiladi (aks holda bitta "Boshlash" tugmasi — iOS PWA ruxsat oynasi
 * foydalanuvchi bosishini talab qiladi) → xodim ish joyi ichida bo'lsa katta
 * tugma faollashadi → bosilganda surat DARHOL olinib yuboriladi (preview yo'q).
 *
 * Ketishda selfie majburiy emas: server GPS'ni doim tekshiradi, yuzni esa faqat
 * shubhali holatda solishtiradi. Kamera ochiq bo'lsa kadr baribir yuboriladi.
 *
 * Ichida/tashqarida ekranda serverdagi qoida bilan bir xil hisoblanadi:
 * masofa − radius ≤ min(GPS aniqligi, 50 m). Yakuniy qarorni server qiladi.
 *
 * Ekranlar: tayyor · aniqlanmoqda · tashqarida · tekshirilmoqda · keldingiz ·
 * ketish · kun yakunlandi.
 */

import Link from "next/link";
import { useRef, useState, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell, Check, Clock3, Crosshair, LogOut, MapPin, Navigation, RefreshCw,
  ScanFace, ShieldCheck, Building2, ClipboardList, Camera, AlertTriangle, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  attendanceApi, authApi, notificationsApi, photoUrl, workSitesApi, type MyGeoCenter,
} from "@/lib/api";
import {
  createAccurateLocationRequest,
  detectLocationPlatform,
  getLocationIssueContent,
  type AccurateLocationRequest,
  type LocationIssue,
  type LocationPlatform,
} from "@/lib/mobile-geolocation";
import { useAuthStore } from "@/stores/auth";
import { useEmployeeToday, SELF_TODAY_KEY } from "@/hooks/useEmployeeToday";
import { tzTime } from "@/lib/time";
import { Topbar } from "@/components/layout/Topbar";
import dayjs from "dayjs";
import "dayjs/locale/uz-latn";
dayjs.locale("uz-latn");

// ─── Qoidalar (backend bilan bir xil) ─────────────────────────────────────────
const GPS_TOLERANCE_MAX_M = 50;
const GPS_MAX_ACCURACY_M = 150;
const GPS_TARGET_ACCURACY_M = 25;
const GPS_MAX_WAIT_MS = 25_000;
const MIN_WORK_MINUTES = 120;
const MAX_SELFIE_SIDE = 640;
const MIN_BRIGHTNESS = 45;

// ─── Yordamchilar ─────────────────────────────────────────────────────────────
const UZ_WEEKDAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const UZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

function fmt(date?: string | Date | null) {
  return date ? tzTime(date).format("HH:mm") : "—";
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
function greeting(h: number) {
  if (h >= 5 && h < 11) return "Xayrli tong";
  if (h >= 11 && h < 17) return "Xayrli kun";
  if (h >= 17 && h < 22) return "Xayrli kech";
  return "Xayrli tun";
}
/** "Karimova Dilnoza Botirovna" → "Dilnoza" (familiya odatda birinchi) */
function firstName(fullName?: string | null) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  return parts[1] ?? parts[0] ?? "";
}
function initials(fullName?: string | null) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  return ((parts[1]?.[0] ?? "") + (parts[0]?.[0] ?? "")).toUpperCase() || "?";
}
function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function apiMessage(error: any, fallback: string): string {
  const msg = error?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string" && msg.trim()) return msg;
  if (error?.code === "ECONNABORTED") return "Server javobi kechikdi. Internetni tekshirib, qayta urinib ko'ring.";
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

// ─── Kamera ───────────────────────────────────────────────────────────────────
function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  /** Har stop()/unmount'da oshadi — kechikib kelgan getUserMedia oqimi tashlanadi */
  const genRef = useRef(0);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Video element kamera o'chiq paytda ham DOM'da turadi — oqimni qayta ulaymiz
  const attach = useCallback(() => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;
    if (video.srcObject !== streamRef.current) video.srcObject = streamRef.current;
    video.play().catch(() => {});
  }, []);
  useEffect(() => { if (active) attach(); }, [active, attach]);

  const stop = useCallback(() => {
    genRef.current++;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
    setStarting(false);
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) { attach(); return; }
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Bu brauzer kamerani qo'llab-quvvatlamaydi. Chrome yoki Safari'dan foydalaning.");
      return;
    }
    setStarting(true);
    const gen = ++genRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      // Kutish paytida sahifa yopilgan yoki kamera o'chirilgan — oqim darhol
      // to'xtatiladi (aks holda kamera chirog'i yonib qolardi)
      if (gen !== genRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      // iOS ilova fonga o'tganda oqim uziladi — "Boshlash" qayta ko'rinadi
      stream.getVideoTracks().forEach((t) => {
        t.onended = () => { streamRef.current = null; setActive(false); };
      });
      setActive(true);
    } catch {
      if (gen === genRef.current) {
        setError("Kameraga ruxsat berilmadi. Telefon sozlamalarida ushbu sayt uchun kamerani yoqing.");
      }
    } finally {
      if (gen === genRef.current) setStarting(false);
    }
  }, [attach]);

  useEffect(() => stop, [stop]);

  /** Joriy kadr: ≤640px, yorug'lik tekshiruvi, JPEG 0.85 */
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
      return { file: null, error: "Rasm juda qorong'u — yuzingiz ko'rinmayapti. Yorug'roq joyga o'ting va qayta bosing." };
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

  /** Birinchi (taxminiy) nuqta → watchPosition aniqlikni ±25 m gacha yaxshilaydi */
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
interface CenterDistance extends MyGeoCenter { distance: number; gap: number }

function useGeoStatus(gps: ReturnType<typeof useGPS>, centers: MyGeoCenter[] | undefined) {
  return useMemo(() => {
    const coords = gps.coords;
    const sorted: CenterDistance[] = coords && centers
      ? centers
          .map((c) => { const distance = distanceM(coords, c); return { ...c, distance, gap: distance - c.radius }; })
          .sort((a, b) => a.gap - b.gap)
      : [];
    const nearest = sorted[0] ?? null;
    const base = { sorted, nearest, match: null as CenterDistance | null };

    if (gps.error && !coords) return { ...base, status: "error" as GeoStatus };
    if (!coords) return { ...base, status: (gps.loading ? "locating" : "idle") as GeoStatus };
    if (coords.accuracy > GPS_MAX_ACCURACY_M) {
      return { ...base, status: (gps.loading ? "locating" : "weak") as GeoStatus };
    }
    if (!centers || centers.length === 0) return { ...base, status: "no-centers" as GeoStatus };
    const tolerance = Math.min(coords.accuracy, GPS_TOLERANCE_MAX_M);
    const match = sorted.find((c) => c.gap <= tolerance) ?? null;
    if (match) return { ...base, match, status: "inside" as GeoStatus };
    if (gps.loading && coords.accuracy > GPS_TOLERANCE_MAX_M) return { ...base, status: "locating" as GeoStatus };
    return { ...base, status: "outside" as GeoStatus };
  }, [gps.coords, gps.loading, gps.error, centers]);
}

// ─── Kichik UI bo'laklari ─────────────────────────────────────────────────────
function Tile({ tone, size = 40, children }: { tone: "teal" | "amber" | "orange" | "indigo" | "rose" | "soft"; size?: number; children: ReactNode }) {
  const cls = {
    teal: "bg-[var(--ci-teal-tint)] text-[var(--ci-teal-text)]",
    amber: "bg-[var(--ci-amber-tint)] text-[var(--ci-amber-ink)]",
    orange: "bg-[var(--ci-orange-tint)] text-[var(--ci-orange-text)]",
    indigo: "bg-[var(--ci-indigo-tint)] text-[var(--ci-indigo-text)]",
    rose: "bg-[var(--ci-rose-tint)] text-[var(--ci-rose-ink)]",
    soft: "bg-[var(--ci-soft)] text-[var(--ci-ink)]",
  }[tone];
  return (
    <span
      className={cn("flex flex-shrink-0 items-center justify-center", cls)}
      style={{ width: size, height: size, borderRadius: size * 0.3 }}
    >
      {children}
    </span>
  );
}

function Chip({ tone, icon, children }: { tone: "teal" | "indigo" | "amber" | "orange"; icon: ReactNode; children: ReactNode }) {
  const cls = {
    teal: "bg-[var(--ci-teal-tint)] text-[var(--ci-teal-text)]",
    indigo: "bg-[var(--ci-indigo-tint)] text-[var(--ci-indigo-text)]",
    amber: "bg-[var(--ci-amber-tint)] text-[var(--ci-amber-ink)]",
    orange: "bg-[var(--ci-orange-tint)] text-[var(--ci-orange-text)]",
  }[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold", cls)}>
      {icon}
      {children}
    </span>
  );
}

/** Yuz ramkasi: oval + burchak qavslari (dizayndagi 176×224) */
function FaceFrame({ stroke, className }: { stroke: string; className?: string }) {
  return (
    <svg viewBox="0 0 176 224" className={cn("h-[clamp(150px,27vh,224px)] w-auto", className)} aria-hidden="true">
      <ellipse cx="88" cy="112" rx="80" ry="104" fill="none" stroke={stroke} strokeWidth="3" />
      <path
        d="M20 40V26a12 12 0 0 1 12-12h14M130 14h14a12 12 0 0 1 12 12v14M156 184v14a12 12 0 0 1-12 12h-14M46 210H32a12 12 0 0 1-12-12v-14"
        fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="3" strokeLinecap="round"
      />
    </svg>
  );
}

function CameraChip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="absolute left-3.5 top-3.5 flex items-center gap-1.5 rounded-full bg-[rgba(15,18,34,0.62)] py-[7px] pl-[9px] pr-3 text-xs font-semibold text-white backdrop-blur-sm">
      {icon}
      {children}
    </div>
  );
}

function PrimaryButton({
  tone, disabled, onClick, icon, children,
}: { tone: "indigo" | "orange"; disabled?: boolean; onClick?: () => void; icon: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-[60px] w-full items-center justify-center gap-2.5 rounded-[20px] text-base font-extrabold transition active:scale-[0.98]",
        disabled
          ? "cursor-not-allowed bg-[var(--ci-disabled)] text-[var(--ci-muted)]"
          : tone === "indigo"
            ? "bg-[var(--ci-indigo)] text-white shadow-[0_10px_22px_rgba(67,56,202,0.28)]"
            : "bg-[var(--ci-orange)] text-white shadow-[0_10px_22px_rgba(194,65,12,0.25)]",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function SecondaryButton({ onClick, icon, children, href }: { onClick?: () => void; icon: ReactNode; children: ReactNode; href?: string }) {
  const cls = "flex h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-[var(--ci-border)] bg-[var(--ci-card)] text-sm font-bold text-[var(--ci-ink)] transition active:scale-[0.98]";
  if (href) return <Link href={href} className={cn(cls, "h-[52px] rounded-2xl text-[15px]")}>{icon}{children}</Link>;
  return <button type="button" onClick={onClick} className={cls}>{icon}{children}</button>;
}

// ─── Sarlavha (mobil) ─────────────────────────────────────────────────────────
function GreetingHeader({ now }: { now: dayjs.Dayjs }) {
  const { user } = useAuthStore();
  const { data: profile } = useQuery({ queryKey: ["auth-profile"], queryFn: () => authApi.profile() });
  const { data: unread = 0 } = useQuery({
    queryKey: ["notif-count"],
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 30_000,
  });
  const emp = (profile as any)?.employee ?? user?.employee;
  const fullName: string = emp?.fullName ?? user?.username ?? "";
  const photo = emp?.photoUrl ? photoUrl(emp.photoUrl) : null;

  return (
    <div className="flex items-center gap-3 px-5 pb-3 pt-5 sm:hidden">
      {photo ? (
        <img src={photo} alt="" className="h-11 w-11 flex-shrink-0 rounded-[14px] object-cover" />
      ) : (
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] bg-[var(--ci-avatar)] text-[15px] font-extrabold text-[var(--ci-avatar-ink)]">
          {initials(fullName)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-medium text-[var(--ci-muted)]">
          {UZ_WEEKDAYS[now.day()]}, {now.date()}-{UZ_MONTHS[now.month()]}
        </p>
        <p className="truncate text-lg font-extrabold tracking-[-0.3px]">
          {greeting(now.hour())}{firstName(fullName) ? `, ${firstName(fullName)}` : ""}
        </p>
      </div>
      <Link
        href="/dashboard/notifications"
        aria-label="Bildirishnomalar"
        className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] border border-[var(--ci-border)] bg-[var(--ci-card)] text-[var(--ci-ink)]"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-[11px] top-2.5 h-2 w-2 rounded-full border-2 border-[var(--ci-card)] bg-[var(--ci-orange)] box-content" />
        )}
      </Link>
    </div>
  );
}

// ─── Qora "smena" kartasi ─────────────────────────────────────────────────────
function ShiftCard({
  label, value, pill, pillTone, progress, left, right,
}: {
  label: string; value: string; pill: string; pillTone: "indigo" | "orange" | "amber" | "muted";
  progress: number; left: string; right: string;
}) {
  const pillCls = {
    indigo: "bg-[var(--ci-hero-track)] text-[#C7CCFF]",
    orange: "bg-[#3A2418] text-[#FDBA8C]",
    amber: "bg-[#3A3018] text-[#FCD34D]",
    muted: "bg-[var(--ci-hero-track)] text-[var(--ci-hero-muted)]",
  }[pillTone];
  const bar = pillTone === "orange" ? "bg-[#FB923C]" : pillTone === "amber" ? "bg-[#F59E0B]" : "bg-[#818CF8]";
  return (
    <div className="mx-5 flex flex-col gap-3 rounded-3xl bg-[var(--ci-hero)] px-[18px] py-4 text-white">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-shrink-0">
          <p className="text-xs font-medium text-[var(--ci-hero-muted)]">{label}</p>
          <p className="whitespace-nowrap text-[clamp(20px,6vw,25px)] font-extrabold tabular-nums tracking-[-0.6px]">{value}</p>
        </div>
        <span className={cn("min-w-0 truncate rounded-full px-3 py-[7px] text-xs font-bold", pillCls)}>{pill}</span>
      </div>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-[var(--ci-hero-track)]">
        <div className={cn("absolute inset-y-0 left-0 rounded-full transition-[width]", bar)} style={{ width: `${Math.max(1, Math.min(100, progress))}%` }} />
      </div>
      <div className="flex justify-between gap-3 text-xs tabular-nums text-[var(--ci-hero-muted)]">
        <span>{left}</span>
        <span className="truncate text-right">{right}</span>
      </div>
    </div>
  );
}

// ─── SAHIFA ───────────────────────────────────────────────────────────────────
type VerifyState = "idle" | "verifying" | "error";

export default function MyCheckinPage() {
  const qc = useQueryClient();
  const cam = useCamera();
  const gps = useGPS();
  const { user } = useAuthStore();

  const [now, setNow] = useState(() => tzTime());
  useEffect(() => {
    const id = setInterval(() => setNow(tzTime()), 20_000);
    return () => clearInterval(id);
  }, []);

  const today = useEmployeeToday();
  const data = today.record;
  const isLoading = today.isLoading;

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

  const minutesSinceCheckIn = isCheckedIn ? Math.max(0, now.diff(tzTime(data.checkIn), "minute")) : 0;
  const tooEarlyToLeave = isCheckedIn && !isCheckedOut && minutesSinceCheckIn < MIN_WORK_MINUTES;
  const leaveAllowedAt = isCheckedIn ? tzTime(data.checkIn).add(MIN_WORK_MINUTES, "minute") : null;

  // Smena vaqtlari serverdan mutlaq vaqt sifatida keladi (tungi smenada
  // ketish ertasi kuni) — telefon vaqt zonasiga bog'liq emas
  const shiftStart = today.expectedCheckIn ? tzTime(today.expectedCheckIn) : null;
  const shiftEnd = today.expectedCheckOut ? tzTime(today.expectedCheckOut) : null;
  const graceMin: number = today.graceMinutes;
  const runningLate = !isCheckedIn && !!shiftStart && now.isAfter(shiftStart.add(graceMin, "minute"));
  const isEarlyLeave = isCheckedIn && !isCheckedOut && !!shiftEnd && now.isBefore(shiftEnd);

  /** Kamera va GPS faqat belgilash mumkin bo'lganda yoqiladi (batareya) */
  const wantsLive = !isLoading && !today.isError && !isComplete && !tooEarlyToLeave;

  const [verify, setVerify] = useState<VerifyState>("idle");
  const [verifyMode, setVerifyMode] = useState<"in" | "out">("in");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [showEarlyWarning, setShowEarlyWarning] = useState(false);
  const [steps, setSteps] = useState<{ photoKb: number | null; uploadedMs: number | null; startedAt: number }>({
    photoKb: null, uploadedMs: null, startedAt: 0,
  });
  const [lastResult, setLastResult] = useState<{ siteName: string | null; faceChecked: boolean; facePending: boolean } | null>(null);

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

  // Ilova fonga o'tganda kamera o'chiriladi (batareya; iOS fonda oqimni
  // "muzlatib" qo'yadi va qaytganda qora kadr chiqadi), qaytganda qayta yoqiladi
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        cam.stop();
        return;
      }
      if (!wantsLive || verify !== "idle") return;
      void queryPermission("camera").then((p) => {
        if (p === "granted" && !document.hidden) void cam.start();
      });
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsLive, verify]);

  const startAll = () => {
    if (!gps.coords && !gps.loading) gps.locate();
    if (!cam.active) void cam.start();
  };

  /** Tugma ikki marta bosilmasin: surat olinayotgan paytda ham (mutation hali boshlanmagan) */
  const submittingRef = useRef(false);

  const mutation = useMutation({
    mutationFn: (vars: { selfie: File | null; expectedAction: "CHECK_IN" | "CHECK_OUT" }) =>
      attendanceApi.selfCheckIn({
        gpsLat: gps.coords?.lat,
        gpsLng: gps.coords?.lng,
        gpsAccuracy: gps.coords?.accuracy,
        selfie: vars.selfie,
        expectedAction: vars.expectedAction,
        onUploaded: () => setSteps((s) => ({ ...s, uploadedMs: Date.now() - s.startedAt })),
      }),
    onSuccess: (res: any) => {
      setLastResult({
        siteName: geo.match?.name ?? null,
        faceChecked: !!res?.attendance?.faceVerified,
        facePending: !!res?.attendance?.faceCheckPending,
      });
      navigator.vibrate?.(45);
      // Javobdagi yozuv darhol keshga yoziladi — keyingi so'rov muvaffaqiyatsiz
      // bo'lsa ham ekran eski (kelish) holatiga qaytmaydi
      qc.setQueryData(SELF_TODAY_KEY, (old: any) =>
        old
          ? {
              ...old,
              action: res?.action === "CHECK_IN" ? "CHECK_OUT" : "DONE",
              dayOff: false,
              record: { ...(old.record ?? {}), ...(res?.attendance ?? {}) },
            }
          : old,
      );
      void qc.invalidateQueries({ queryKey: SELF_TODAY_KEY });
      void qc.invalidateQueries({ queryKey: ["my-attendance"] });
      void qc.invalidateQueries({ queryKey: ["live-location-tracking-session"] });
      setVerify("idle");
    },
    onError: (error: any) => {
      setVerifyError(apiMessage(error, "Tekshiruvni yakunlab bo'lmadi. Internetni tekshirib, qayta urinib ko'ring."));
      setVerify("error");
      // Server javobi kechikkan bo'lsa ham yozuv saqlangan bo'lishi mumkin —
      // holat serverdan qayta olinadi (qayta urinish eski holat bilan ketmasin)
      void qc.invalidateQueries({ queryKey: SELF_TODAY_KEY });
    },
    onSettled: () => {
      submittingRef.current = false;
    },
  });

  const cameraRequired = mode === "in";
  const geoReady = geo.status === "inside" || geo.status === "no-centers";
  const canPress = !mutation.isPending && wantsLive && geoReady && (!cameraRequired || cam.active);

  const submit = async (confirmedEarly = false) => {
    if (submittingRef.current || mutation.isPending) return;
    if (!canPress) return;
    if (mode === "out" && isEarlyLeave && !confirmedEarly) {
      setShowEarlyWarning(true);
      return;
    }
    submittingRef.current = true;
    setShowEarlyWarning(false);
    setCaptureError(null);

    let selfie: File | null = null;
    if (cam.active) {
      const shot = await cam.capture();
      if (shot.error && cameraRequired) {
        setCaptureError(shot.error);
        setVerify("idle");
        submittingRef.current = false;
        return;
      }
      selfie = shot.file;
    } else if (cameraRequired) {
      setCaptureError("Kamera yoqilmagan. Avval kamerani yoqing.");
      setVerify("idle");
      submittingRef.current = false;
      return;
    }
    setVerifyMode(mode);
    setVerifyError(null);
    setSteps({ photoKb: selfie ? Math.max(1, Math.round(selfie.size / 1024)) : null, uploadedMs: null, startedAt: Date.now() });
    setVerify("verifying");
    mutation.mutate({ selfie, expectedAction: mode === "in" ? "CHECK_IN" : "CHECK_OUT" });
  };

  // ── Qaysi ekran ──
  const view: "loading" | "error" | "verify" | "success" | "done" | "outside" | "live" =
    isLoading ? "loading"
    : today.isError && verify === "idle" ? "error"
    : verify !== "idle" ? "verify"
    : isComplete ? "done"
    : tooEarlyToLeave ? "success"
    : geo.status === "outside" ? "outside"
    : "live";

  const siteName = lastResult?.siteName
    ?? (data?.checkInWorkSiteId ? centers?.find((c) => c.workSiteId === data.checkInWorkSiteId)?.name : null)
    ?? null;

  return (
    <div className="ci flex min-h-[calc(100dvh-6.5rem-env(safe-area-inset-bottom))] flex-col bg-[var(--ci-bg)] font-jakarta text-[var(--ci-ink)] sm:min-h-screen">
      <div className="hidden sm:block">
        <Topbar title="Check-in" subtitle={user?.employee?.fullName ?? user?.username ?? ""} />
      </div>
      <canvas ref={cam.canvasRef} className="hidden" />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col sm:pt-4">
        <GreetingHeader now={now} />

        {view === "loading" && (
          <div className="mx-5 flex flex-1 flex-col gap-3.5 pb-4">
            <div className="h-[132px] animate-pulse rounded-3xl bg-[var(--ci-hero)] opacity-80" />
            <div className="flex-1 animate-pulse rounded-[28px] bg-[var(--ci-camera)] opacity-80" />
          </div>
        )}

        {view === "error" && (
          <div className="mx-5 mt-3.5 flex flex-1 flex-col items-center justify-center gap-3 rounded-[28px] bg-[var(--ci-card)] px-6 py-10 text-center" role="alert">
            <AlertTriangle className="h-8 w-8 text-[var(--ci-rose-ink)]" />
            <p className="text-sm font-semibold text-[var(--ci-ink)]">
              Bugungi holatni yuklab bo&apos;lmadi. Internetni tekshiring.
            </p>
            <SecondaryButton onClick={() => void today.refetch()} icon={<RefreshCw className="h-[18px] w-[18px]" />}>
              Qayta yuklash
            </SecondaryButton>
          </div>
        )}

        {(view === "success" || view === "done") && (
          <ResultView
            kind={view}
            record={data}
            siteName={siteName}
            faceChecked={lastResult?.faceChecked || !!data?.faceVerified}
            facePending={!data?.faceVerified && (lastResult?.facePending || !!data?.faceCheckPending)}
            shiftEndLabel={today.shiftEnd}
            leaveAllowedAt={leaveAllowedAt}
            now={now}
          />
        )}

        {(view === "live" || view === "outside" || view === "verify") && (
          <>
            {/* ── Yuqori karta ── */}
            {view === "verify" ? null : view === "outside" ? (
              <OutsideCard sorted={geo.sorted} />
            ) : mode === "in" ? (
              <ShiftCard
                label="Bugungi smena"
                value={
                  today.state === "off" ? "Dam olish kuni"
                  : today.shiftStart && today.shiftEnd ? `${today.shiftStart} – ${today.shiftEnd}`
                  : "Grafik belgilanmagan"
                }
                pill={
                  today.state === "off" ? "Grafik bo'yicha"
                  : runningLate ? "Kechikyapsiz"
                  : "Kelish kutilmoqda"
                }
                pillTone={today.state === "off" ? "muted" : runningLate ? "amber" : "indigo"}
                progress={shiftStart && shiftEnd ? (now.diff(shiftStart, "minute") / Math.max(1, shiftEnd.diff(shiftStart, "minute"))) * 100 : 0}
                left={`Hozir ${now.format("HH:mm")}`}
                right={
                  geo.status === "inside" ? geo.match?.name ?? ""
                  : geo.status === "locating" ? "Joylashuv aniqlanmoqda"
                  : geo.status === "no-centers" ? "Ish joyi belgilanmagan"
                  : ""
                }
              />
            ) : (
              <ShiftCard
                label="Bugun ishlangan"
                value={fmtDuration(minutesSinceCheckIn)}
                pill="Ishda"
                pillTone="orange"
                progress={shiftStart && shiftEnd ? (now.diff(tzTime(data?.checkIn), "minute") / Math.max(1, shiftEnd.diff(shiftStart, "minute"))) * 100 : 100}
                left={`Keldi ${fmt(data?.checkIn)}`}
                right={`Hozir ${now.format("HH:mm")}`}
              />
            )}

            {/* ── Kamera ── */}
            {/* Kamera bloki tekshiruv paytida ham DOM'da qoladi — "Qayta urinish"
                yangi kadrni shu videodan oladi */}
            <div className={cn(
              "relative mx-5 flex min-h-[240px] flex-1 items-center justify-center overflow-hidden rounded-[28px] bg-[var(--ci-camera)]",
              view === "verify" ? "mt-1.5" : "mt-3.5",
            )}>
              <video
                ref={cam.videoRef}
                className={cn(
                  "absolute inset-0 h-full w-full -scale-x-100 object-cover transition-opacity duration-300",
                  !cam.active ? "opacity-0" : view === "verify" ? "opacity-[0.12]" : "opacity-100",
                )}
                autoPlay
                playsInline
                muted
              />
              {cam.active && view !== "verify" && <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(15,18,34,0.55)_100%)]" />}

              {view === "verify" ? (
                <VerifyOverlay state={verify} mode={verifyMode} error={verifyError} />
              ) : cam.active || view === "outside" ? (
                <FaceFrame
                  className="relative"
                  stroke={
                    view === "outside" ? "rgba(255,255,255,0.55)"
                    : geo.status === "inside" || geo.status === "no-centers" ? "#34D399"
                    : "#ffffff"
                  }
                />
              ) : (
                <div className="relative flex flex-col items-center gap-3 px-6 pb-20 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <Camera className="h-7 w-7" />
                  </span>
                  <p className="max-w-[260px] text-sm font-semibold text-white/80">
                    {mode === "in"
                      ? "Kelishni belgilash uchun kamera va joylashuvga ruxsat bering"
                      : "Kamera ixtiyoriy — shubhali holatda yuz so'raladi"}
                  </p>
                  <button
                    type="button"
                    onClick={startAll}
                    disabled={cam.starting}
                    className="rounded-2xl bg-white px-6 py-3 text-sm font-extrabold text-[#0F1222] shadow-lg transition active:scale-95"
                  >
                    {cam.starting ? "Yoqilmoqda…" : "Boshlash"}
                  </button>
                </div>
              )}

              {cam.active && view !== "verify" && (
                <CameraChip icon={<ScanFace className="h-4 w-4" />}>
                  {view === "outside" ? "Kamera tayyor" : "Yuzingizni ramkaga joylang"}
                </CameraChip>
              )}

              {view === "live" && (
                <LocationOverlay
                  status={geo.status}
                  match={geo.match}
                  nearest={geo.nearest}
                  accuracy={gps.coords?.accuracy ?? null}
                  issue={gps.error}
                  onRetry={gps.locate}
                  hidden={!cam.active && geo.status === "idle"}
                />
              )}
            </div>

            {/* ── Tugmalar ── */}
            {view === "verify" ? (
              <VerifyBottom
                state={verify}
                mode={verifyMode}
                steps={steps}
                accuracy={gps.coords?.accuracy ?? null}
                onRetry={() => {
                  // Avval holat serverdan yangilanadi: javob kechikkan bo'lsa
                  // yozuv allaqachon saqlangan bo'lishi mumkin — ko'r-ko'rona
                  // qayta yuborilmaydi, xodim yangilangan ekranda qayta bosadi
                  mutation.reset();
                  void today.refetch().finally(() => setVerify("idle"));
                }}
                onBack={() => { mutation.reset(); setVerify("idle"); }}
              />
            ) : (
            <div className="flex flex-col gap-2 px-5 pb-1.5 pt-3.5">
              {(captureError || cam.error) && (
                <p className="flex items-start gap-1.5 text-xs font-semibold text-[var(--ci-rose-ink)]" role="alert">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  {captureError ?? cam.error}
                </p>
              )}
              {view === "outside" ? (
                <>
                  <PrimaryButton tone="indigo" disabled icon={<Navigation className="h-5 w-5" />}>
                    Ish joyiga yaqinlashing
                  </PrimaryButton>
                  <SecondaryButton onClick={gps.locate} icon={<RefreshCw className={cn("h-[18px] w-[18px]", gps.loading && "animate-spin")} />}>
                    {gps.loading ? "Aniqlanmoqda…" : "Qayta aniqlash"}
                  </SecondaryButton>
                </>
              ) : (
                <>
                  <PrimaryButton
                    tone={mode === "in" ? "indigo" : "orange"}
                    disabled={!canPress}
                    onClick={() => void submit()}
                    icon={
                      !geoReady && wantsLive && (geo.status === "locating" || geo.status === "weak")
                        ? <Crosshair className="h-[22px] w-[22px]" />
                        : mode === "in" ? <ScanFace className="h-[22px] w-[22px]" /> : <LogOut className="h-[22px] w-[22px]" />
                    }
                  >
                    {geo.status === "locating" ? "Joylashuv kutilmoqda…"
                      : mode === "in" ? "Kelishni tasdiqlash" : "Ketishni tasdiqlash"}
                  </PrimaryButton>
                  <p className="text-center text-[12.5px] text-[var(--ci-muted)]">
                    {geo.status === "locating" ? "Aniqlik yetarli bo'lgach tugma o'zi yoqiladi"
                      : cameraRequired && !cam.active ? "Avval «Boshlash»ni bosing"
                      : mode === "in" ? "Bosilganda surat o'zi olinadi va yuboriladi"
                      : "GPS tekshiriladi · yuz faqat shubhali holatda solishtiriladi"}
                  </p>
                </>
              )}
            </div>
            )}
          </>
        )}
      </div>

      {showEarlyWarning && (
        <EarlyLeaveSheet
          shiftEnd={today.shiftEnd}
          onConfirm={() => void submit(true)}
          onCancel={() => setShowEarlyWarning(false)}
        />
      )}
    </div>
  );
}

// ─── Kamera ustidagi joylashuv kartasi ────────────────────────────────────────
function LocationOverlay({
  status, match, nearest, accuracy, issue, onRetry, hidden,
}: {
  status: GeoStatus;
  match: CenterDistance | null;
  nearest: CenterDistance | null;
  accuracy: number | null;
  issue: ReturnType<typeof getLocationIssueContent> | null;
  onRetry: () => void;
  hidden: boolean;
}) {
  if (hidden) return null;
  const acc = accuracy != null ? Math.round(accuracy) : null;

  let tile: ReactNode;
  let title: string;
  let sub: string;
  let pill: ReactNode = null;
  let progress: ReactNode = null;
  let action: ReactNode = null;

  const retryBtn = (
    <button
      type="button"
      onClick={onRetry}
      aria-label="Joylashuvni qayta aniqlash"
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--ci-border)] text-[var(--ci-muted)]"
    >
      <RefreshCw className="h-4 w-4" />
    </button>
  );

  switch (status) {
    case "inside":
      tile = <Tile tone="teal"><MapPin className="h-5 w-5" /></Tile>;
      title = match?.name ?? "Ish joyi";
      sub = `${fmtDistance(match?.distance ?? 0)} · aniqlik ±${acc} m`;
      pill = <span className="rounded-full bg-[var(--ci-teal-tint)] px-2.5 py-1.5 text-xs font-extrabold text-[var(--ci-teal-text)]">Ichida</span>;
      break;
    case "no-centers":
      tile = <Tile tone="soft"><MapPin className="h-5 w-5" /></Tile>;
      title = "Ish joyi belgilanmagan";
      sub = `Aniqlik ±${acc} m · server tekshiradi`;
      break;
    case "weak":
      tile = <Tile tone="amber"><Crosshair className="h-5 w-5" /></Tile>;
      title = `GPS aniqligi past: ±${acc} m`;
      sub = "Ochiq joyga chiqib qayta aniqlang";
      action = retryBtn;
      break;
    case "error":
      tile = <Tile tone="rose"><AlertTriangle className="h-5 w-5" /></Tile>;
      title = issue?.title ?? "Joylashuv aniqlanmadi";
      sub = issue?.message ?? "Joylashuv ruxsatini tekshiring";
      action = issue?.canRetry === false ? null : retryBtn;
      break;
    case "idle":
      tile = <Tile tone="soft"><Crosshair className="h-5 w-5" /></Tile>;
      title = "Joylashuv aniqlanmagan";
      sub = "Aniqlash uchun bosing";
      action = retryBtn;
      break;
    default: {
      tile = <Tile tone="amber"><Crosshair className="h-5 w-5" /></Tile>;
      title = "Joylashuv aniqlashtirilmoqda";
      sub = nearest ? `Eng yaqini — ${nearest.name}` : "Ochiq joyga yoki deraza yoniga yaqinlashing";
      // ±300 m → 0%, ±50 m → 100%
      const pct = acc == null ? 5 : Math.max(5, Math.min(100, ((300 - acc) / 250) * 100));
      progress = (
        <div className="flex flex-col gap-1.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ci-amber-track)]">
            <div className="h-full rounded-full bg-[var(--ci-amber)] transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[11.5px] text-[var(--ci-muted)] tabular-nums">
            <span>{acc != null ? `±${acc} m` : "qidirilmoqda…"}</span>
            <span>kerak ±{GPS_TOLERANCE_MAX_M} m</span>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="absolute inset-x-3 bottom-3 flex flex-col gap-2.5 rounded-[20px] bg-[var(--ci-card)] px-3.5 py-3 text-[var(--ci-ink)]">
      <div className="flex items-center gap-3">
        {tile}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-extrabold tracking-[-0.2px]">{title}</p>
          <p className="line-clamp-2 text-[12.5px] tabular-nums text-[var(--ci-muted)]">{sub}</p>
        </div>
        {pill}
        {action}
      </div>
      {progress}
    </div>
  );
}

// ─── Tashqarida ───────────────────────────────────────────────────────────────
function OutsideCard({ sorted }: { sorted: CenterDistance[] }) {
  const nearest = sorted[0];
  return (
    <div className="mx-5 flex flex-col rounded-3xl border border-[var(--ci-border)] bg-[var(--ci-card)] px-[18px] pb-1.5 pt-4">
      <div className="flex items-start gap-3 pb-2.5">
        <Tile tone="orange"><MapPin className="h-5 w-5" /></Tile>
        <div className="min-w-0">
          <p className="text-base font-extrabold tracking-[-0.2px]">Ish joyidan tashqaridasiz</p>
          {nearest && (
            <p className="text-[13px] text-[var(--ci-muted)]">
              Eng yaqini — {nearest.name}, {fmtDistance(nearest.distance)}. Ruxsat: {nearest.radius} m.
            </p>
          )}
        </div>
      </div>
      {sorted.slice(0, 3).map((c, i, arr) => (
        <div
          key={`${c.source}-${c.workSiteId ?? c.name}`}
          className={cn("flex items-center gap-3 py-[11px]", i < arr.length - 1 && "border-b border-[var(--ci-border)]")}
        >
          <Tile tone="soft" size={36}><Building2 className="h-[18px] w-[18px]" /></Tile>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{c.name}</p>
            <p className="text-xs text-[var(--ci-muted)]">
              {c.source === "SITE" ? "Ish joyi" : c.source === "HOSPITAL" ? "Asosiy bino" : "Markaz"} · radius {c.radius} m
            </p>
          </div>
          <p className="text-sm font-extrabold tabular-nums text-[var(--ci-orange-text)]">{fmtDistance(c.distance)}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Tekshirilmoqda / xato ────────────────────────────────────────────────────
function VerifyOverlay({ state, mode, error }: { state: VerifyState; mode: "in" | "out"; error: string | null }) {
  const isError = state === "error";
  return (
    <div className="relative flex flex-col items-center justify-center gap-[18px] px-6 text-center">
      <div className="relative h-[180px] w-[141px]">
        <FaceFrame className={cn("h-full", !isError && "ci-pulse")} stroke={isError ? "#FB7185" : "#818CF8"} />
        {!isError && <div className="ci-sweep absolute inset-x-4 top-1/2 h-0.5 rounded bg-[#A5B4FC]" />}
      </div>
      <p className="text-lg font-extrabold text-white">
        {isError ? "Qayd etilmadi" : mode === "in" ? "Yuz tekshirilmoqda" : "Ketish qayd etilmoqda"}
      </p>
      <p className="-mt-3 max-w-[300px] text-[13px] text-[var(--ci-hero-muted)]">
        {isError ? error : "Telefonni qimirlatmang"}
      </p>
    </div>
  );
}

function StepRow({ status, label, value, last }: { status: "done" | "spin" | "wait"; label: string; value: string; last?: boolean }) {
  return (
    <>
      <div className="flex items-center gap-3 py-2.5">
        {status === "spin" ? (
          <span className="h-[26px] w-[26px] flex-shrink-0 animate-spin rounded-full border-[3px] border-[var(--ci-indigo-tint)] border-t-[var(--ci-indigo)]" />
        ) : status === "done" ? (
          <span className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full bg-[var(--ci-teal-tint)] text-[var(--ci-teal-text)]">
            <Check className="h-[15px] w-[15px]" strokeWidth={3} />
          </span>
        ) : (
          <span className="h-[26px] w-[26px] flex-shrink-0 rounded-full border-[3px] border-[var(--ci-border)]" />
        )}
        <p className={cn("flex-1 text-sm font-semibold", status === "wait" && "text-[var(--ci-muted)]")}>{label}</p>
        <p className={cn("text-[13px] font-bold tabular-nums", status === "done" ? "text-[var(--ci-teal-text)]" : "text-[var(--ci-muted)]")}>{value}</p>
      </div>
      {!last && <div className="h-px bg-[var(--ci-border)]" />}
    </>
  );
}

function VerifyBottom({
  state, mode, steps, accuracy, onRetry, onBack,
}: {
  state: VerifyState;
  mode: "in" | "out";
  steps: { photoKb: number | null; uploadedMs: number | null };
  accuracy: number | null;
  onRetry: () => void;
  onBack: () => void;
}) {
  if (state === "error") {
    return (
      <div className="flex flex-col gap-2 px-5 pb-1.5 pt-3.5">
        <PrimaryButton tone={mode === "in" ? "indigo" : "orange"} onClick={onRetry} icon={<RefreshCw className="h-5 w-5" />}>
          Qayta urinish
        </PrimaryButton>
        <SecondaryButton onClick={onBack} icon={<X className="h-[18px] w-[18px]" />}>Orqaga</SecondaryButton>
      </div>
    );
  }
  const uploaded = steps.uploadedMs != null;
  return (
    <div className="mx-5 mb-1.5 mt-3.5 rounded-[22px] border border-[var(--ci-border)] bg-[var(--ci-card)] px-[18px] py-1.5">
      {steps.photoKb != null ? (
        <StepRow status="done" label="Surat tayyorlandi" value={`${steps.photoKb} KB`} />
      ) : (
        <StepRow status="done" label="Joylashuv olindi" value={accuracy != null ? `±${Math.round(accuracy)} m` : "✓"} />
      )}
      <StepRow
        status={uploaded ? "done" : "spin"}
        label={uploaded ? "Serverga yuborildi" : "Serverga yuborilmoqda"}
        value={uploaded ? `${((steps.uploadedMs ?? 0) / 1000).toFixed(1)} s` : "…"}
      />
      <StepRow
        status={uploaded ? "spin" : "wait"}
        label={mode === "in" ? "Yuz solishtirilmoqda" : "Joylashuv tekshirilmoqda"}
        value="…"
        last
      />
    </div>
  );
}

// ─── Keldingiz / kun yakunlandi ───────────────────────────────────────────────
function ResultView({
  kind, record, siteName, faceChecked, facePending, shiftEndLabel, leaveAllowedAt, now,
}: {
  kind: "success" | "done";
  record: any;
  siteName: string | null;
  faceChecked: boolean;
  /** Yuz xizmati ishlamagan — check-in qabul qilingan, keyinroq tekshiriladi */
  facePending: boolean;
  shiftEndLabel: string | null;
  leaveAllowedAt: dayjs.Dayjs | null;
  now: dayjs.Dayjs;
}) {
  const done = kind === "done";
  const late = record?.lateMinutes ?? 0;
  const worked = done ? Math.max(0, tzTime(record.checkOut).diff(tzTime(record.checkIn), "minute")) : 0;
  const early = record?.status === "EARLY_LEAVE" || record?.status === "LATE_EARLY";

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center gap-3.5 px-5 py-4">
        <span className="flex h-28 w-28 items-center justify-center rounded-full bg-[var(--ci-teal-tint)]">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--ci-teal)] text-white">
            <Check className="h-10 w-10" strokeWidth={3} />
          </span>
        </span>
        <div className="text-center">
          <p className="text-[15px] font-semibold text-[var(--ci-muted)]">{done ? "Ketdingiz" : "Keldingiz"}</p>
          <p className="text-[56px] font-extrabold leading-[1.05] tracking-[-2px] tabular-nums">
            {fmt(done ? record.checkOut : record.checkIn)}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {done ? (
            <>
              <Chip tone="indigo" icon={<Clock3 className="h-4 w-4" />}>Keldi {fmt(record.checkIn)}</Chip>
              <Chip tone="teal" icon={<Check className="h-4 w-4" />}>Ishlangan {fmtDuration(worked)}</Chip>
              {early && <Chip tone="orange" icon={<AlertTriangle className="h-4 w-4" />}>Erta ketdi</Chip>}
            </>
          ) : (
            <>
              {siteName && <Chip tone="indigo" icon={<MapPin className="h-4 w-4" />}>{siteName}</Chip>}
              {late > 0
                ? <Chip tone="amber" icon={<Clock3 className="h-4 w-4" />}>{late} daq kechikish</Chip>
                : <Chip tone="teal" icon={<Clock3 className="h-4 w-4" />}>Kechikish yo&apos;q</Chip>}
              {faceChecked && <Chip tone="teal" icon={<ShieldCheck className="h-4 w-4" />}>Yuz tasdiqlandi</Chip>}
              {!faceChecked && facePending && (
                <Chip tone="amber" icon={<Clock3 className="h-4 w-4" />}>Yuz keyinroq tekshiriladi</Chip>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mx-5 flex items-center gap-3 rounded-[20px] border border-[var(--ci-border)] bg-[var(--ci-card)] px-4 py-3.5">
        <Tile tone={done ? "teal" : "indigo"}>
          {done ? <Check className="h-[18px] w-[18px]" /> : <Navigation className="h-[18px] w-[18px]" />}
        </Tile>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{done ? "Bugungi ish kuni yakunlandi" : "Ish vaqtida joylashuv kuzatiladi"}</p>
          <p className="text-[12.5px] text-[var(--ci-muted)]">
            {done
              ? "Rahmat! Yaxshi dam oling."
              : leaveAllowedAt && now.isBefore(leaveAllowedAt)
                ? `Ketishni ${leaveAllowedAt.format("HH:mm")} dan keyin belgilash mumkin`
                : shiftEndLabel ? `Smena ${shiftEndLabel} da tugaydi` : "Ketishda shu sahifadan belgilang"}
          </p>
        </div>
      </div>

      <div className="px-5 pb-1.5 pt-3">
        <SecondaryButton href="/dashboard/my-attendance" icon={<ClipboardList className="h-[18px] w-[18px]" />}>
          Davomatimni ko&apos;rish
        </SecondaryButton>
      </div>
    </>
  );
}

// ─── Erta ketish ogohlantirishi (pastdan chiqadigan oyna) ─────────────────────
function EarlyLeaveSheet({ shiftEnd, onConfirm, onCancel }: { shiftEnd: string | null; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Erta ketish">
      <button type="button" aria-label="Yopish" onClick={onCancel} className="absolute inset-0 bg-[rgba(15,18,34,0.45)]" />
      <div className="sheet-safe absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-[28px] bg-[var(--ci-card)] px-5 pt-2.5">
        <div className="mx-auto mb-3 h-[5px] w-10 rounded-full bg-[var(--ci-border)]" />
        <div className="flex items-start gap-3">
          <Tile tone="orange"><AlertTriangle className="h-5 w-5" /></Tile>
          <div>
            <p className="text-[17px] font-extrabold">Ish vaqti hali tugamadi</p>
            <p className="mt-0.5 text-[13px] text-[var(--ci-muted)]">
              Smena {shiftEnd ?? "—"} da tugaydi. Hozir ketsangiz «erta ketdi» deb yoziladi.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 pb-4">
          <PrimaryButton tone="orange" onClick={onConfirm} icon={<LogOut className="h-5 w-5" />}>Baribir ketish</PrimaryButton>
          <SecondaryButton onClick={onCancel} icon={<X className="h-[18px] w-[18px]" />}>Bekor qilish</SecondaryButton>
        </div>
      </div>
    </div>
  );
}
