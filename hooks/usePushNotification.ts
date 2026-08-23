"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

const SUBSCRIBED_KEY = "push_subscribed";

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

export type PushPermission = NotificationPermission;

export function usePushNotification() {
  const [permission, setPermission] = useState<PushPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

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

const getSwRegistration = useCallback(
  async (): Promise<ServiceWorkerRegistration> => {
    const swFile =
      process.env.NODE_ENV === "production"
        ? "/sw.js"
        : "/sw-push.js";

    // Avval mavjud registrationni tekshiramiz
    const existing = await navigator.serviceWorker.getRegistration("/");

    if (existing?.active) {
      console.log(
        "✅ Active Service Worker mavjud:",
        existing.active.scriptURL
      );

      return existing;
    }

    console.log("🔄 Service Worker register qilinmoqda:", swFile);

    await navigator.serviceWorker.register(swFile, {
      scope: "/",
    });

    // Eng muhim qism:
    // Service Worker active bo'lguncha kutamiz
    const activeReg = await navigator.serviceWorker.ready;

    console.log(
      "✅ Service Worker READY:",
      activeReg.active?.scriptURL,
      activeReg.active?.state
    );

    if (!activeReg.active) {
      throw new Error("Service Worker active bo'lmadi");
    }

    return activeReg;
  },
  []
);

  const subscribe = useCallback(async () => {
    if (!supported || loading) return false;
    setLoading(true);
    try {
      // 1. Ruxsat so'rash
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);
      if (perm !== "granted") return false;

      // 2. SW registration
      const reg = await getSwRegistration();

      console.log("🔔 Using SW:", reg.active?.scriptURL);
      console.log("🔔 SW state:", reg.active?.state);

      // 3. VAPID public key
      const vapidKey = await getVapidKey();
      if (!vapidKey) throw new Error("VAPID key not configured");

      // 4. Subscribe
      const pushSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // 5. Backendga yuborish
      const subJson = pushSub.toJSON();
      await api.post("/push/subscribe", {
        endpoint: subJson.endpoint,
        keys: subJson.keys,
        userAgent: navigator.userAgent,
      });

      localStorage.setItem(SUBSCRIBED_KEY, "true");
      localStorage.setItem("sw_version", "v2");
      setSubscribed(true);
      return true;
    } catch (err) {
      console.error("Push subscribe failed:", err);
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
        r =>
          r.active?.scriptURL.includes("sw.js") ||
          r.active?.scriptURL.includes("sw-push.js")
      );
      if (pushReg) {
        const pushSub = await pushReg.pushManager.getSubscription();
        if (pushSub) {
          await api.delete("/push/unsubscribe", { data: { endpoint: pushSub.endpoint } }).catch(() => null);
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

  return { supported, permission, subscribed, loading, subscribe, unsubscribe };
}