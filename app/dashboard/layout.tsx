"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { PushNotificationBanner } from "@/components/pwa/PushNotificationBanner";
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
      <div className="relative flex h-screen overflow-hidden bg-[var(--bg-primary)]">
        <div aria-hidden className="pointer-events-none absolute -top-48 -left-48 h-[32rem] w-[32rem] rounded-full bg-blue-600/10 blur-[140px] dark:block hidden" />
        <div aria-hidden className="pointer-events-none absolute -bottom-56 -right-48 h-[34rem] w-[34rem] rounded-full bg-violet-600/10 blur-[150px] dark:block hidden" />
        <Sidebar />
        <main className="relative z-10 flex-1 overflow-y-auto min-w-0 pb-16 sm:pb-0">
          {children}
        </main>
        <BottomNav />
        <InstallPrompt />
        <PushNotificationBanner />
      </div>
    </MobileMenuContext.Provider>
  );
}
