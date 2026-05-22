"use client";
import { useState, useEffect } from "react";
import { usePushNotification } from "@/hooks/usePushNotification";
import { Bell, BellOff, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const DISMISSED_KEY = "push_banner_dismissed";

export function PushNotificationBanner() {
  const { supported, permission, subscribed, loading, subscribe, unsubscribe } =
    usePushNotification();

  const [dismissed, setDismissed] = useState(true); // default true until hydrated
  const [mounted, setMounted]     = useState(false);

  useEffect(() => {
    setMounted(true);
    setDismissed(localStorage.getItem(DISMISSED_KEY) === "true");
  }, []);

  // Agar ko'rsatish shart bo'lmasa — render qilmaymiz
  if (!mounted) return null;
  if (!supported) return null;
  if (subscribed) return null;          // already subscribed
  if (permission === ("denied" as string)) return null; // user blocked — don't nag
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
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-[#1e2638] border border-indigo-500/30 rounded-2xl shadow-2xl p-4 flex items-start gap-3 animate-slide-up">
        {/* Icon */}
        <div className="p-2 bg-indigo-600/20 rounded-xl flex-shrink-0">
          <Bell className="w-5 h-5 text-indigo-400" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">
            Push xabarnomalar
          </p>
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
            Ta'til tasdiqlanganda, maosh hisoblanganda — darhol xabar oling
          </p>

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {loading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Bell className="w-3.5 h-3.5" />}
              {loading ? "Yuklanmoqda..." : "Yoqish"}
            </button>
            <button
              onClick={handleDismiss}
              className="py-1.5 px-3 bg-[var(--bg-hover)] hover:bg-[var(--border)] text-gray-400 text-xs rounded-lg transition-colors"
            >
              Keyin
            </button>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-[var(--bg-hover)] rounded-lg text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
