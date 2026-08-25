/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/auth";
import {
  MapPin,
  Wifi,
  WifiOff,
  Battery,
  Navigation,
  X,
  Clock3,
  Signal,
  Users,
} from "lucide-react";
import { API_ORIGIN } from "@/lib/api";
import dynamic from "next/dynamic";

const MapWithNoSSR = dynamic(
  () => import("@/components/live-map/MapboxMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-[var(--bg-card)]">
        <div className="text-[var(--text-muted)] text-sm">
          Xarita yuklanmoqda...
        </div>
      </div>
    ),
  }
);

export interface EmployeeMarker {
  userId: string;
  name: string;
  photo: string | null;

  latitude: number;
  longitude: number;

  accuracy: number;
  distance: number | null;
  speed: number | null;

  battery: number | null;

  timestamp: string;

  checkIn: string | null;
  checkOut: string | null;
  attendanceStatus: string | null;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function getPhotoUrl(photo: string | null) {
  if (!photo) return null;

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "");

  return `${apiBase}${photo}`;
}

function getBatteryColor(battery: number | null) {
  if (battery === null) {
    return {
      text: "text-white/50",
      bg: "bg-white/10",
      icon: "text-white/50",
    };
  }

  if (battery <= 20) {
    return {
      text: "text-red-400",
      bg: "bg-red-500/10",
      icon: "text-red-400",
    };
  }

  if (battery <= 50) {
    return {
      text: "text-yellow-400",
      bg: "bg-yellow-500/10",
      icon: "text-yellow-400",
    };
  }

  return {
    text: "text-green-400",
    bg: "bg-green-500/10",
    icon: "text-green-400",
  };
}

function getRelativeTime(timestamp: string) {
  const time = new Date(timestamp).getTime();

  if (!Number.isFinite(time)) {
    return "Vaqt noma'lum";
  }

  const diff = Math.max(0, Date.now() - time);

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 10) {
    return "Hozirgina";
  }

  if (seconds < 60) {
    return `${seconds} soniya oldin`;
  }

  if (minutes < 60) {
    return `${minutes} daqiqa oldin`;
  }

  if (hours < 24) {
    return `${hours} soat oldin`;
  }

  return `${Math.floor(hours / 24)} kun oldin`;
}

