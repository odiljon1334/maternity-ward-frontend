"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

const SUBSCRIBED_KEY = "push_subscribed";
const STEP_TIMEOUT_MS = 15_000;

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

// ─────────────────────────────────────────────
// FAZA 1.3 tuzatishi (2026-09-19): Apple qurilmalarida (iOS PWA / macOS
// Safari orqali Dock'ga qo'shilgan veb-ilova) WebKit ko'pincha
// Notification.requestPermission() yoki pushManager.subscribe()
// promise'ini "standalone" (Bosh ekranga/Dock'ga qo'shilgan) holatda
// bo'lmasa umuman hal qilmaydi — na resolve, na reject. Natijada
// try/finally'dagi `finally` HECH QACHON ishga tushmaydi va tugma
// abadiy "Yuklanmoqda..." holatida qoladi. Ikki qatlamli himoya:
//  1) Standalone-holat oldindan tekshiriladi — bo'lmasa, so'rov umuman
//     yuborilmaydi (hang boshlanishining oldi olinadi).
//  2) Har bir asosiy qadam timeout bilan o'raladi — agar (1) yetarli
//     bo'lmagan boshqa holat topilsa ham, UI abadiy osilib qolmaydi.
// ─────────────────────────────────────────────

function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIOSDevice = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ "Macintosh" deb ko'rinadi, lekin touch qo'llab-quvvatlaydi
  const isIPadOS =
    /Macintosh/.test(ua) && typeof document !== "undefined" && "ontouchend" in document;
  const isMacSafari =
    /Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR/.test(ua);
  return isIOSDevice || isIPadOS || isMacSafari;
}

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const mm = window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  const iosStandalone =
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return mm || iosStandalone;
}

class PushTimeoutError extends Error {
  constructor(step: string) {
    super(`"${step}" javob bermadi (${STEP_TIMEOUT_MS / 1000}s)`);
    this.name = "PushTimeoutError";
  }
}

function withTimeout<T>(promise: Promise<T>, step: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new PushTimeoutError(step)), STEP_TIMEOUT_MS);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

const MESSAGES = {
  requiresStandalone:
    "Push xabarnomalar uchun avval ilovani Bosh ekranga (iOS) yoki Dock'ga (macOS) qo'shing, so'ng o'sha belgi orqali oching.",
  permissionDenied: "Brauzer push xabarnomalarni bloklagan. Sozlamalardan ruxsat bering.",
};

export type PushPermission = NotificationPermission;

export function usePushNotification() {
  const [permission, setPermission] = useState<PushPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(ok);
    if (ok) {
      setPermission(Notification.permission as PushPermission);
      setSubscribed(localStorage.getItem(SUBSCRIBED_KEY) === "true");
    }
  }, []);

  const getVapidKey = useCallback(async (): Promise<string> => {
    const res = await api.get("/push/vapid-key");
    return res.data.data?.publicKey ?? res.data?.publicKey ?? "";
  }, []);

  const getSwRegistration = useCallback(async (): Promise<ServiceWorkerRegistration> => {
    const swFile = process.env.NODE_ENV === "production" ? "/sw.js" : "/sw-push.js";

    // Avval mavjud registrationni tekshiramiz
    const existing = await navigator.serviceWorker.getRegistration("/");

    if (existing?.active) {
      console.log("✅ Active Service Worker mavjud:", existing.active.scriptURL);
      return existing;
    }

    console.log("🔄 Service Worker register qilinmoqda:", swFile);

    await navigator.serviceWorker.register(swFile, {
      scope: "/",
    });

    // Eng muhim qism:
    // Service Worker active bo'lguncha kutamiz
    const activeReg = await navigator.serviceWorker.ready;

    console.log("✅ Service Worker READY:", activeReg.active?.scriptURL, activeReg.active?.state);

    if (!activeReg.active) {
      throw new Error("Service Worker active bo'lmadi");
    }

    return activeReg;
  }, []);

  const subscribe = useCallback(async () => {
    if (!supported || loading) return false;
    setLoading(true);
    setLastError(null);

    // 0. Apple WebKit'da standalone bo'lmasa — so'rov umuman yuborilmaydi
    // (WebKit'ning abadiy osilib qolishining oldi shu yerda olinadi).
    if (isApplePlatform() && !isStandaloneDisplay()) {
      setLoading(false);
      setLastError(MESSAGES.requiresStandalone);
      return false;
    }

    let step = "Ruxsat so'rash";
    try {
      // 1. Ruxsat so'rash
      const perm = await withTimeout(Notification.requestPermission(), step);
      setPermission(perm as PushPermission);
      if (perm !== "granted") {
        if (perm === "denied") setLastError(MESSAGES.permissionDenied);
        return false;
      }

      // 2. SW registration
      step = "Service Worker ro'yxatdan o'tkazish";
      const reg = await withTimeout(getSwRegistration(), step);

      console.log("🔔 Using SW:", reg.active?.scriptURL);
      console.log("🔔 SW state:", reg.active?.state);

      // 3. VAPID public key
      step = "VAPID kalitini olish";
      const vapidKey = await withTimeout(getVapidKey(), step);
      if (!vapidKey) {
        setLastError("Server tomonida xatolik (VAPID key topilmadi). Birozdan keyin qayta urinib ko'ring.");
        return false;
      }

      // 4. Subscribe
      step = "Push obunasini yaratish";
      const pushSub = await withTimeout(
        reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        }),
        step,
      );

      // 5. Backendga yuborish
      step = "Obunani serverga saqlash";
      const subJson = pushSub.toJSON();
      await withTimeout(
        api.post("/push/subscribe", {
          endpoint: subJson.endpoint,
          keys: subJson.keys,
          userAgent: navigator.userAgent,
        }),
        step,
      );

      localStorage.setItem(SUBSCRIBED_KEY, "true");
      localStorage.setItem("sw_version", "v2");
      setSubscribed(true);
      return true;
    } catch (err) {
      console.error(`Push subscribe failed at step "${step}":`, err);
      const isTimeout = err instanceof PushTimeoutError;
      setLastError(
        isTimeout
          ? `Bu qurilmada push xabarnoma ishga tushmadi ("${step}" bosqichida javob kelmadi). Birozdan keyin qayta urinib ko'ring.`
          : `Bu qurilmada push xabarnoma ishga tushmadi ("${step}" bosqichida xatolik). Birozdan keyin qayta urinib ko'ring.`,
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, [supported, loading, getVapidKey, getSwRegistration]);

  const unsubscribe = useCallback(async () => {
    if (!supported || loading) return;
    setLoading(true);
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      const pushReg = regs.find(
        (r) =>
          r.active?.scriptURL.includes("sw.js") || r.active?.scriptURL.includes("sw-push.js"),
      );
      if (pushReg) {
        const pushSub = await pushReg.pushManager.getSubscription();
        if (pushSub) {
          await api
            .delete("/push/unsubscribe", { data: { endpoint: pushSub.endpoint } })
            .catch(() => null);
          await pushSub.unsubscribe();
        }
      }
      localStorage.removeItem(SUBSCRIBED_KEY);
      setSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    } finally {
      setLoading(false);
    }
  }, [supported, loading]);

  return { supported, permission, subscribed, loading, lastError, subscribe, unsubscribe };
}
