"use client";

/**
 * PWA Install Prompt
 *
 * - Android/Chrome: `beforeinstallprompt` hodisasini ushlaydi → "O'rnatish" tugmasi
 * - iOS Safari: standalone bo'lmasa → Share → "Add to Home Screen" yo'l-yo'riq
 * - Allaqachon o'rnatilgan (standalone): hech narsa ko'rsatmaydi
 * - "Keyinroq" bosilsa: 7 kun davomida yana ko'rsatmaydi
 */

import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";

const DISMISS_KEY = "pwa_install_dismissed_until";
const DISMISS_DAYS = 7;

type Platform = "android" | "ios" | null;

function detectPlatform(): Platform {
  if (typeof window === "undefined") return null;
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return null;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function isDismissed(): boolean {
  try {
    const until = localStorage.getItem(DISMISS_KEY);
    if (!until) return false;
    return Date.now() < Number(until);
  } catch {
    return false;
  }
}

function saveDismiss() {
  try {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(until));
  } catch {}
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible]               = useState(false);
  const [platform, setPlatform]             = useState<Platform>(null);

  useEffect(() => {
    // Allaqachon o'rnatilgan yoki yaqinda yopilgan bo'lsa — ko'rsatma
    if (isStandalone() || isDismissed()) return;

    const detected = detectPlatform();
    setPlatform(detected);

    // Android/Chrome: beforeinstallprompt hodisasini ushlaymiz
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari: beforeinstallprompt yo'q, lekin yo'l-yo'riq ko'rsatamiz
    if (detected === "ios") {
      // Kichik kechikish bilan ko'rsatish (sahifa yuklanib bo'lgach)
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    saveDismiss();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-[72px] sm:bottom-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-xl shadow-black/20 p-4 flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-300">
        {/* Ilova ikonkasi */}
        <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">MC</span>
        </div>

        {/* Matn */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Ilovani o'rnatish
          </p>
          {platform === "ios" ? (
            <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
              <Share className="w-3 h-3 inline -mt-0.5" /> Share →{" "}
              <strong>"Add to Home Screen"</strong> ni bosing
            </p>
          ) : (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              MaternityCare ni telefonga o'rnating
            </p>
          )}

          {/* Tugmalar */}
          {platform !== "ios" && (
            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={handleInstall}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                O'rnatish
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                Keyinroq
              </button>
            </div>
          )}
          {platform === "ios" && (
            <button
              onClick={handleDismiss}
              className="mt-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Yopish
            </button>
          )}
        </div>

        {/* Yopish tugmasi */}
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors flex-shrink-0"
          aria-label="Yopish"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
