"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_ORIGIN, photoThumbUrl } from "@/lib/api";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";
import { LogIn, LogOut, Wifi, WifiOff } from "lucide-react";
import dayjs from "dayjs";

/** Kartochkada saqlanadigan hodisalar soni */
const MAX_EVENTS = 25;

interface AttendanceEvent {
  id: string;
  action: "CHECK_IN" | "CHECK_OUT";
  at?: string;
  employee: {
    id: string;
    fullName: string;
    photoUrl?: string | null;
    department?: string | null;
    position?: string | null;
  };
  lateMinutes?: number;
  earlyLeaveMin?: number;
  status?: string;
}

/**
 * "hozirgina" / "5 daq oldin" — soat yonida QO'SHIMCHA izoh sifatida.
 *
 * ⚠️ 1 soatdan oshganda bo'sh qaytaradi: aks holda soat ikki marta
 * chiqib qolardi ("18:31 18:31").
 */
function relTime(iso?: string): string {
  if (!iso) return "";
  const diffSec = Math.max(0, dayjs().diff(dayjs(iso), "second"));
  if (diffSec < 45) return "hozirgina";
  const min = Math.round(diffSec / 60);
  if (min < 60) return `${min} daq oldin`;
  return "";
}

/**
 * Dashboard `overview.todayAttendances` yozuvlarini tasma hodisalariga o'giradi.
 * Bitta davomat yozuvi ikkita hodisa berishi mumkin: keldi va ketdi.
 */
function normalizeInitial(records?: any[]): AttendanceEvent[] {
  if (!Array.isArray(records)) return [];
  const out: AttendanceEvent[] = [];

  for (const r of records) {
    const employee = {
      id: r.employeeId ?? r.id,
      fullName: r.employeeName ?? r.employee?.fullName ?? "—",
      photoUrl: r.photoUrl ?? r.employee?.photoUrl ?? null,
      department: r.department ?? r.employee?.department?.name ?? null,
      position: r.position ?? r.employee?.position?.name ?? null,
    };
    if (r.checkIn) {
      out.push({
        id: `${r.id}-CHECK_IN`,
        action: "CHECK_IN",
        at: r.checkIn,
        employee,
        lateMinutes: r.lateMinutes ?? 0,
        status: r.status,
      });
    }
    if (r.checkOut) {
      out.push({
        id: `${r.id}-CHECK_OUT`,
        action: "CHECK_OUT",
        at: r.checkOut,
        employee,
        earlyLeaveMin: r.earlyLeaveMin ?? 0,
        status: r.status,
      });
    }
  }

  // Eng yangisi tepada
  return out
    .sort((a, b) => dayjs(b.at).valueOf() - dayjs(a.at).valueOf())
    .slice(0, MAX_EVENTS);
}

/**
 * Dashboarddagi jonli "Keldi / Ketdi" tasmasi.
 *
 * Backend har bir check-in/check-out da `attendance:event` yuboradi
 * (/live-location namespace, live-map bilan bir xil ulanish).
 * Polling yo'q — ma'lumot o'zi keladi.
 */
