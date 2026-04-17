"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  username: string;
  role: string;
  lang: string;
  hospitalId?: string | null;
  hospital?: { id: string; name: string; code: string } | null;
  employee?: any;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  // SUPER_ADMIN uchun tanlab olingan kasalxona
  selectedHospital: { id: string; name: string; code: string } | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  setSelectedHospital: (h: { id: string; name: string; code: string } | null) => void;
}

/** Next.js middleware uchun cookie saqlash yordamchisi */
function setAuthCookie(token: string) {
  if (typeof document === "undefined") return;
  const maxAge = 14 * 24 * 60 * 60; // 14 kun
  document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearAuthCookie() {
  if (typeof document === "undefined") return;
  document.cookie = "auth_token=; path=/; max-age=0";
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      selectedHospital: null,
      setAuth: (token, user) => {
        set({ token, user });
        setAuthCookie(token);
      },
      logout: () => {
        set({ token: null, user: null, selectedHospital: null });
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");
          // React Query cache ni tozalaymiz
          import('../providers').then(({ globalQueryClient }) => {
            globalQueryClient?.clear();
          });
        }
        clearAuthCookie();
      },
      isAuthenticated: () => !!get().token,
      setSelectedHospital: (h) => set({ selectedHospital: h }),
    }),
    {
      name: "auth-storage",
      // Faqat data fieldlarni saqlash — funksiyalar saqlanmasin
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        selectedHospital: state.selectedHospital,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token && typeof window !== "undefined") {
          localStorage.setItem("access_token", state.token);
          setAuthCookie(state.token);
        }
      },
    }
  )
);