function formatTime(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function LiveMapPage() {
  const { user, token, selectedHospital } = useAuthStore();

  const selectedHospitalId =
    selectedHospital?.id ?? null;

  const [markers, setMarkers] =
    useState<Map<string, EmployeeMarker>>(
      new Map()
    );

  const [connected, setConnected] =
    useState(false);

  const [selectedUser, setSelectedUser] =
    useState<EmployeeMarker | null>(null);

  const [now, setNow] =
    useState(Date.now());

  const socketRef =
    useRef<Socket | null>(null);

  // ─────────────────────────────────────────
  // Relative time ticker
  // ─────────────────────────────────────────

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  // ─────────────────────────────────────────
  // SOCKET
  // ─────────────────────────────────────────

  useEffect(() => {
    if (!token) return;

    if (!API_ORIGIN) {
      console.error(
        "❌ API_ORIGIN is not defined"
      );
      return;
    }

    const socket = io(
      `${API_ORIGIN}/live-location`,
      {
        transports: [
          "polling",
          "websocket",
        ],
      }
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      if (
        process.env.NODE_ENV ===
        "development"
      ) {
        console.log(
          "🟢 Socket connected:",
          socket.id
        );
      }

      setConnected(true);

      socket.emit("join:admin", {
        token,
      });
    });

    socket.on(
      "disconnect",
      () => {
        setConnected(false);
      }
    );

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "🔴 Socket connection error:",
          error.message
        );

        setConnected(false);
      }
    );

    socket.on(
      "location:update",
      (data: EmployeeMarker) => {
        setMarkers((prev) => {
          const next = new Map(prev);

          next.set(
            data.userId,
            data
          );

          return next;
        });

        setSelectedUser((prev) => {
          if (
            !prev ||
            prev.userId !== data.userId
          ) {
            return prev;
          }

          return data;
        });
      }
    );

    socket.on(
      "location:remove",
      ({
        userId,
      }: {
        userId: string;
      }) => {
        setMarkers((prev) => {
          if (!prev.has(userId)) {
            return prev;
          }

          const next = new Map(prev);

          next.delete(userId);

          return next;
        });

        setSelectedUser((prev) =>
          prev?.userId === userId
            ? null
            : prev
        );
      }
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  // ─────────────────────────────────────────
  // REST INITIAL LOAD + REFRESH
  // ─────────────────────────────────────────

  useEffect(() => {
    if (!token) return;

    const isGlobalRole =
      user?.role === "SUPER_ADMIN" ||
      user?.role === "MINISTRY" ||
      user?.role ===
        "ASSISTANT_ADMIN";

    const hospitalId = isGlobalRole
      ? selectedHospitalId
      : user?.hospitalId;

    if (!hospitalId) {
      return;
    }

    let cancelled = false;

    const loadLocations = async () => {
      try {
        const url =
          `${process.env.NEXT_PUBLIC_API_URL}/location/live` +
          `?hospitalId=${hospitalId}`;

        const response =
          await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`
          );
        }

        const result =
          await response.json();

        if (
          !Array.isArray(result.data)
        ) {
          return;
        }

        if (cancelled) return;

        const next =
          new Map<
            string,
            EmployeeMarker
          >();

        result.data.forEach(
          (
            employee: EmployeeMarker
          ) => {
            next.set(
              employee.userId,
              employee
            );
          }
        );

        setMarkers(next);

        setSelectedUser((prev) => {
          if (
            prev &&
            !next.has(prev.userId)
          ) {
            return null;
          }

          return prev
            ? next.get(
                prev.userId
              ) ?? prev
            : null;
        });
      } catch (error) {
        console.error(
          "❌ REST locations error:",
          error
        );
      }
    };

    loadLocations();

    const interval =
      setInterval(
        loadLocations,
        30000
      );

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [
    token,
    user,
    selectedHospitalId,
  ]);

  // ─────────────────────────────────────────
  // DATA
  // ─────────────────────────────────────────

  const markerList = useMemo(
    () =>
      Array.from(
        markers.values()
      ),
    [markers]
  );

  const selectedFromMarkers =
    selectedUser
      ? markers.get(
          selectedUser.userId
        ) ?? selectedUser
      : null;

  const battery =
    getBatteryColor(
      selectedFromMarkers?.battery ??
        null
    );

  // Force re-render for relative time
  void now;

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────

  return (
    <div
      className="
        relative
        flex
        h-[100dvh]
        md:h-[calc(100vh-2rem)]
        gap-0
        md:gap-4
        p-0
        md:p-4
        overflow-hidden
      "
    >
      {/* ═══════════════════════════════════
          DESKTOP LEFT PANEL
      ═══════════════════════════════════ */}

      <div className="hidden md:flex w-80 flex-col gap-3 flex-shrink-0">
        {/* Header */}

        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm">
          <div>
            <h1 className="text-sm font-black text-[var(--text-primary)]">
              Live Xarita
            </h1>

            <p className="text-xs text-[var(--text-muted)]">
              {markerList.length} ta xodim
              online
            </p>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold ${
              connected
                ? "bg-green-500/10 text-green-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {connected ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}

            {connected
              ? "Ulangan"
              : "Uzilgan"}
          </div>
        </div>

        {/* Employee list */}

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {markerList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-[var(--text-muted)]">
              <MapPin className="w-8 h-8 mb-2 opacity-30" />

              <p className="text-xs">
                Hozir online xodim yo&apos;q
              </p>
            </div>
          ) : (
            markerList.map(
              (emp) => {
                const isSelected =
                  selectedUser?.userId ===
                  emp.userId;

                const empBattery =
                  getBatteryColor(
                    emp.battery
                  );

                return (
                  <button
                    key={
                      emp.userId
                    }
                    onClick={() =>
                      setSelectedUser(
                        emp
                      )
                    }
                    className={`group relative w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl border text-left transition-all duration-300 ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-400/30 text-white shadow-lg shadow-indigo-500/20"
                        : "bg-[var(--bg-card)] border-[var(--border)] hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    {/* Avatar */}

                    <div className="relative flex-shrink-0">
                      <div
                        className={`absolute -inset-1 rounded-xl ${
                          isSelected
                            ? "bg-white/20"
                            : "bg-green-400/0 group-hover:bg-green-400/10"
                        } transition-all`}
                      />

                      <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-indigo-500/20">
                        {emp.photo ? (
                          <img
                            src={
                              getPhotoUrl(
                                emp.photo
                              ) ?? ""
                            }
                            alt={
                              emp.name ??
                              ""
                            }
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-black text-indigo-400">
                            {emp.name
                              ?.charAt(
                                0
                              )
                              .toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* online dot */}

                      <span className="absolute -right-1 -bottom-1 w-3 h-3 rounded-full bg-green-400 border-2 border-[var(--bg-card)]">
                        <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-60" />
                      </span>
                    </div>

                    {/* Name + stats */}

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-bold truncate ${
                          isSelected
                            ? "text-white"
                            : "text-[var(--text-primary)]"
                        }`}
                      >
                        {emp.name}
                      </p>

                      <div className="flex items-center gap-2 mt-1">
                        {emp.battery !==
                          null && (
                          <span
                            className={`text-[10px] flex items-center gap-0.5 ${
                              isSelected
                                ? "text-indigo-100"
                                : empBattery.text
                            }`}
                          >
                            <Battery className="w-3 h-3" />

                            {
                              emp.battery
                            }
                            %
                          </span>
                        )}

                        <span
                          className={`text-[10px] flex items-center gap-0.5 ${
                            isSelected
                              ? "text-indigo-200"
                              : "text-[var(--text-muted)]"
                          }`}
                        >
                          <Navigation className="w-3 h-3" />

                          {emp.distance !==
                            null &&
                          emp.distance !==
                            undefined
                            ? `${emp.distance}m`
                            : `~${Math.round(
                                emp.accuracy
                              )}m`}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              }
            )
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════
          MAP
      ═══════════════════════════════════ */}

      <div className="relative flex-1 min-w-0 rounded-none md:rounded-2xl overflow-hidden border-0 md:border md:border-[var(--border)] shadow-none md:shadow-sm">
        <MapWithNoSSR
          markers={markerList}
          selectedUser={
            selectedFromMarkers
          }
          onMarkerClick={
            setSelectedUser
          }
        />
      </div>

      {/* ═══════════════════════════════════
          MOBILE TOP STATUS
      ═══════════════════════════════════ */}

      <div className="md:hidden absolute top-3 left-3 right-3 z-40 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-black/55 backdrop-blur-xl border border-white/10 px-3 py-2 shadow-xl">
          <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-white/10">
            <MapPin className="w-3.5 h-3.5 text-white" />
          </div>

          <div>
            <p className="text-[11px] font-black text-white leading-none">
              Live Xarita
            </p>

            <p className="text-[9px] text-white/45 mt-1">
              {markerList.length} xodim online
            </p>
          </div>
        </div>

        <div
          className={`pointer-events-auto flex items-center gap-1.5 rounded-2xl backdrop-blur-xl border px-3 py-2 shadow-xl ${
            connected
              ? "bg-green-500/15 border-green-400/20 text-green-400"
              : "bg-red-500/15 border-red-400/20 text-red-400"
          }`}
        >
          {connected ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}

          <span className="text-[10px] font-black">
            {connected
              ? "LIVE"
              : "OFFLINE"}
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════
          MOBILE EMPLOYEE STRIP
      ═══════════════════════════════════ */}

      {markerList.length > 0 && (
        <div className="md:hidden absolute bottom-3 left-0 right-0 z-40 px-3 pointer-events-none">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide pointer-events-auto">
            {markerList.map(
              (emp) => {
                const isSelected =
                  selectedFromMarkers?.userId ===
                  emp.userId;

                return (
                  <button
                    key={
                      emp.userId
                    }
                    onClick={() =>
                      setSelectedUser(
                        emp
                      )
                    }
                    className={`
                      flex-shrink-0
                      flex
                      items-center
                      gap-2
                      rounded-2xl
                      px-2.5
                      py-2
                      backdrop-blur-xl
                      border
                      shadow-lg
                      transition-all
                      duration-300
                      ${
                        isSelected
                          ? "bg-indigo-600/95 border-indigo-300/40 scale-[1.03] shadow-indigo-500/30"
                          : "bg-black/60 border-white/10"
                      }
                    `}
                  >
                    {/* Avatar */}

                    <div className="relative">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-indigo-500/30 border border-white/20">
                        {emp.photo ? (
                          <img
                            src={
                              getPhotoUrl(
                                emp.photo
                              ) ?? ""
                            }
                            alt={
                              emp.name
                            }
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-black text-white">
                            {emp.name
                              ?.charAt(
                                0
                              )
                              .toUpperCase()}
                          </div>
                        )}
                      </div>

                      <span className="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#15151f]">
                        <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-50" />
                      </span>
                    </div>

                    {/* Name */}

                    <div className="max-w-[90px] text-left">
                      <p className="text-[10px] font-bold text-white truncate">
                        {emp.name}
                      </p>

                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[9px] text-green-300">
                          Online
                        </span>

                        {emp.battery !==
                          null && (
                          <>
                            <span className="text-white/20">
                              •
                            </span>

                            <span className="text-[9px] text-white/50">
                              {
                                emp.battery
                              }
                              %
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════
          APPLE FIND MY BOTTOM SHEET
      ═══════════════════════════════════ */}

      {selectedFromMarkers && (
        <div
          className="
            absolute
            z-50
            left-1/2
            -translate-x-1/2
            bottom-2
            md:bottom-6
            w-[calc(100%-1rem)]
            md:w-[min(420px,calc(100%-2rem))]
            max-h-[calc(100dvh-5rem)]
            md:max-h-none
            animate-[slideUp_.35s_cubic-bezier(.22,1,.36,1)]
          "
        >
          <div
            className="
              relative
              overflow-hidden
              rounded-[28px]
              border border-white/15
              bg-[#15151f]/90
              backdrop-blur-2xl
              shadow-[0_20px_80px_rgba(0,0,0,.45)]
            "
          >
            {/* glass highlight */}

            <div className="absolute inset-x-0 top-0 h-px bg-white/20" />

            {/* Mobile drag handle */}

            <div className="md:hidden flex justify-center pt-2">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="p-4 md:p-5 max-h-[calc(100dvh-6rem)] overflow-y-auto scrollbar-hide">
              {/* ═══════════════════════════
                  HEADER
              ═══════════════════════════ */}

              <div className="flex items-center gap-3 md:gap-4">
                {/* Avatar */}

                <div className="relative flex-shrink-0">
                  {/* halo */}

                  <div className="absolute -inset-2 rounded-full bg-green-400/20 animate-pulse" />

                  <div className="absolute -inset-4 rounded-full border border-green-400/10 animate-[ping_2.5s_ease-out_infinite]" />

                  <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-green-400/70 shadow-[0_0_25px_rgba(34,197,94,.25)] bg-indigo-600">
                    {selectedFromMarkers.photo ? (
                      <img
                        src={
                          getPhotoUrl(
                            selectedFromMarkers.photo
                          ) ?? ""
                        }
                        alt={
                          selectedFromMarkers.name
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-black text-xl">
                        {selectedFromMarkers.name
                          ?.charAt(
                            0
                          )
                          .toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* online */}

                  <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-400 border-[3px] border-[#15151f]">
                    <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-60" />
                  </span>
                </div>

                {/* Name */}

                <div className="flex-1 min-w-0">
                  <h2 className="text-sm md:text-base font-black text-white truncate">
                    {
                      selectedFromMarkers.name
                    }
                  </h2>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 text-[10px] md:text-[11px] font-bold text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      Online
                    </span>

                    <span className="text-white/20">
                      •
                    </span>

                    <span className="text-[9px] md:text-[10px] text-white/40 truncate">
                      {
                        getRelativeTime(
                          selectedFromMarkers.timestamp
                        )
                      }
                    </span>
                  </div>
                </div>

                {/* Close */}

                <button
                  onClick={() =>
                    setSelectedUser(
                      null
                    )
                  }
                  className="
                    flex-shrink-0
                    w-8
                    h-8
                    rounded-full
                    flex
                    items-center
                    justify-center
                    bg-white/5
                    hover:bg-white/10
                    active:bg-white/15
                    text-white/50
                    hover:text-white
                    transition-all
                  "
                  aria-label="Yopish"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ═══════════════════════════
                  UPDATED
              ═══════════════════════════ */}

              <div className="flex items-center gap-2 mt-3 md:mt-4 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <Clock3 className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />

                <span className="text-[9px] md:text-[10px] font-medium text-white/45">
                  Yangilandi:
                </span>

                <span className="text-[9px] md:text-[10px] font-bold text-white/75 truncate">
                  {getRelativeTime(
                    selectedFromMarkers.timestamp
                  )}
                </span>

                <span className="ml-auto flex-shrink-0 flex items-center gap-1 text-[9px] text-green-400">
                  <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                  LIVE
                </span>
              </div>

              {/* ═══════════════════════════
                  STATS
              ═══════════════════════════ */}

              <div className="grid grid-cols-3 gap-1.5 md:gap-2 mt-2 md:mt-3">
                {/* Distance */}

                <div className="rounded-2xl bg-white/[0.045] border border-white/[0.06] p-2.5 md:p-3">
                  <div className="flex items-center justify-between">
                    <Navigation className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-400" />

                    <span className="text-[8px] md:text-[9px] text-white/30">
                      GPS
                    </span>
                  </div>

                  <p className="mt-1.5 md:mt-2 text-xs md:text-sm font-black text-white truncate">
                    {selectedFromMarkers.distance !==
                      null &&
                    selectedFromMarkers.distance !==
                      undefined
                      ? `${selectedFromMarkers.distance}m`
                      : `~${Math.round(
                          selectedFromMarkers.accuracy
                        )}m`}
                  </p>

                  <p className="text-[8px] md:text-[9px] text-white/35 font-bold">
                    Masofa
                  </p>
                </div>

                {/* Battery */}

                <div
                  className={`rounded-2xl border border-white/[0.06] p-2.5 md:p-3 ${battery.bg}`}
                >
                  <div className="flex items-center justify-between">
                    <Battery
                      className={`w-3.5 h-3.5 md:w-4 md:h-4 ${battery.icon}`}
                    />

                    <span className="text-[8px] md:text-[9px] text-white/30">
                      POWER
                    </span>
                  </div>

                  <p
                    className={`mt-1.5 md:mt-2 text-xs md:text-sm font-black ${battery.text}`}
                  >
                    {selectedFromMarkers.battery ??
                      "—"}

                    {selectedFromMarkers.battery !==
                    null
                      ? "%"
                      : ""}
                  </p>

                  <p className="text-[8px] md:text-[9px] text-white/35 font-bold">
                    Batareya
                  </p>
                </div>

                {/* Accuracy */}

                <div className="rounded-2xl bg-white/[0.045] border border-white/[0.06] p-2.5 md:p-3">
                  <div className="flex items-center justify-between">
                    <Signal className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-400" />

                    <span className="text-[8px] md:text-[9px] text-white/30">
                      ACC
                    </span>
                  </div>

                  <p className="mt-1.5 md:mt-2 text-xs md:text-sm font-black text-white">
                    ~
                    {Math.round(
                      selectedFromMarkers.accuracy
                    )}
                    m
                  </p>

                  <p className="text-[8px] md:text-[9px] text-white/35 font-bold">
                    Aniqlik
                  </p>
                </div>
              </div>

              {/* ═══════════════════════════
                  ATTENDANCE
              ═══════════════════════════ */}

              <div className="grid grid-cols-2 gap-1.5 md:gap-2 mt-2 md:mt-3">
                <div className="rounded-2xl bg-green-500/[0.06] border border-green-500/10 p-2.5 md:p-3">
                  <p className="text-[8px] md:text-[9px] text-white/35 font-bold">
                    Check-in
                  </p>

                  <p className="mt-1 text-xs md:text-sm font-black text-green-400">
                    {formatTime(
                      selectedFromMarkers.checkIn
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-red-500/[0.04] border border-red-500/10 p-2.5 md:p-3">
                  <p className="text-[8px] md:text-[9px] text-white/35 font-bold">
                    Check-out
                  </p>

                  <p className="mt-1 text-xs md:text-sm font-black text-red-400">
                    {formatTime(
                      selectedFromMarkers.checkOut
                    )}
                  </p>
                </div>
              </div>

              {/* ═══════════════════════════
                  GPS COORDINATES
              ═══════════════════════════ */}

              <div className="mt-2 md:mt-3 flex items-center justify-between gap-3 rounded-xl bg-black/10 px-3 py-2.5">
                <span className="text-[8px] md:text-[9px] font-bold text-white/30">
                  GPS LOCATION
                </span>

                <span className="text-[9px] md:text-[10px] font-mono text-white/60 truncate">
                  {selectedFromMarkers.latitude.toFixed(
                    5
                  )}
                  ,{" "}
                  {selectedFromMarkers.longitude.toFixed(
                    5
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════
          NO EMPLOYEES MOBILE STATE
      ═══════════════════════════════════ */}

      {markerList.length === 0 && (
        <div className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
          <div className="flex flex-col items-center justify-center px-6 py-5 rounded-3xl bg-black/50 backdrop-blur-xl border border-white/10 shadow-xl">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-white/50" />
            </div>

            <p className="text-xs font-bold text-white/70">
              Online xodim yo&apos;q
            </p>

            <p className="text-[10px] text-white/35 mt-1">
              Hozircha faol lokatsiya mavjud emas
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════
          GLOBAL ANIMATIONS
      ═══════════════════════════════════ */}

      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 40px)
              scale(0.97);
          }

          to {
            opacity: 1;
            transform: translate(-50%, 0)
              scale(1);
          }
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
