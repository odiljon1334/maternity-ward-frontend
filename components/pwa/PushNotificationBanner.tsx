/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect } from "react";
import { usePushNotification } from "@/hooks/usePushNotification";
import { Bell, BellOff, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const DISMISSED_KEY = "push_banner_dismissed";

export function PushNotificationBanner() {
  const { supported, permission, subscribed, loading, subscribe, unsubscribe } =
    usePushNotification();

  const [dismissed, setDismissed] = useState(true);
  const [mounted, setMounted]     = useState(false);

  useEffect(() => {
    setMounted(true);
    setDismissed(localStorage.getItem(DISMISSED_KEY) === "true");
  }, []);

  // Agar ko'rsatish shart bo'lmasa — render qilmaymiz
  if (!mounted) return null;
  if (!supported) return null;
  if (subscribed) return null;
  if (permission === ("denied" as string)) return null;
  if (dismissed) return null;

  const handleEnable = async () => {
    const ok = await subscribe();
    if (ok) {
      toast.success("Push xabarnomalar yoqildi! 🔔");
    } else if (permission === "denied") {
      toast.error("Brauzer push xabarnomalarni bloklagan. Sozlamalardan ruxsat bering.");
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-md p-5 animate-fade-in">
      <div className="relative w-full max-w-sm animate-ios-sheet">
        {/* Glow */}
        <div className="absolute inset-0 rounded-[30px] bg-indigo-500/20 blur-2xl" />

        {/* Card */}
        <div className="relative overflow-hidden rounded-[30px] border border-white/15 bg-white/10 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          {/* Gradient top */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-indigo-500/20 to-transparent" />

          {/* Close */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-gray-300 transition hover:bg-white/20 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative p-7 text-center">
            {/* Icon */}
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/40">
              <Bell className="h-10 w-10 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Push xabarnomalar
            </h2>

            {/* Description */}
            <p className="mt-3 text-sm leading-6 text-gray-300">
              Ta&apos;til tasdiqlanganda, maosh hisoblanganda va muhim
              yangilanishlarda darhol xabar oling.
            </p>

            {/* Buttons */}
            <div className="mt-8 space-y-3">
              <button
                onClick={handleEnable}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-semibold text-gray-900 transition active:scale-[0.98] hover:bg-gray-100"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                {loading ? "Yuklanmoqda..." : "Bildirishnomalarni yoqish"}
              </button>

              <button
                onClick={handleDismiss}
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/10"
              >
                Keyinroq
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
  );
}
