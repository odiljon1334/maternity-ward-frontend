"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Crosshair, Loader2, MapPin, Search, X } from "lucide-react";
import { workSitesApi, type PlaceResult, type ResolvedPlace } from "@/lib/api";
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
  search,
}: {
  value: PickedLocation | null;
  onChange: (next: PickedLocation) => void;
  radius?: number;
  height?: number;
  /** Faqat ko'rsatish — bosish, sudrash va "Hozirgi joyim" o'chiriladi */
  readOnly?: boolean;
  /** Nomi bo'yicha qidiruv (ish joyi / asosiy bino) */
  search?: {
    targetHospitalId?: string;
    /** Natija tanlanganda — masalan nom/manzil maydonlarini to'ldirish uchun */
    onPlace?: (place: ResolvedPlace) => void;
  };
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
      {search && !readOnly && (
        <PlaceSearchBox
          targetHospitalId={search.targetHospitalId}
          onPick={(p) => {
            onChange({ lat: p.lat, lng: p.lng });
            search.onPlace?.(p);
          }}
        />
      )}
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

const SOURCE_LABEL: Record<PlaceResult["source"], string> = {
  COORDS: "Koordinata",
  YANDEX_ORG: "Yandex",
  YANDEX_GEO: "Yandex",
  OSM: "OpenStreetMap",
};

function hasCoords(p: PlaceResult): p is ResolvedPlace {
  return p.lat != null && p.lng != null;
}

function fmtDistance(m: number | null) {
  if (m == null) return "";
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(m < 10_000 ? 1 : 0)} km`;
}

/**
 * Manzil qidiruvi: "1-maktab Andijon", ko'cha manzili, koordinata
 * ("40.78, 72.34") yoki Yandex/Google xarita havolasi. Tashqi xizmatlarga
 * yuk tushmasligi uchun har harfda emas — Enter yoki tugma bosilganda qidiriladi.
 */
function PlaceSearchBox({
  targetHospitalId,
  onPick,
}: {
  targetHospitalId?: string;
  onPick: (place: ResolvedPlace) => void;
}) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  /** Koordinatasi aniqlanayotgan natija indeksi */
  const [resolving, setResolving] = useState<number | null>(null);
  const [results, setResults] = useState<PlaceResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  /**
   * Har yangi qidiruv/tahrirda oshadi: kechikib kelgan eski javob (qidiruv
   * yoki tanlangan joy koordinatasi) yangi holatni buzmasin.
   */
  const reqId = useRef(0);
  const boxRef = useRef<HTMLDivElement>(null);

  // Ro'yxat tashqarida bosilganda yoki Escape bosilganda yopiladi
  useEffect(() => {
    if (!results) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setResults(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setResults(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [results]);

  const run = async () => {
    const query = q.trim();
    if (query.length < 2 || loading || resolving !== null) return;
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await workSitesApi.placeSearch(query, targetHospitalId);
      if (id !== reqId.current) return;
      // Havola/koordinata — bitta aniq nuqta: ro'yxatsiz darhol qo'yiladi
      if (res.length === 1 && res[0].source === "COORDS" && hasCoords(res[0])) {
        onPick(res[0]);
        setResults(null);
        toast.success("Nuqta xaritaga qo'yildi");
      } else {
        setResults(res);
      }
    } catch (e) {
      if (id !== reqId.current) return;
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(
        msg ?? "Qidiruv ishlamadi. Birozdan so'ng qayta urinib ko'ring.",
      );
      setResults(null);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  };

  const choose = async (r: PlaceResult, i: number) => {
    if (resolving !== null) return;
    if (hasCoords(r)) {
      onPick(r);
      setResults(null);
      return;
    }
    if (!r.uri) return;
    const id = ++reqId.current;
    setResolving(i);
    setError(null);
    try {
      const place = await workSitesApi.placeResolve(r.uri, targetHospitalId);
      if (id !== reqId.current) return; // foydalanuvchi boshqa narsa qidirib ulgurdi
      // Ro'yxatda ko'ringan nom va manzil saqlanadi — foydalanuvchi aynan shuni tanladi
      onPick({ ...place, name: r.name, address: r.address ?? place.address });
      setResults(null);
    } catch (e) {
      if (id !== reqId.current) return;
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(
        msg ?? "Joy koordinatasini olib bo'lmadi. Nuqtani xaritadan tanlang.",
      );
    } finally {
      if (id === reqId.current) setResolving(null);
    }
  };

  return (
    <div>
      <div className="relative" ref={boxRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                // Matn o'zgardi — eski ro'yxat va kutilayotgan javoblar bekor
                reqId.current++;
                setResults(null);
                setLoading(false);
                setResolving(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void run();
                }
                if (e.key === "Escape") setResults(null);
              }}
              className="input-field !pl-9 text-sm"
              placeholder="Masalan: 1-maktab Andijon — yoki xarita havolasini qo'ying"
              aria-label="Manzilni qidirish"
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            onClick={() => void run()}
            disabled={loading || resolving !== null || q.trim().length < 2}
            className="btn-secondary py-1.5 px-3 text-xs gap-1.5"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            Qidirish
          </button>
        </div>

        {results && (
          <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-1.5 text-[11px] text-[var(--text-muted)]">
              <span>
                {results.length
                  ? `${results.length} ta natija — keraklisini tanlang`
                  : "Hech narsa topilmadi"}
              </span>
              <button
                type="button"
                onClick={() => setResults(null)}
                aria-label="Yopish"
                className="p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {results.map((r, i) => (
              <button
                key={`${r.uri ?? `${r.lat},${r.lng}`},${i}`}
                type="button"
                onClick={() => void choose(r, i)}
                disabled={resolving !== null}
                aria-busy={resolving === i}
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition hover:bg-[var(--bg-hover)] disabled:cursor-wait disabled:opacity-60"
              >
                {resolving === i ? (
                  <Loader2 className="mt-0.5 h-4 w-4 flex-shrink-0 animate-spin text-emerald-500" />
                ) : (
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
                    {r.name}
                  </span>
                  {r.address && (
                    <span className="block truncate text-[11px] text-[var(--text-muted)]">
                      {r.address}
                    </span>
                  )}
                </span>
                <span className="flex-shrink-0 text-right text-[10px] text-[var(--text-muted)]">
                  <span className="block font-semibold">
                    {fmtDistance(r.distance)}
                  </span>
                  <span className="block">{SOURCE_LABEL[r.source]}</span>
                </span>
              </button>
            ))}
            {!results.length && (
              <p className="px-3 py-3 text-xs leading-5 text-[var(--text-muted)]">
                Boshqacha yozib ko&apos;ring (masalan &quot;1-son maktab
                Andijon&quot;) yoki Yandex/Google xaritada joyni topib,{" "}
                <b>havolasini shu yerga qo&apos;ying</b> — nuqta avtomatik
                qo&apos;yiladi.
              </p>
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-rose-400" role="alert">
          {error}
        </p>
      )}
      <p className="mt-1 text-[11px] text-[var(--text-muted)]">
        Topilgach belgini xaritada aniq binoga sudrab to&apos;g&apos;rilashingiz
        mumkin.
      </p>
    </div>
  );
}
