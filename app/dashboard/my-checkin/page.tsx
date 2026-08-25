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
      <div className="flex h-full items-center justify-center bg-[var(--bg-card)]">
        <div className="text-sm text-[var(--text-muted)]">
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

  if (!apiBase) return photo;

  return `${apiBase}${photo}`;
}

function getBatteryStyle(battery: number | null) {
  if (battery === null || battery === undefined) {
    return {
      text: "text-white/50",
      bg: "bg-white/[0.04]",
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
  const days = Math.floor(hours / 24);

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

  return `${days} kun oldin`;
}

function formatTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDistanceText(employee: EmployeeMarker) {
  if (
    employee.distance !== null &&
    employee.distance !== undefined
  ) {
    return `${employee.distance}m`;
  }

  return `~${Math.round(employee.accuracy)}m`;
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
  // RELATIVE TIME REFRESH
  // ─────────────────────────────────────────

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 10000);

    return () => {
      clearInterval(timer);
    };
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

    socket.on("disconnect", () => {
      setConnected(false);
    });

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
  // REST INITIAL LOAD + FALLBACK
  // ─────────────────────────────────────────

  useEffect(() => {
    if (!token) return;

    const isGlobalRole =
      user?.role === "SUPER_ADMIN" ||
      user?.role === "MINISTRY" ||
      user?.role === "ASSISTANT_ADMIN";

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

          if (!prev) {
            return null;
          }

          return (
            next.get(prev.userId) ??
            prev
          );
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

  /*
   * `now` intentionally used here so the component
   * re-renders every 10 seconds and relative time
   * updates without receiving another location event.
   */
  void now;

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────

  return (
    <div
      className="
        relative
        flex
        h-[calc(100vh-2rem)]
        min-h-0
        gap-4
        overflow-hidden
        p-2
        sm:p-3
        lg:p-4
      "
    >
      {/* ═══════════════════════════════════════
          DESKTOP LEFT PANEL
      ═══════════════════════════════════════ */}

      <aside
        className="
          hidden
          w-80
          flex-shrink-0
          flex-col
          gap-3
          lg:flex
        "
      >
        {/* Header */}

        <div
          className="
            flex
            items-center
            justify-between
            rounded-2xl
            border
            border-[var(--border)]
            bg-[var(--bg-card)]
            px-4
            py-3
            shadow-sm
          "
        >
          <div>
            <h1
              className="
                text-sm
                font-black
                text-[var(--text-primary)]
              "
            >
              Live Xarita
            </h1>

            <p
              className="
                mt-0.5
                text-xs
                text-[var(--text-muted)]
              "
            >
              {markerList.length} ta xodim
              online
            </p>
          </div>

          <div
            className={`
              flex
              items-center
              gap-1.5
              rounded-xl
              px-2.5
              py-1.5
              text-xs
              font-bold
              ${
                connected
                  ? "bg-green-500/10 text-green-400"
                  : "bg-red-500/10 text-red-400"
              }
            `}
          >
            {connected ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}

            {connected
              ? "Ulangan"
              : "Uzilgan"}
          </div>
        </div>

        {/* Employee list */}

        <div
          className="
            min-h-0
            flex-1
            space-y-2
            overflow-y-auto
            pr-1
          "
        >
          {markerList.length === 0 ? (
            <div
              className="
                flex
                h-40
                flex-col
                items-center
                justify-center
                text-[var(--text-muted)]
              "
            >
              <MapPin
                className="
                  mb-2
                  h-8
                  w-8
                  opacity-30
                "
              />

              <p className="text-xs">
                Hozir online xodim yo&apos;q
              </p>
            </div>
          ) : (
            markerList.map((emp) => {
              const isSelected =
                selectedUser?.userId ===
                emp.userId;

              const batteryStyle =
                getBatteryStyle(
                  emp.battery
                );

              return (
                <button
                  key={emp.userId}
                  type="button"
                  onClick={() =>
                    setSelectedUser(
                      emp
                    )
                  }
                  className={`
                    group
                    relative
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-2xl
                    border
                    px-3.5
                    py-3
                    text-left
                    transition-all
                    duration-300
                    ${
                      isSelected
                        ? "border-indigo-400/30 bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                        : "border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)]"
                    }
                  `}
                >
                  {/* Avatar */}

                  <div className="relative flex-shrink-0">
                    <div
                      className={`
                        absolute
                        -inset-1
                        rounded-xl
                        transition-all
                        ${
                          isSelected
                            ? "bg-white/20"
                            : "bg-green-400/0 group-hover:bg-green-400/10"
                        }
                      `}
                    />

                    <div
                      className="
                        relative
                        h-10
                        w-10
                        overflow-hidden
                        rounded-xl
                        bg-indigo-500/20
                      "
                    >
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
                          className="
                            h-full
                            w-full
                            object-cover
                          "
                        />
                      ) : (
                        <div
                          className="
                            flex
                            h-full
                            w-full
                            items-center
                            justify-center
                            text-xs
                            font-black
                            text-indigo-400
                          "
                        >
                          {emp.name
                            ?.charAt(
                              0
                            )
                            .toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Online */}

                    <span
                      className="
                        absolute
                        -bottom-1
                        -right-1
                        h-3
                        w-3
                        rounded-full
                        border-2
                        border-[var(--bg-card)]
                        bg-green-400
                      "
                    >
                      <span
                        className="
                          absolute
                          inset-0
                          rounded-full
                          bg-green-400
                          opacity-60
                          animate-ping
                        "
                      />
                    </span>
                  </div>

                  {/* Name + stats */}

                  <div className="min-w-0 flex-1">
                    <p
                      className={`
                        truncate
                        text-xs
                        font-bold
                        ${
                          isSelected
                            ? "text-white"
                            : "text-[var(--text-primary)]"
                        }
                      `}
                    >
                      {emp.name}
                    </p>

                    <div
                      className="
                        mt-1
                        flex
                        items-center
                        gap-2
                      "
                    >
                      {emp.battery !==
                        null && (
                        <span
                          className={`
                            flex
                            items-center
                            gap-0.5
                            text-[10px]
                            ${
                              isSelected
                                ? "text-indigo-100"
                                : batteryStyle.text
                            }
                          `}
                        >
                          <Battery className="h-3 w-3" />

                          {emp.battery}%
                        </span>
                      )}

                      <span
                        className={`
                          flex
                          items-center
                          gap-0.5
                          text-[10px]
                          ${
                            isSelected
                              ? "text-indigo-200"
                              : "text-[var(--text-muted)]"
                          }
                        `}
                      >
                        <Navigation className="h-3 w-3" />

                        {getDistanceText(
                          emp
                        )}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ═══════════════════════════════════════
          MAP
      ═══════════════════════════════════════ */}

      <main
        className="
          relative
          min-h-0
          flex-1
          overflow-hidden
          rounded-2xl
          border
          border-[var(--border)]
          shadow-sm
        "
      >
        <MapWithNoSSR
          markers={markerList}
          selectedUser={
            selectedFromMarkers
          }
          onMarkerClick={
            setSelectedUser
          }
        />

        {/* Mobile connection badge */}

        <div
          className="
            absolute
            left-3
            top-3
            z-40
            flex
            items-center
            gap-2
            rounded-full
            border
            border-white/10
            bg-black/45
            px-3
            py-2
            backdrop-blur-xl
            lg:hidden
          "
        >
          <span
            className={`
              h-2
              w-2
              rounded-full
              ${
                connected
                  ? "bg-green-400 shadow-[0_0_10px_rgba(34,197,94,.8)]"
                  : "bg-red-400"
              }
            `}
          />

          <span className="text-[10px] font-bold text-white/80">
            {connected
              ? "LIVE"
              : "OFFLINE"}
          </span>
        </div>

        {/* Mobile employee count */}

        <div
          className="
            absolute
            right-3
            top-3
            z-40
            flex
            items-center
            gap-1.5
            rounded-full
            border
            border-white/10
            bg-black/45
            px-3
            py-2
            backdrop-blur-xl
            lg:hidden
          "
        >
          <Users className="h-3.5 w-3.5 text-white/70" />

          <span className="text-[10px] font-bold text-white/80">
            {markerList.length}
          </span>
        </div>

        {/* ═══════════════════════════════════
            MOBILE EMPLOYEE STRIP
        ═══════════════════════════════════ */}

        <div
          className="
            absolute
            inset-x-0
            bottom-0
            z-40
            px-3
            pb-3
            lg:hidden
          "
        >
          <div
            className="
              flex
              gap-2
              overflow-x-auto
              pb-1
              scrollbar-none
            "
          >
            {markerList.map((emp) => {
              const isSelected =
                selectedUser?.userId ===
                emp.userId;

              return (
                <button
                  key={emp.userId}
                  type="button"
                  onClick={() =>
                    setSelectedUser(
                      emp
                    )
                  }
                  className={`
                    flex
                    min-w-[150px]
                    items-center
                    gap-2.5
                    rounded-2xl
                    border
                    px-2.5
                    py-2
                    text-left
                    backdrop-blur-2xl
                    transition-all
                    ${
                      isSelected
                        ? "border-indigo-400/50 bg-indigo-600/90 shadow-lg shadow-indigo-500/30"
                        : "border-white/10 bg-black/55"
                    }
                  `}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className="
                        h-9
                        w-9
                        overflow-hidden
                        rounded-full
                        border
                        border-white/20
                        bg-indigo-500
                      "
                    >
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
                          className="
                            h-full
                            w-full
                            object-cover
                          "
                        />
                      ) : (
                        <div
                          className="
                            flex
                            h-full
                            w-full
                            items-center
                            justify-center
                            text-xs
                            font-black
                            text-white
                          "
                        >
                          {emp.name
                            ?.charAt(
                              0
                            )
                            .toUpperCase()}
                        </div>
                      )}
                    </div>

                    <span
                      className="
                        absolute
                        -bottom-0.5
                        -right-0.5
                        h-2.5
                        w-2.5
                        rounded-full
                        border-2
                        border-black/50
                        bg-green-400
                      "
                    />
                  </div>

                  <div className="min-w-0">
                    <p
                      className="
                        max-w-[100px]
                        truncate
                        text-[11px]
                        font-black
                        text-white
                      "
                    >
                      {emp.name}
                    </p>

                    <p className="mt-0.5 text-[9px] text-white/50">
                      {getDistanceText(
                        emp
                      )}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* ═══════════════════════════════════════
          APPLE FIND MY BOTTOM SHEET
      ═══════════════════════════════════════ */}

      {selectedFromMarkers && (
        <div
          key={
            selectedFromMarkers.userId
          }
          className="
            absolute
            inset-x-0
            bottom-0
            z-50
            flex
            justify-center
            px-2
            pb-2
            sm:px-4
            sm:pb-4
            lg:inset-x-auto
            lg:left-1/2
            lg:-translate-x-1/2
            lg:bottom-6
            lg:px-0
            lg:pb-0
          "
        >
          <div
            className="
              w-full
              max-w-[520px]
              animate-[sheetUp_.38s_cubic-bezier(.22,1,.36,1)]
              lg:w-[520px]
            "
          >
            <div
              className="
                relative
                overflow-hidden
                rounded-[28px]
                border
                border-white/15
                bg-[#15151f]/90
                shadow-[0_20px_80px_rgba(0,0,0,.5)]
                backdrop-blur-2xl
                sm:rounded-[30px]
              "
            >
              {/* Glass highlight */}

              <div
                className="
                  absolute
                  inset-x-0
                  top-0
                  h-px
                  bg-white/20
                "
              />

              {/* Mobile drag handle */}

              <div
                className="
                  mx-auto
                  mt-2
                  h-1
                  w-10
                  rounded-full
                  bg-white/20
                  lg:hidden
                "
              />

              <div className="p-4 sm:p-5">
                {/* ═══════════════════════════
                    HEADER
                ═══════════════════════════ */}

                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Avatar */}

                  <div className="relative flex-shrink-0">
                    <div
                      className="
                        absolute
                        -inset-2
                        rounded-full
                        bg-green-400/20
                        animate-pulse
                      "
                    />

                    <div
                      className="
                        absolute
                        -inset-4
                        rounded-full
                        border
                        border-green-400/10
                        animate-[ping_2.5s_ease-out_infinite]
                      "
                    />

                    <div
                      className="
                        relative
                        h-14
                        w-14
                        overflow-hidden
                        rounded-full
                        border-2
                        border-green-400/70
                        bg-indigo-600
                        shadow-[0_0_25px_rgba(34,197,94,.25)]
                        sm:h-16
                        sm:w-16
                      "
                    >
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
                          className="
                            h-full
                            w-full
                            object-cover
                          "
                        />
                      ) : (
                        <div
                          className="
                            flex
                            h-full
                            w-full
                            items-center
                            justify-center
                            text-xl
                            font-black
                            text-white
                          "
                        >
                          {selectedFromMarkers.name
                            ?.charAt(
                              0
                            )
                            .toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Online */}

                    <span
                      className="
                        absolute
                        bottom-0
                        right-0
                        h-4
                        w-4
                        rounded-full
                        border-[3px]
                        border-[#15151f]
                        bg-green-400
                      "
                    >
                      <span
                        className="
                          absolute
                          inset-0
                          rounded-full
                          bg-green-400
                          opacity-60
                          animate-ping
                        "
                      />
                    </span>
                  </div>

                  {/* Name */}

                  <div className="min-w-0 flex-1">
                    <h2
                      className="
                        truncate
                        text-sm
                        font-black
                        text-white
                        sm:text-base
                      "
                    >
                      {
                        selectedFromMarkers.name
                      }
                    </h2>

                    <div
                      className="
                        mt-1
                        flex
                        items-center
                        gap-2
                      "
                    >
                      <span
                        className="
                          inline-flex
                          items-center
                          gap-1
                          text-[10px]
                          font-bold
                          text-green-400
                          sm:text-[11px]
                        "
                      >
                        <span
                          className="
                            h-1.5
                            w-1.5
                            rounded-full
                            bg-green-400
                            animate-pulse
                          "
                        />

                        Online
                      </span>

                      <span className="text-white/20">
                        •
                      </span>

                      <span className="truncate text-[9px] text-white/40 sm:text-[10px]">
                        {getRelativeTime(
                          selectedFromMarkers.timestamp
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Close */}

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedUser(
                        null
                      )
                    }
                    className="
                      flex
                      h-8
                      w-8
                      flex-shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-white/5
                      text-white/50
                      transition-all
                      hover:bg-white/10
                      hover:text-white
                    "
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* ═══════════════════════════
                    LAST UPDATE
                ═══════════════════════════ */}

                <div
                  className="
                    mt-3
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-white/[0.06]
                    bg-white/[0.04]
                    px-3
                    py-2
                  "
                >
                  <Clock3 className="h-3.5 w-3.5 flex-shrink-0 text-white/40" />

                  <span className="text-[9px] font-medium text-white/40 sm:text-[10px]">
                    Joylashuv:
                  </span>

                  <span className="text-[9px] font-bold text-white/75 sm:text-[10px]">
                    {getRelativeTime(
                      selectedFromMarkers.timestamp
                    )}
                  </span>

                  <span
                    className="
                      ml-auto
                      flex
                      items-center
                      gap-1
                      text-[8px]
                      font-bold
                      text-green-400
                      sm:text-[9px]
                    "
                  >
                    <span
                      className="
                        h-1
                        w-1
                        rounded-full
                        bg-green-400
                        animate-pulse
                      "
                    />

                    LIVE
                  </span>
                </div>

                {/* ═══════════════════════════
                    STATS
                ═══════════════════════════ */}

                <div className="mt-2 grid grid-cols-3 gap-2 sm:mt-3">
                  {/* Distance */}

                  <div
                    className="
                      rounded-2xl
                      border
                      border-white/[0.06]
                      bg-white/[0.045]
                      p-2.5
                      sm:p-3
                    "
                  >
                    <div className="flex items-center justify-between">
                      <Navigation className="h-3.5 w-3.5 text-green-400 sm:h-4 sm:w-4" />

                      <span className="text-[8px] text-white/30 sm:text-[9px]">
                        GPS
                      </span>
                    </div>

                    <p className="mt-1.5 text-xs font-black text-white sm:mt-2 sm:text-sm">
                      {getDistanceText(
                        selectedFromMarkers
                      )}
                    </p>

                    <p className="text-[8px] font-bold text-white/35 sm:text-[9px]">
                      Masofa
                    </p>
                  </div>

                  {/* Battery */}

                  {(() => {
                    const batteryStyle =
                      getBatteryStyle(
                        selectedFromMarkers.battery
                      );

                    return (
                      <div
                        className={`
                          rounded-2xl
                          border
                          border-white/[0.06]
                          p-2.5
                          sm:p-3
                          ${batteryStyle.bg}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <Battery
                            className={`
                              h-3.5
                              w-3.5
                              sm:h-4
                              sm:w-4
                              ${batteryStyle.icon}
                            `}
                          />

                          <span className="text-[8px] text-white/30 sm:text-[9px]">
                            POWER
                          </span>
                        </div>

                        <p
                          className={`
                            mt-1.5
                            text-xs
                            font-black
                            sm:mt-2
                            sm:text-sm
                            ${batteryStyle.text}
                          `}
                        >
                          {selectedFromMarkers.battery ??
                            "—"}

                          {selectedFromMarkers.battery !==
                            null &&
                          selectedFromMarkers.battery !==
                            undefined
                            ? "%"
                            : ""}
                        </p>

                        <p className="text-[8px] font-bold text-white/35 sm:text-[9px]">
                          Batareya
                        </p>
                      </div>
                    );
                  })()}

                  {/* Accuracy */}

                  <div
                    className="
                      rounded-2xl
                      border
                      border-white/[0.06]
                      bg-white/[0.045]
                      p-2.5
                      sm:p-3
                    "
                  >
                    <div className="flex items-center justify-between">
                      <Signal className="h-3.5 w-3.5 text-cyan-400 sm:h-4 sm:w-4" />

                      <span className="text-[8px] text-white/30 sm:text-[9px]">
                        ACC
                      </span>
                    </div>

                    <p className="mt-1.5 text-xs font-black text-white sm:mt-2 sm:text-sm">
                      ~
                      {Math.round(
                        selectedFromMarkers.accuracy
                      )}
                      m
                    </p>

                    <p className="text-[8px] font-bold text-white/35 sm:text-[9px]">
                      Aniqlik
                    </p>
                  </div>
                </div>

                {/* ═══════════════════════════
                    ATTENDANCE
                ═══════════════════════════ */}

                <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3">
                  <div
                    className="
                      rounded-2xl
                      border
                      border-green-500/10
                      bg-green-500/[0.06]
                      p-2.5
                      sm:p-3
                    "
                  >
                    <p className="text-[8px] font-bold text-white/35 sm:text-[9px]">
                      Check-in
                    </p>

                    <p className="mt-1 text-xs font-black text-green-400 sm:text-sm">
                      {formatTime(
                        selectedFromMarkers.checkIn
                      )}
                    </p>
                  </div>

                  <div
                    className="
                      rounded-2xl
                      border
                      border-red-500/10
                      bg-red-500/[0.04]
                      p-2.5
                      sm:p-3
                    "
                  >
                    <p className="text-[8px] font-bold text-white/35 sm:text-[9px]">
                      Check-out
                    </p>

                    <p className="mt-1 text-xs font-black text-red-400 sm:text-sm">
                      {formatTime(
                        selectedFromMarkers.checkOut
                      )}
                    </p>
                  </div>
                </div>

                {/* ═══════════════════════════
                    GPS
                ═══════════════════════════ */}

                <div
                  className="
                    mt-2
                    flex
                    items-center
                    justify-between
                    rounded-xl
                    bg-black/10
                    px-3
                    py-2
                    sm:mt-3
                    sm:py-2.5
                  "
                >
                  <span className="text-[8px] font-bold text-white/30 sm:text-[9px]">
                    GPS LOCATION
                  </span>

                  <span className="text-[8px] font-mono text-white/60 sm:text-[10px]">
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
        </div>
      )}

      {/* ═══════════════════════════════════════
          GLOBAL ANIMATIONS
      ═══════════════════════════════════════ */}

      <style jsx global>{`
        @keyframes sheetUp {
          from {
            opacity: 0;
            transform: translateY(45px) scale(0.97);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .scrollbar-none {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }

        @media (max-width: 640px) {
          @keyframes sheetUp {
            from {
              opacity: 0;
              transform: translateY(100%);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        }
      `}</style>
    </div>
  );
}
