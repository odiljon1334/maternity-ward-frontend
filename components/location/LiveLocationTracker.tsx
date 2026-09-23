"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { locationApi } from "@/lib/api";
import { createLiveLocationTracker } from "@/lib/live-location-tracker";
import { useAuthStore } from "@/stores/auth";

const SESSION_QUERY_KEY = ["live-location-tracking-session"] as const;

export function LiveLocationTracker() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const warningShownRef = useRef(false);
  const isEmployee = user?.role === "EMPLOYEE";

  const { data: session } = useQuery({
    queryKey: [...SESSION_QUERY_KEY, user?.id],
    queryFn: locationApi.trackingSession,
    enabled: isEmployee,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (
      !isEmployee ||
      !session?.active ||
      !session.expectedCheckOut ||
      !navigator.geolocation
    ) return;

    warningShownRef.current = false;
    const tracker = createLiveLocationTracker({
      geolocation: navigator.geolocation,
      heartbeatMs: session.heartbeatMs,
      onPoint: async (point) => {
        const batteryManager = navigator as Navigator & {
          getBattery?: () => Promise<{ level: number }>;
        };
        let battery: number | undefined;
        try {
          battery = batteryManager.getBattery
            ? Math.round((await batteryManager.getBattery()).level * 100)
            : undefined;
        } catch {
          // Battery API ixtiyoriy; uning xatosi GPS yuborilishini to'xtatmaydi.
        }
        const response = await locationApi.sendLive({ ...point, battery });
        if (response?.stopTracking) {
          void queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
        }
        return response;
      },
      onError: (error) => {
        if (warningShownRef.current) return;
        warningShownRef.current = true;
        const denied = error.code === error.PERMISSION_DENIED;
        toast.warning(
          denied
            ? "Ish vaqtida jonli joylashuv uchun GPS ruxsatini yoqing."
            : "Jonli joylashuv olinmadi. GPS va internetni tekshiring.",
          { duration: 8_000 },
        );
      },
      onSendError: () => {
        if (warningShownRef.current) return;
        warningShownRef.current = true;
        toast.warning(
          "Jonli joylashuv serverga yuborilmadi. Internet tiklanganda avtomatik qayta uriniladi.",
          { duration: 8_000 },
        );
      },
    });

    tracker.start();

    const refresh = () => {
      if (document.visibilityState === "visible") tracker.refresh();
    };
    const handleVisibility = () => refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", handleVisibility);

    const endAt = new Date(session.expectedCheckOut).getTime();
    const untilEnd = endAt - Date.now();
    const endTimer = untilEnd > 0 ? window.setTimeout(tracker.stop, untilEnd) : null;

    return () => {
      tracker.stop();
      if (endTimer != null) window.clearTimeout(endTimer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isEmployee, queryClient, session?.active, session?.expectedCheckOut, session?.heartbeatMs]);

  return null;
}
