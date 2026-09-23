"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { PushNotificationBanner } from "@/components/pwa/PushNotificationBanner";
import { EmailVerificationReminder } from "@/components/dashboard/EmailVerificationReminder";
import { useAuthStore } from "@/stores/auth";
import { MobileMenuContext } from "@/contexts/mobile-menu";
import { ConfirmationProvider } from "@/components/ui";
import { LiveLocationTracker } from "@/components/location/LiveLocationTracker";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const user     = useAuthStore((s) => s.user);
  const [hydrated, setHydrated]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (hydrated && !user) router.replace("/login");
  }, [hydrated, user, router]);

  if (!hydrated || !user) return null;

  return (
    <MobileMenuContext.Provider value={{
      open: mobileOpen,
      toggle: () => setMobileOpen((v) => !v),
      close: () => setMobileOpen(false),
    }}>
      <ConfirmationProvider>
      {/* 100dvh: iOS Safari'da 100vh manzil satri ortidagi joyni ham o'z ichiga oladi — pastki menyu yashirinib qolardi */}
      <div className="relative flex h-screen supports-[height:100dvh]:h-[100dvh] overflow-hidden bg-[var(--bg-primary)]">
        <div aria-hidden className="pointer-events-none absolute -top-48 -left-48 h-[32rem] w-[32rem] rounded-full bg-blue-600/10 blur-[140px] dark:block hidden" />
        <div aria-hidden className="pointer-events-none absolute -bottom-56 -right-48 h-[34rem] w-[34rem] rounded-full bg-violet-600/10 blur-[150px] dark:block hidden" />
        <Sidebar />
        {/*
          ⚠️ Bu yerda `z-10` BO'LMASLIGI kerak.

          `position: relative` + `z-index` birgalikda STACKING CONTEXT yaratadi.
          Natijada sahifa ichidagi modal oynalarning `z-50` qiymati shu kontekst
          ichida qamalib qolardi, BottomNav esa (main ning ukasi, `z-40`)
          main ning `z-10` idan yuqori bo'lib, modal tugmalari ustiga chizilardi.
          Mobilda "Qo'shish"/"Bekor" bosilganda Grafik sahifasiga o'tib ketishining
          sababi shu edi.

          `relative` z-index'siz stacking context yaratmaydi — modallar endi
          to'g'ridan-to'g'ri BottomNav bilan solishtiriladi va ustida turadi.
          Bezak dog'lari (absolute, pointer-events-none) main dan oldin
          kelgani uchun baribir orqada qoladi.
        */}
        <main
          className={
            // Xodim menyusida markaziy tugma bar ustidan ~32px ko'tariladi
            user.role === "EMPLOYEE"
              ? "relative flex-1 overflow-y-auto min-w-0 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:pb-0"
              : "relative flex-1 overflow-y-auto min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pb-0"
          }
        >
          <EmailVerificationReminder />
          {children}
        </main>
        <BottomNav />
        <InstallPrompt />
        <PushNotificationBanner />
        <LiveLocationTracker />
      </div>
      </ConfirmationProvider>
    </MobileMenuContext.Provider>
  );
}
