/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { EmployeeMarker } from "@/app/dashboard/live-map/page";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface MapboxMapProps {
  markers: EmployeeMarker[];
  selectedUser: EmployeeMarker | null;
  onMarkerClick: (emp: EmployeeMarker) => void;
}

export default function MapboxMap({
  markers,
  selectedUser,
  onMarkerClick,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [mapReady, setMapReady] = useState(false);

  // ─────────────────────────────────────────────
  // MAP INITIALIZE
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/standard",
      center: [72.3442, 40.7821],
      zoom: 15,
      pitch: 60,
      bearing: -20,
      antialias: true,
    });

    map.on("load", () => {
      try {
        map.setConfigProperty("basemap", "lightPreset", "day");
        map.setConfigProperty("basemap", "show3dBuildings", true);
      } catch (error) {
        console.warn("⚠️ Map config error:", error);
      }

      mapRef.current = map;
      setMapReady(true);
    });

    map.on("error", (event) => {
      console.error("❌ Mapbox error:", event);
    });

    map.addControl(
      new mapboxgl.NavigationControl(),
      "bottom-right"
    );

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => {
        marker.remove();
      });

      markersRef.current.clear();

      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ─────────────────────────────────────────────
  // MARKERS
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!mapReady) {
      return;
    }

    const map = mapRef.current;

    if (!map) {
      return;
    }

    const currentIds = new Set(
      markers.map((marker) => marker.userId)
    );

    // Eski markerlarni olib tashlash
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Yangi markerlarni qo'shish / update qilish
    markers.forEach((emp) => {
      const existing = markersRef.current.get(emp.userId);

      if (existing) {
        existing.setLngLat([
          emp.longitude,
          emp.latitude,
        ]);
      } else {
        const el = createMarkerElement(
          emp,
          onMarkerClick
        );

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat([
            emp.longitude,
            emp.latitude,
          ])
          .addTo(map);

        markersRef.current.set(
          emp.userId,
          marker
        );
      }
    });
  }, [markers, mapReady, onMarkerClick]);

  // ─────────────────────────────────────────────
  // SELECTED USER
  // ─────────────────────────────────────────────

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady || !selectedUser) return;
    map.flyTo({
      center: [
        selectedUser.longitude,
        selectedUser.latitude,
      ],
      zoom: 16,
      pitch: 60,
      bearing: -20,
      duration: 1500,
    });
  }, [selectedUser, mapReady]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
}

// ─────────────────────────────────────────────
// MARKER ELEMENT
// ─────────────────────────────────────────────

function createMarkerElement(
  emp: EmployeeMarker,
  onClick: (emp: EmployeeMarker) => void
) {
  const colors = [
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
    "#F59E0B",
    "#10B981",
    "#EF4444",
    "#06B6D4",
    "#F97316",
  ];

  const colorIndex =
    emp.userId.charCodeAt(0) % colors.length;

  const color = colors[colorIndex];

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.replace(
      "/api/v1",
      ""
    );

  const imgSrc = emp.photo
    ? `${apiBase}${emp.photo}`
    : null;

  const initials =
    emp.name?.charAt(0)?.toUpperCase() ?? "?";

  const el = document.createElement("div");

  el.style.cssText = `
    width: 56px;
    height: 72px;
    cursor: pointer;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
    transition: transform 0.15s ease;
  `;

  el.onclick = () => onClick(emp);

  el.innerHTML = `
    <svg
      width="56"
      height="72"
      viewBox="0 0 56 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >

      <defs>
        ${
          imgSrc
            ? `
              <clipPath id="avatar-${emp.userId}">
                <circle cx="28" cy="19" r="14"/>
              </clipPath>
            `
            : ""
        }
      </defs>

      <!-- PIN -->

      <path
        d="
          M28 0
          C17.5 0 9 8.5 9 19
          C9 33 28 52 28 52
          C28 52 47 33 47 19
          C47 8.5 38.5 0 28 0Z
        "
        fill="${color}"
      />

      <!-- WHITE CIRCLE -->

      <circle
        cx="28"
        cy="19"
        r="15"
        fill="white"
      />

      ${
        imgSrc
          ? `
            <image
              href="${imgSrc}"
              x="14"
              y="5"
              width="28"
              height="28"
              clip-path="url(#avatar-${emp.userId})"
              preserveAspectRatio="xMidYMid slice"
            />
          `
          : `
            <circle
              cx="28"
              cy="19"
              r="14"
              fill="${color}"
            />

            <text
              x="28"
              y="24"
              text-anchor="middle"
              fill="white"
              font-size="13"
              font-weight="900"
              font-family="sans-serif"
            >
              ${initials}
            </text>
          `
      }

      <!-- ONLINE -->

      <circle
        cx="42"
        cy="6"
        r="5"
        fill="#22c55e"
        stroke="white"
        stroke-width="2"
      />

    </svg>
  `;

  el.onmouseenter = () => {
    el.style.transform = "scale(1.15)";
  };

  el.onmouseleave = () => {
    el.style.transform = "scale(1)";
  };

  return el;
}