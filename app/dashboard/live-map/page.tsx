/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/auth";
import { MapPin, Wifi, WifiOff, Battery, Navigation } from "lucide-react";
import dynamic from "next/dynamic";

// SSR muammosini hal qilish
const MapWithNoSSR = dynamic(() => import("@/components/live-map/MapboxMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[var(--bg-card)]">
      <div className="text-[var(--text-muted)] text-sm">Xarita yuklanmoqda...</div>
    </div>
  ),
});

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

export default function LiveMapPage() {
  const { user, token, selectedHospital } = useAuthStore();
  const selectedHospitalId = selectedHospital?.id ?? null;
  const [markers, setMarkers] = useState<Map<string, EmployeeMarker>>(new Map());
  const [connected, setConnected] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EmployeeMarker | null>(null);
  const socketRef = useRef<Socket | null>(null);

 useEffect(() => {
  if (!token) return;

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "");

  if (!apiUrl) {
    console.error("❌ NEXT_PUBLIC_API_URL is not defined");
    return;
  }

  const socket = io(`${apiUrl}/live-location`, {
    transports: ["polling", "websocket"],
  });

  socketRef.current = socket;

  socket.on("connect", () => {
    if (process.env.NODE_ENV === "development") {
      console.log("🟢 Socket connected:", socket.id);
    }
    setConnected(true);
    socket.emit("join:admin", { token });
  });

  socket.on("connect_error", (error) => {
    console.error("🔴 Socket connection error:", error.message);
    setConnected(false);
  });

  socket.on("location:update", (data: EmployeeMarker) => {
    setMarkers((prev) => {
      const next = new Map(prev);
      next.set(data.userId, data);
      return next;
    });
  });

  // Xodim check-out qilganda backend shu eventni yuboradi —
  // markerni xaritadan darhol olib tashlaymiz (sahifa yangilanishini kutmasdan)
  socket.on("location:remove", ({ userId }: { userId: string }) => {
    setMarkers((prev) => {
      if (!prev.has(userId)) return prev;
      const next = new Map(prev);
      next.delete(userId);
      return next;
    });
    setSelectedUser((prev) => (prev?.userId === userId ? null : prev));
  });

  return () => {
    socket.disconnect();
  };
}, [token]);