export default function RealtimeAttendanceFeed({
  initialEvents,
}: {
  /** Sahifa ochilganda ko'rsatiladigan bugungi davomat yozuvlari */
  initialEvents?: any[];
}) {
  const seeded = useMemo(() => normalizeInitial(initialEvents), [initialEvents]);
  const [events, setEvents] = useState<AttendanceEvent[]>(seeded);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  // Vaqt yozuvlari ("hozirgina") o'z-o'zidan yangilanishi uchun
  const [, forceTick] = useState(0);

  // Boshlang'ich ro'yxat kechroq kelsa (so'rov tugagach) — o'rnatamiz.
  // Socket orqali kelgan yangi hodisalar ustiga yozib yubormaslik uchun
  // faqat tasma bo'sh bo'lganda to'ldiriladi.
  useEffect(() => {
    if (seeded.length) {
      setEvents((prev) => (prev.length ? prev : seeded));
    }
  }, [seeded]);

  useEffect(() => {
    const timer = setInterval(() => forceTick((t) => t + 1), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token || !API_ORIGIN) return;

    const socket = io(`${API_ORIGIN}/live-location`, {
      transports: ["polling", "websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join:admin", { token });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    socket.on("attendance:event", (ev: AttendanceEvent) => {
      setEvents((prev) => {
        // Bir hodisa ikki marta kelib qolmasligi uchun
        if (prev.some((p) => p.id === ev.id)) return prev;
        return [ev, ...prev].slice(0, MAX_EVENTS);
      });
    });

    return () => {
      socket.off("attendance:event");
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const summary = useMemo(() => {
    const today = dayjs().format("YYYY-MM-DD");
    const todays = events.filter((e) => !e.at || dayjs(e.at).format("YYYY-MM-DD") === today);
    return {
      in: todays.filter((e) => e.action === "CHECK_IN").length,
      out: todays.filter((e) => e.action === "CHECK_OUT").length,
    };
  }, [events]);

  return (
    <div className="card p-5 hover:border-indigo-500/20 transition-all duration-300 flex flex-col">
      {/* Sarlavha + ulanish holati */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] text-base flex items-center gap-2">
            Keldi / Ketdi
            <span className="relative flex h-2 w-2">
              {connected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  connected ? "bg-emerald-500" : "bg-slate-400"
                )}
              />
            </span>
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
            {connected ? (
              <><Wifi className="w-3 h-3" /> Jonli — real vaqtda</>
            ) : (
              <><WifiOff className="w-3 h-3" /> Ulanish kutilmoqda...</>
            )}
          </p>
        </div>
        <div className="flex gap-1.5 text-[11px] font-semibold">
          <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            ↓ {summary.in}
          </span>
          <span className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            ↑ {summary.out}
          </span>
        </div>
      </div>

      {/* Hodisalar tasmasi */}
      <div className="space-y-2 overflow-y-auto max-h-[230px] pr-1">
        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[var(--bg-hover)] flex items-center justify-center">
              <LogIn className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Hozircha harakat yo&apos;q
            </p>
            <p className="text-[11px] text-[var(--text-muted)] opacity-70">
              Xodim terminaldan o&apos;tishi bilan shu yerda paydo bo&apos;ladi
            </p>
          </div>
        )}

        {events.map((ev) => {
          const isIn = ev.action === "CHECK_IN";
          const late = (ev.lateMinutes ?? 0) > 0;
          const early = (ev.earlyLeaveMin ?? 0) > 0;
          const thumb = photoThumbUrl(ev.employee.photoUrl);

          return (
            <div
              key={ev.id}
              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-[var(--border)]">
                {thumb ? (
                  <img
                    src={thumb}
                    alt={ev.employee.fullName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div
                    className={cn(
                      "w-full h-full flex items-center justify-center text-[10px] font-bold text-white",
                      getAvatarColor(ev.employee.fullName)
                    )}
                  >
                    {getInitials(ev.employee.fullName)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                  {ev.employee.fullName}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] truncate">
                  {ev.employee.department ?? "—"}
                  {late && <span className="ml-1 text-amber-500">· {ev.lateMinutes} daq kech</span>}
                  {early && <span className="ml-1 text-rose-500">· {ev.earlyLeaveMin} daq erta</span>}
                </p>
              </div>

              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border",
                    isIn
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                  )}
                >
                  {isIn ? <LogIn className="w-2.5 h-2.5" /> : <LogOut className="w-2.5 h-2.5" />}
                  {isIn ? "Keldi" : "Ketdi"}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  {ev.at ? dayjs(ev.at).format("HH:mm") : ""}
                  {relTime(ev.at) && (
                    <span className="ml-1 opacity-60">{relTime(ev.at)}</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
