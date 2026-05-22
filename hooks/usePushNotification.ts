"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

// localStorage key
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
  const [loading, setLoading]     = useState(false);
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

  const subscribe = useCallback(async () => {
    if (!supported || loading) return;
    setLoading(true);
    try {
      // 1. Service worker registration
      const reg = await navigator.serviceWorker.ready;

      // 2. Ruxsat so'rash
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);
      if (perm !== "granted") {
        setLoading(false);
        return false;
      }

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
        endpoint:  subJson.endpoint,
        keys:      subJson.keys,
        userAgent: navigator.userAgent,
      });

      localStorage.setItem(SUBSCRIBED_KEY, "true");
      setSubscribed(true);
      return true;
    } catch (err) {
      console.error("Push subscribe failed:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supported, loading, getVapidKey]);

  const unsubscribe = useCallback(async () => {
    if (!supported || loading) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const pushSub = await reg.pushManager.getSubscription();
      if (pushSub) {
        await api.delete("/push/unsubscribe", { data: { endpoint: pushSub.endpoint } }).catch(() => null);
        await pushSub.unsubscribe();
      }
      localStorage.removeItem(SUBSCRIBED_KEY);
      setSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    } finally {
      setLoading(false);
    }
  }, [supported, loading]);

  // Auto-resubscribe if subscription changed (service worker message)
  useEffect(() => {
    if (!supported) return;
    const handler = async (e: MessageEvent) => {
      if (e.data?.type === "PUSH_SUBSCRIPTION_CHANGED") {
        const sub = e.data.subscription;
        if (sub?.endpoint) {
          await api.post("/push/subscribe", { endpoint: sub.endpoint, keys: sub.keys, userAgent: navigator.userAgent }).catch(() => null);
        }
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, [supported]);

  return { supported, permission, subscribed, loading, subscribe, unsubscribe };
}
