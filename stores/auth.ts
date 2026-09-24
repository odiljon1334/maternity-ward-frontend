/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  username: string;
  role: string;
  lang: string;
  hospitalId?: string | null;
  hospital?: { id: string; name: string; code: string; gpsLat?: number | null; gpsLng?: number | null; gpsRadius?: number | null } | null;
  employee?: any;
}

interface AuthStore {
  user: User | null;
  // SUPER_ADMIN uchun tanlab olingan kasalxona
  selectedHospital: { id: string; name: string; code: string } | null;
  setAuth: (user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  setSelectedHospital: (h: { id: string; name: string; code: string } | null) => void;
  updateHospitalGps: (lat: number, lng: number) => void;
  updateEmployeeGps: (lat: number, lng: number) => void;
}

function clearAuthCookie() {
  if (typeof document === "undefined") return;
  // 2026-09-21gacha ishlatilgan JavaScript cookie'ni migrationdan keyin o'chiramiz.
  document.cookie = "auth_token=; path=/; max-age=0";
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      selectedHospital: null,
      setAuth: (user) => set({ user }),
      logout: () => {
        set({ user: null, selectedHospital: null });
        if (typeof window !== "undefined") {
          localStorage.removeItem("user");
          // Avval push obunasi (sessiya hali yaroqli) va SW keshi tozalanadi,
          // so'ng sessiya yopiladi
          void import("../lib/session-cleanup")
            .then(({ clearDeviceSession }) => clearDeviceSession({ notifyServer: true }))
            .catch(() => undefined)
            .finally(() => {
              void fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1"}/auth/logout`, {
                method: "POST",
                credentials: "include",
                keepalive: true,
              });
            });
          import('../providers').then(({ globalQueryClient }) => {
            globalQueryClient?.clear();
          });
        }
        clearAuthCookie();
      },
      isAuthenticated: () => !!get().user,
      setSelectedHospital: (h) => set({ selectedHospital: h }),
      updateHospitalGps: (lat: number, lng: number) => {
        const user = get().user;
        if (!user) return;
        set({
          user: {
            ...user,
            hospital: user.hospital ? { ...user.hospital, gpsLat: lat, gpsLng: lng } : user.hospital,
          },
        });
      },
      updateEmployeeGps: (lat: number, lng: number) => {
        const user = get().user;
        if (!user) return;
        set({
          user: {
            ...user,
            employee: user.employee
              ? { ...user.employee, gpsLat: lat, gpsLng: lng }
              : user.employee,
          },
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state: AuthStore) => ({
        user: state.user,
        selectedHospital: state.selectedHospital,
      }),
      version: 2,
      migrate: (persisted: unknown) => {
        const old = persisted as { user?: User | null; selectedHospital?: AuthStore["selectedHospital"] };
        return { user: old.user ?? null, selectedHospital: old.selectedHospital ?? null };
      },
      onRehydrateStorage: () => () => {
        if (typeof window === "undefined") return;
        const legacyToken = localStorage.getItem("access_token");
        if (legacyToken) {
          void fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1"}/auth/browser-session`, {
            method: "POST",
            headers: { Authorization: `Bearer ${legacyToken}` },
            credentials: "include",
          }).finally(() => {
            localStorage.removeItem("access_token");
            clearAuthCookie();
          });
        } else {
          clearAuthCookie();
        }
      },
    }
  )
);
