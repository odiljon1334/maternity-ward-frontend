"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Crosshair, Loader2 } from "lucide-react";
import { YMaps, Map, Placemark, Circle } from "@pbe/react-yandex-maps";
import {
  createAccurateLocationRequest,
  type AccurateLocationRequest,
} from "@/lib/mobile-geolocation";

/** Server ham shu chegarani tekshiradi (DTO: accuracy ≤ 75). */
export const MAX_PICK_ACCURACY_M = 75;
/** Nuqta hali tanlanmagan bo'lsa xarita shu yerdan boshlanadi (Andijon). */
const DEFAULT_CENTER: [number, number] = [40.7821, 72.3442];

export interface PickedLocation {
  lat: number;
  lng: number;
  /** Faqat "Hozirgi joyim" orqali olinganda (metr); xaritadan tanlansa — undefined */
  accuracy?: number;
}

/**
 * Geofence markazini tanlash: xaritani bosish, belgini sudrash yoki
 * joyida turib "Hozirgi joyim". Radius doira sifatida ko'rsatiladi.
 */
export function LocationPicker({
  value,
  onChange,
  radius,
  height = 256,
  readOnly = false,
}: {
  value: PickedLocation | null;
  onChange: (next: PickedLocation) => void;
  radius?: number;
  height?: number;
  /** Faqat ko'rsatish — bosish, sudrash va "Hozirgi joyim" o'chiriladi */
  readOnly?: boolean;
}) {
  const [locating, setLocating] = useState(false);
  const requestRef = useRef<AccurateLocationRequest | null>(null);

  useEffect(() => () => requestRef.current?.stop(), []);

  const useMyLocation = () => {
    if (!navigator.geolocation || !window.isSecureContext) {
      toast.error("Brauzer joylashuvni aniqlay olmaydi");
      return;
    }
    requestRef.current?.stop();
    setLocating(true);
    requestRef.current = createAccurateLocationRequest({
      geolocation: navigator.geolocation,
      targetAccuracyM: 20,
      maxWaitMs: 25_000,
      onPosition: (p) =>
        onChange({ lat: p.lat, lng: p.lng, accuracy: p.accuracy }),
      onIssue: () =>
        toast.error("Joylashuv aniqlanmadi. GPS ruxsatini tekshiring."),
      onFinished: () => setLocating(false),
    });
  };

  const point: [number, number] | null = value ? [value.lat, value.lng] : null;
  const accuracyTooLow =
    value?.accuracy !== undefined && value.accuracy > MAX_PICK_ACCURACY_M;

  return (
    <div className="space-y-2">
      <div
        className="w-full rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-hover)]"
        style={{ height }}
      >
        <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY }}>
          <Map
            state={{ center: point ?? DEFAULT_CENTER, zoom: point ? 16 : 13 }}
            style={{ width: "100%", height: "100%" }}
            onClick={(e: { get: (k: string) => [number, number] }) => {
              if (readOnly) return;
              const [lat, lng] = e.get("coords");
              onChange({ lat, lng });
            }}
          >
            {point && radius ? (
              <Circle
                geometry={[point, radius]}
                options={{
                  fillColor: "#10b98133",
                  strokeColor: "#10b981",
                  strokeWidth: 2,
                }}
              />
            ) : null}
            {point && (
              <Placemark
                geometry={point}
                options={{ draggable: !readOnly }}
                onDragEnd={(e: {
                  get: (k: string) => {
                    geometry: { getCoordinates: () => [number, number] };
                  };
                }) => {
                  const [lat, lng] = e.get("target").geometry.getCoordinates();
                  onChange({ lat, lng });
                }}
              />
            )}
          </Map>
        </YMaps>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-between">
        <p className="text-[11px] font-mono text-[var(--text-muted)]">
          {value
            ? `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}`
            : "Xaritada nuqtani bosing"}
          {value?.accuracy !== undefined && (
            <span
              className={accuracyTooLow ? "text-rose-400" : "text-emerald-400"}
            >
              {" "}
              · aniqlik ±{Math.round(value.accuracy)}m
            </span>
          )}
        </p>
        {!readOnly && (
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="btn-secondary py-1.5 px-3 text-xs gap-1.5"
          >
            {locating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Crosshair className="w-3.5 h-3.5" />
            )}
            {locating ? "Aniqlanmoqda..." : "Hozirgi joyim"}
          </button>
        )}
      </div>
      {accuracyTooLow && (
        <p className="text-xs text-rose-400">
          Aniqlik yetarli emas (±{MAX_PICK_ACCURACY_M}m dan yaxshi bo&apos;lishi
          kerak). Deraza yoniga chiqib kuting yoki nuqtani xaritadan tanlang.
        </p>
      )}
    </div>
  );
}
