"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuthStore } from "@/stores/auth";
import { MobileMenuContext } from "@/contexts/mobile-menu";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const token    = useAuthStore((s) => s.token);
  const [hydrated, setHydrated]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (hydrated && !token) router.replace("/login");
  }, [hydrated, token, router]);

  if (!hydrated || !token) return null;

  return (
    <MobileMenuContext.Provider value={{
      open: mobileOpen,
      toggle: () => setMobileOpen((v) => !v),
      close: () => setMobileOpen(false),
    }}>
      <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto min-w-0 pb-16 sm:pb-0">
          {children}
        </main>
        <BottomNav />
      </div>
    </MobileMenuContext.Provider>
  );
}
