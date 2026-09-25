"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, MapPin, Save, AlertTriangle } from "lucide-react";
import { hospitalsApi } from "@/lib/api";
import { LocationPicker, MAX_PICK_ACCURACY_M, type PickedLocation } from "./LocationPicker";

type ApiError = { response?: { data?: { message?: string | string[] } } };
export const apiErrorText = (e: ApiError) => {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m[0] : m || "Xatolik yuz berdi";
};

/**
 * Muassasa asosiy binosining check-in hududi (2026-09-23 audit, 4a).
 * Ilgari markazni muassasaning BIRINCHI check-in qilgan xodimi o'z turgan
 * joyiga qarab belgilardi. Endi faqat DIRECTOR/ADMIN shu yerda belgilaydi.
 * Qo'shimcha joylar (maktab, bog'cha...) — "Ish joylari" bo'limida.
 */
export function GeofencePanel({
  embedded = false,
  onSaved,
}: {
  /** Boshqa oyna ichida (xodim sahifasi) — kartasiz va sarlavhasiz */
  embedded?: boolean;
  onSaved?: () => void;
} = {}) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["hospital-my-gps"],
    queryFn: () => hospitalsApi.getMyGps(),
    staleTime: 60_000,
  });

  const [point, setPoint] = useState<PickedLocation | null>(null);
  const [radius, setRadius] = useState<number>(200);

  useEffect(() => {
    if (!data) return;
    if (data.gpsLat != null && data.gpsLng != null) {
      setPoint({ lat: data.gpsLat, lng: data.gpsLng });
    }
    setRadius(data.gpsRadius ?? 200);
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () =>
      hospitalsApi.setMyGps({
        lat: point!.lat,
        lng: point!.lng,
        radius,
        ...(point?.accuracy !== undefined ? { accuracy: Math.round(point.accuracy) } : {}),
      }),
    onSuccess: (res) => {
      qc.setQueryData(["hospital-my-gps"], res);
      // Xodim sahifalaridagi "Asosiy bino" holati ham yangilansin
      void qc.invalidateQueries({ queryKey: ["employee-sites"] });
      setPoint((p) => (p ? { lat: p.lat, lng: p.lng } : p));
      toast.success("Check-in hududi saqlandi");
      onSaved?.();
    },
    onError: (e: ApiError) => toast.error(apiErrorText(e)),
  });

  const saved =
    data?.gpsLat != null &&
    point != null &&
    Math.abs(point.lat - data.gpsLat) < 1e-7 &&
    Math.abs(point.lng - (data.gpsLng ?? 0)) < 1e-7 &&
    radius === data.gpsRadius;
  const accuracyTooLow = point?.accuracy !== undefined && point.accuracy > MAX_PICK_ACCURACY_M;
  const radiusValid = radius >= 50 && radius <= 2000;

  return (
    <div className={embedded ? "" : "card overflow-hidden"}>
      <div className={embedded ? "hidden" : "flex items-center justify-between px-5 py-4 border-b border-[var(--border)]"}>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <h3 className="font-semibold text-[var(--text-primary)]">Check-in hududi (asosiy bino)</h3>
        </div>
        {data && (
          <span className={data.gpsLat != null ? "badge-green" : "badge-yellow"}>
            {data.gpsLat != null ? "Belgilangan" : "Belgilanmagan"}
          </span>
        )}
      </div>

      <div className={embedded ? "space-y-4" : "p-4 space-y-4"}>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Xodimlar telefon orqali shu nuqta atrofidagi radius ichida check-in qila oladi. Xaritada
          muassasa binosini bosing yoki bino ichida turib «Hozirgi joyim» tugmasini bosing.
        </p>

        {data && data.gpsLat == null && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Markaz belgilanmaguncha (va xodimga ish joyi biriktirilmaguncha) joylashuv tekshirilmaydi.
          </div>
        )}

        {isLoading ? (
          <div className="h-64 rounded-xl bg-[var(--bg-hover)] flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : (
          <LocationPicker value={point} onChange={setPoint} radius={radiusValid ? radius : undefined} search={{}} />
        )}

        <div className="grid grid-cols-2 gap-2 items-end">
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
            disabled={!point || !radiusValid || accuracyTooLow || saveMut.isPending || saved}
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