useEffect(() => {
  if (!token) return;

  // SUPER_ADMIN / MINISTRY / ASSISTANT_ADMIN
  // tanlangan hospital bo'yicha ishlaydi
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

  const loadLocations = async () => {
    try {
      const url =
        `${process.env.NEXT_PUBLIC_API_URL}/location/live` +
        `?hospitalId=${hospitalId}`;
      const r = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const res = await r.json();
      if (!Array.isArray(res.data)) {
        return;
      }

      // REST'dan kelgan ma'lumot — hozirgi haqiqiy holat. To'liq almashtiramiz
      // (faqat merge qilmaymiz), aks holda backend endi qaytarmayotgan
      // (masalan check-out qilgan) xodim markeri abadiy osilib qolaveradi.
      const next = new Map<string, EmployeeMarker>();
      res.data.forEach((employee: EmployeeMarker) => {
        next.set(employee.userId, employee);
      });
      setMarkers(next);
      setSelectedUser((prev) =>
        prev && !next.has(prev.userId) ? null : prev
      );
    } catch (error) {
      console.error("❌ REST locations error:", error);
    }
  };

  // Birinchi marta darhol
  loadLocations();

  // Keyin har 5 sekund
  const interval = setInterval(loadLocations, 5000);

  return () => {
    clearInterval(interval);
  };
}, [token, user, selectedHospitalId]);

  const markerList = Array.from(markers.values());

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-4 p-4 relative">
      {/* Left panel — xodimlar ro'yxati */}
      <div className="w-80 flex flex-col gap-3 flex-shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]">
          <div>
            <h1 className="text-sm font-black text-[var(--text-primary)]">Live Xarita</h1>
            <p className="text-xs text-[var(--text-muted)]">{markerList.length} ta xodim online</p>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold ${connected ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? "Ulangan" : "Uzilgan"}
          </div>
        </div>

        {/* Xodimlar ro'yxati */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {markerList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-[var(--text-muted)]">
              <MapPin className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">Hozir online xodim yo&apos;q</p>
            </div>
          ) : (
            markerList.map((emp) => (
              <button
                key={emp.userId}
                onClick={() => setSelectedUser(emp)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl border text-left transition-all ${
                  selectedUser?.userId === emp.userId
                    ? "bg-indigo-600 border-indigo-400/30 text-white"
                    : "bg-[var(--bg-card)] border-[var(--border)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-indigo-500/20">
                  {emp.photo ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "")}${emp.photo}`}
                      alt={emp.name ?? ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-black text-indigo-400">
                      {emp.name?.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold truncate ${selectedUser?.userId === emp.userId ? "text-white" : "text-[var(--text-primary)]"}`}>
                    {emp.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {emp.battery !== null && (
                      <span className={`text-[10px] flex items-center gap-0.5 ${selectedUser?.userId === emp.userId ? "text-indigo-200" : "text-[var(--text-muted)]"}`}>
                        <Battery className="w-3 h-3" />
                        {emp.battery}%
                      </span>
                    )}
                    <span className={`text-[10px] flex items-center gap-0.5 ${selectedUser?.userId === emp.userId ? "text-indigo-200" : "text-[var(--text-muted)]"}`}>
                      <Navigation className="w-3 h-3" />
                      {emp.distance !== null && emp.distance !== undefined ? `${emp.distance}m` : `~${Math.round(emp.accuracy)}m`}
                    </span>
                  </div>
                </div>

                <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 shadow-sm shadow-green-400" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right — Xarita */}
      <div className="flex-1 rounded-2xl overflow-hidden border border-[var(--border)]">
        <MapWithNoSSR
          markers={markerList}
          selectedUser={selectedUser}
          onMarkerClick={setSelectedUser}
        />
      </div>
      {/* Floating Card — xodim tanlanganda */}
{selectedUser && (
  <div className="absolute bottom-8 right-8 z-50 w-80 rounded-2xl bg-[#1c1c2e]/90 backdrop-blur-xl border border-white/10 shadow-2xl p-4">
    {/* Header */}
    <div className="flex items-center gap-3 mb-4">
      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 border-green-500/50">
        {selectedUser.photo ? (
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "")}${selectedUser.photo}`}
            alt={selectedUser.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white font-black text-xl">
            {selectedUser.name?.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-white truncate">{selectedUser.name}</p>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Online
        </span>
      </div>
      <button
        onClick={() => setSelectedUser(null)}
        className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all"
      >
        ✕
      </button>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-2 gap-2 mb-3">
      <div className="bg-white/5 rounded-xl p-3 text-center">
        <Navigation className="w-4 h-4 text-green-400 mx-auto mb-1" />
        <p className="text-sm font-black text-white">
          {selectedUser.distance !== null && selectedUser.distance !== undefined
            ? `${selectedUser.distance}m`
            : `~${Math.round(selectedUser.accuracy)}m`}
        </p>
        <p className="text-[10px] text-white/40 font-bold">Masofa</p>
      </div>
      <div className="bg-white/5 rounded-xl p-3 text-center">
        <Battery className="w-4 h-4 text-green-400 mx-auto mb-1" />
        <p className="text-sm font-black text-white">{selectedUser.battery ?? "—"}%</p>
        <p className="text-[10px] text-white/40 font-bold">Batareya</p>
      </div>
    </div>

    {/* Check-in / Check-out */}
<div className="grid grid-cols-2 gap-2 mb-3">
  <div className="bg-white/5 rounded-xl p-3 text-center">
    <p className="text-[10px] text-white/40 font-bold mb-1">Check-in</p>
    <p className="text-sm font-black text-green-400">
      {selectedUser.checkIn
        ? new Date(selectedUser.checkIn).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
        : "—"}
    </p>
  </div>
  <div className="bg-white/5 rounded-xl p-3 text-center">
    <p className="text-[10px] text-white/40 font-bold mb-1">Check-out</p>
    <p className="text-sm font-black text-red-400">
      {selectedUser.checkOut
        ? new Date(selectedUser.checkOut).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
        : "—"}
    </p>
  </div>
</div>

    {/* GPS */}
    <div className="bg-white/5 rounded-xl px-3 py-2 flex items-center justify-between">
      <span className="text-[11px] text-white/40 font-bold">GPS</span>
      <span className="text-[11px] text-white/70 font-mono">
        {selectedUser.latitude.toFixed(4)}, {selectedUser.longitude.toFixed(4)}
      </span>
    </div>
  </div>
)}
    </div>
  );
}
