"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Crosshair, Loader2, MapPin, Save, AlertTriangle } from "lucide-react";
import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps";
import { hospitalsApi } from "@/lib/api";
import {
  createAccurateLocationRequest,
  type AccurateLocationRequest,
} from "@/lib/mobile-geolocation";

/** Server ham shu chegarani tekshiradi (SetHospitalGpsDto). */
const MAX_ACCURACY_M = 75;
/** Markaz hali belgilanmagan bo'lsa xarita shu yerdan boshlanadi (Andijon). */
const DEFAULT_CENTER: [number, number] = [40.7821, 72.3442];

type ApiError = { response?: { data?: { message?: string | string[] } } };
const errorText = (e: ApiError) => {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m[0] : m || "Xatolik yuz berdi";
};

/**
 * Muassasa geofence markazi (2026-09-23 audit, 4a).
 *
 * Ilgari markazni muassasaning BIRINCHI check-in qilgan xodimi o'z turgan
 * joyiga qarab belgilardi. Endi faqat DIRECTOR/ADMIN shu yerda belgilaydi:
 * xaritada nuqtani bosib yoki muassasa ichida turib "hozirgi joyim" orqali.
 */
export function GeofencePanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["hospital-my-gps"],
    queryFn: () => hospitalsApi.getMyGps(),
    staleTime: 60_000,
  });

  const [point, setPoint] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState<number>(200);
  const [accuracy, setAccuracy] = useState<number | undefined>(undefined);
  const [locating, setLocating] = useState(false);
  const requestRef = useRef<AccurateLocationRequest | null>(null);

  useEffect(() => {
    if (!data) return;
    if (data.gpsLat != null && data.gpsLng != null) {
      setPoint([data.gpsLat, data.gpsLng]);
    }
    setRadius(data.gpsRadius ?? 200);
  }, [data]);

  useEffect(() => () => requestRef.current?.stop(), []);

  const saveMut = useMutation({
    mutationFn: () =>
      hospitalsApi.setMyGps({
        lat: point![0],
        lng: point![1],
        radius,
        ...(accuracy !== undefined ? { accuracy: Math.round(accuracy) } : {}),
      }),
    onSuccess: (res) => {
      qc.setQueryData(["hospital-my-gps"], res);
      setAccuracy(undefined);
      toast.success("Geofence markazi saqlandi");
    },
    onError: (e: ApiError) => toast.error(errorText(e)),
  });

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
      onPosition: (p) => {
        setPoint([p.lat, p.lng]);
        setAccuracy(p.accuracy);
      },
      onIssue: () => toast.error("Joylashuv aniqlanmadi. GPS ruxsatini tekshiring."),
      onFinished: () => setLocating(false),
    });
  };

  const pickOnMap = (coords: [number, number]) => {
    setPoint(coords);
    setAccuracy(undefined); // xaritadan tanlangan nuqta — aniqlik tekshirilmaydi
  };

  const saved =
    data?.gpsLat != null &&
    point != null &&
    Math.abs(point[0] - data.gpsLat) < 1e-7 &&
    Math.abs(point[1] - (data.gpsLng ?? 0)) < 1e-7 &&
    radius === data.gpsRadius;
  const accuracyTooLow = accuracy !== undefined && accuracy > MAX_ACCURACY_M;
  const radiusValid = radius >= 50 && radius <= 2000;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <h3 className="font-semibold text-[var(--text-primary)]">Check-in hududi (geofence)</h3>
        </div>
        {data && (
          <span className={data.gpsLat != null ? "badge-green" : "badge-yellow"}>
            {data.gpsLat != null ? "Belgilangan" : "Belgilanmagan"}
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Xodimlar telefon orqali faqat shu nuqta atrofidagi radius ichida check-in qila oladi.
          Xaritada muassasa binosini bosing yoki bino ichida turib «Hozirgi joyim» tugmasini bosing.
        </p>

        {data && data.gpsLat == null && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Markaz belgilanmaguncha xodimlarning joylashuvi tekshirilmaydi.
          </div>
        )}

        {(data?.personalCenters ?? 0) > 0 && (
          <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-300">
            {data!.personalCenters} ta xodimda shaxsiy ish joyi markazi saqlangan — ular shu
            markaz bo&apos;yicha emas, o&apos;z markazi bo&apos;yicha tekshiriladi. Keraksizini
            Xodimlar sahifasida «GPS&apos;ni tiklash» orqali olib tashlang.
          </div>
        )}

        <div className="w-full h-64 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-hover)]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : (
            <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY }}>
              <Map
                state={{ center: point ?? DEFAULT_CENTER, zoom: point ? 17 : 13 }}
                style={{ width: "100%", height: "100%" }}
                onClick={(e: { get: (k: string) => [number, number] }) => pickOnMap(e.get("coords"))}
              >
                {point && (
                  <Placemark
                    geometry={point}
                    options={{ draggable: true }}
                    onDragEnd={(e: {
                      get: (k: string) => { geometry: { getCoordinates: () => [number, number] } };
                    }) => pickOnMap(e.get("target").geometry.getCoordinates())}
                  />
                )}
              </Map>
            </YMaps>
          )}
        </div>

        {point && (
          <p className="text-[11px] font-mono text-[var(--text-muted)]">
            {point[0].toFixed(6)}, {point[1].toFixed(6)}
            {accuracy !== undefined && (
              <span className={accuracyTooLow ? "text-rose-400" : "text-emerald-400"}>
                {" "}· aniqlik ±{Math.round(accuracy)}m
              </span>
            )}
          </p>
        )}
        {accuracyTooLow && (
          <p className="text-xs text-rose-400">
            Aniqlik yetarli emas (±{MAX_ACCURACY_M}m dan yaxshi bo&apos;lishi kerak). Deraza yoniga
            chiqib kuting yoki nuqtani xaritadan tanlang.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
          <button
            onClick={useMyLocation}
            disabled={locating}
            className="btn-secondary py-2 text-xs gap-1.5"
          >
            {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
            {locating ? "Aniqlanmoqda..." : "Hozirgi joyim"}
          </button>
          <label className="text-xs text-[var(--text-muted)] space-y-1">
            <span>Radius (m): 50–2000</span>
            <input
              type="number"
              min={50}
              max={2000}
              step={10}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="input-field text-sm py-1.5"
            />
          </label>
          <button
            onClick={() => saveMut.mutate()}
            disabled={!point || !radiusValid || accuracyTooLow || locating || saveMut.isPending || saved}
            className="btn-primary py-2 text-xs gap-1.5"
          >
            {saveMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saved ? "Saqlangan" : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}
