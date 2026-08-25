/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { EmployeeMarker } from "@/app/dashboard/live-map/page";

mapboxgl.accessToken =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface MapboxMapProps {
  markers: EmployeeMarker[];
  selectedUser: EmployeeMarker | null;
  onMarkerClick: (
    emp: EmployeeMarker
  ) => void;
}

interface MarkerState {
  marker: mapboxgl.Marker;
  element: HTMLDivElement;
  animationFrame: number | null;
  currentLng: number;
  currentLat: number;
}

export default function MapboxMap({
  markers,
  selectedUser,
  onMarkerClick,
}: MapboxMapProps) {
  const mapContainer =
    useRef<HTMLDivElement>(null);

  const mapRef =
    useRef<mapboxgl.Map | null>(null);

  const markersRef =
    useRef<Map<string, MarkerState>>(
      new Map()
    );

  const clickHandlerRef =
    useRef(onMarkerClick);

  const selectedUserRef =
    useRef<EmployeeMarker | null>(
      selectedUser
    );

  const [mapReady, setMapReady] =
    useState(false);

  // ─────────────────────────────────────────
  // REFERENCES
  // ─────────────────────────────────────────

  useEffect(() => {
    clickHandlerRef.current =
      onMarkerClick;
  }, [onMarkerClick]);

  useEffect(() => {
    selectedUserRef.current =
      selectedUser;
  }, [selectedUser]);

  // ─────────────────────────────────────────
  // MAP INITIALIZE
  // ─────────────────────────────────────────

  useEffect(() => {
    if (
      !mapContainer.current ||
      mapRef.current
    ) {
      return;
    }

    const map =
      new mapboxgl.Map({
        container:
          mapContainer.current,

        style:
          "mapbox://styles/mapbox/standard",

        center: [
          72.3442,
          40.7821,
        ],

        zoom: 15,

        pitch: 60,

        bearing: -20,

        antialias: true,

        attributionControl: false,
      });

    map.on("load", () => {
      try {
        map.setConfigProperty(
          "basemap",
          "lightPreset",
          "day"
        );

        map.setConfigProperty(
          "basemap",
          "show3dBuildings",
          true
        );
      } catch (error) {
        console.warn(
          "⚠️ Map config error:",
          error
        );
      }

      setMapReady(true);
    });

    map.on(
      "error",
      (event) => {
        console.error(
          "❌ Mapbox error:",
          event
        );
      }
    );

    map.addControl(
      new mapboxgl.NavigationControl(),
      "bottom-right"
    );

    mapRef.current = map;

    return () => {
      markersRef.current.forEach(
        ({
          marker,
          animationFrame,
        }) => {
          if (animationFrame) {
            cancelAnimationFrame(
              animationFrame
            );
          }

          marker.remove();
        }
      );

      markersRef.current.clear();

      map.remove();

      mapRef.current = null;
    };
  }, []);

  // ─────────────────────────────────────────
  // MARKERS
  // ─────────────────────────────────────────

  useEffect(() => {
    if (!mapReady) return;

    const map = mapRef.current;

    if (!map) return;

    const currentIds =
      new Set(
        markers.map(
          (marker) =>
            marker.userId
        )
      );

    // ─────────────────────────────────────
    // REMOVE
    // ─────────────────────────────────────

    markersRef.current.forEach(
      (
        {
          marker,
          animationFrame,
        },
        userId
      ) => {
        if (
          !currentIds.has(
            userId
          )
        ) {
          if (
            animationFrame
          ) {
            cancelAnimationFrame(
              animationFrame
            );
          }

          marker.remove();

          markersRef.current.delete(
            userId
          );
        }
      }
    );

    // ─────────────────────────────────────
    // ADD / UPDATE
    // ─────────────────────────────────────

    markers.forEach((emp) => {
      const existing =
        markersRef.current.get(
          emp.userId
        );

      if (existing) {
        updateMarkerElement(
          existing.element,
          emp,
          selectedUserRef.current?.userId ===
            emp.userId
        );

        animateMarker(
          existing,
          emp.longitude,
          emp.latitude
        );

        return;
      }

      const element =
        createMarkerElement(
          emp,
          selectedUserRef.current?.userId ===
            emp.userId
        );

      element.onclick = () => {
        clickHandlerRef.current(
          emp
        );
      };

      const marker =
        new mapboxgl.Marker({
          element,
          anchor: "bottom",
        })
          .setLngLat([
            emp.longitude,
            emp.latitude,
          ])
          .addTo(map);

      markersRef.current.set(
        emp.userId,
        {
          marker,
          element,
          animationFrame:
            null,
          currentLng:
            emp.longitude,
          currentLat:
            emp.latitude,
        }
      );
    });
  }, [
    markers,
    mapReady,
    selectedUser,
  ]);

  // ─────────────────────────────────────────
  // SELECTED USER
  // ─────────────────────────────────────────

  useEffect(() => {
    if (!mapReady) return;

    const map = mapRef.current;

    if (!map) return;

    // update marker visual state

    markersRef.current.forEach(
      (state, userId) => {
        const employee =
          markers.find(
            (item) =>
              item.userId ===
              userId
          );

        if (!employee)
          return;

        updateMarkerElement(
          state.element,
          employee,
          selectedUser?.userId ===
            userId
        );
      }
    );

    if (!selectedUser) {
      return;
    }

    map.flyTo({
      center: [
        selectedUser.longitude,
        selectedUser.latitude,
      ],

      zoom: 17,

      pitch: 60,

      bearing: -20,

      duration: 1200,

      essential: true,
    });
  }, [
    selectedUser,
    mapReady,
  ]);

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
// SMOOTH MARKER MOVEMENT
// ─────────────────────────────────────────────

function animateMarker(
  state: MarkerState,
  targetLng: number,
  targetLat: number
) {
  const startLng =
    state.currentLng;

  const startLat =
    state.currentLat;

  const deltaLng =
    targetLng - startLng;

  const deltaLat =
    targetLat - startLat;

  if (
    Math.abs(deltaLng) <
      0.000001 &&
    Math.abs(deltaLat) <
      0.000001
  ) {
    state.currentLng =
      targetLng;

    state.currentLat =
      targetLat;

    state.marker.setLngLat([
      targetLng,
      targetLat,
    ]);

    return;
  }

  if (state.animationFrame) {
    cancelAnimationFrame(
      state.animationFrame
    );
  }

  const duration = 1200;

  const startTime =
    performance.now();

  const easeInOut = (
    t: number
  ) => {
    return t < 0.5
      ? 2 * t * t
      : 1 -
          Math.pow(
            -2 * t + 2,
            2
          ) /
            2;
  };

  const animate = (
    currentTime: number
  ) => {
    const elapsed =
      currentTime -
      startTime;

    const progress =
      Math.min(
        elapsed / duration,
        1
      );

    const eased =
      easeInOut(progress);

    const lng =
      startLng +
      deltaLng * eased;

    const lat =
      startLat +
      deltaLat * eased;

    state.marker.setLngLat([
      lng,
      lat,
    ]);

    state.currentLng = lng;
    state.currentLat = lat;

    if (progress < 1) {
      state.animationFrame =
        requestAnimationFrame(
          animate
        );
    } else {
      state.currentLng =
        targetLng;

      state.currentLat =
        targetLat;

      state.animationFrame =
        null;
    }
  };

  state.animationFrame =
    requestAnimationFrame(
      animate
    );
}

// ─────────────────────────────────────────────
// UPDATE MARKER
// ─────────────────────────────────────────────

function updateMarkerElement(
  element: HTMLDivElement,
  emp: EmployeeMarker,
  selected: boolean
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
    emp.userId.charCodeAt(0) %
    colors.length;

  const color =
    colors[colorIndex];

  const image =
    element.querySelector(
      ".marker-avatar"
    ) as SVGImageElement | null;

  if (
    image &&
    emp.photo
  ) {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL?.replace(
        "/api/v1",
        ""
      );

    image.setAttribute(
      "href",
      `${apiBase}${emp.photo}`
    );
  }

  const pin =
    element.querySelector(
      ".marker-pin"
    );

  if (pin) {
    pin.setAttribute(
      "fill",
      color
    );
  }

  const halo =
    element.querySelector(
      ".marker-halo"
    ) as SVGCircleElement | null;

  if (halo) {
    halo.setAttribute(
      "stroke",
      selected
        ? "#22c55e"
        : color
    );

    halo.setAttribute(
      "opacity",
      selected
        ? "0.8"
        : "0.35"
    );

    halo.setAttribute(
      "r",
      selected
        ? "24"
        : "20"
    );
  }

  const selectedRing =
    element.querySelector(
      ".selected-ring"
    ) as SVGCircleElement | null;

  if (selectedRing) {
    selectedRing.setAttribute(
      "opacity",
      selected
        ? "1"
        : "0"
    );
  }

  const initials =
    element.querySelector(
      ".marker-initials"
    );

  if (initials) {
    initials.textContent =
      emp.name
        ?.charAt(0)
        ?.toUpperCase() ??
      "?";
  }
}

// ─────────────────────────────────────────────
// CREATE MARKER
// ─────────────────────────────────────────────

function createMarkerElement(
  emp: EmployeeMarker,
  selected: boolean
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
    emp.userId.charCodeAt(0) %
    colors.length;

  const color =
    colors[colorIndex];

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.replace(
      "/api/v1",
      ""
    );

  const imgSrc = emp.photo
    ? `${apiBase}${emp.photo}`
    : null;

  const initials =
    emp.name
      ?.charAt(0)
      ?.toUpperCase() ??
    "?";

  const el =
    document.createElement(
      "div"
    );

  el.style.cssText = `
    width: 72px;
    height: 86px;
    cursor: pointer;
    user-select: none;
    position: relative;
    filter:
      drop-shadow(
        0 8px 14px
        rgba(0,0,0,.35)
      );
    transition:
      transform .2s cubic-bezier(.22,1,.36,1);
  `;

  el.innerHTML = `
    <svg
      width="72"
      height="86"
      viewBox="0 0 72 86"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style="overflow: visible;"
    >

      <defs>

        ${
          imgSrc
            ? `
          <clipPath id="avatar-${emp.userId}">
            <circle
              cx="36"
              cy="25"
              r="16"
            />
          </clipPath>
        `
            : ""
        }

        <!-- soft halo -->

        <filter
          id="glow-${emp.userId}"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur
            stdDeviation="3"
            result="blur"
          />
        </filter>

      </defs>

      <!-- ANIMATED HALO -->

      <circle
        class="marker-halo"
        cx="36"
        cy="25"
        r="${selected ? 24 : 20}"
        stroke="${
          selected
            ? "#22c55e"
            : color
        }"
        stroke-width="1.5"
        opacity="${
          selected
            ? "0.8"
            : "0.35"
        }"
        fill="none"
        style="
          transform-origin:
            36px 25px;
          animation:
            markerHalo 2.2s
            ease-out infinite;
        "
      />

      <!-- SELECTED RING -->

      <circle
        class="selected-ring"
        cx="36"
        cy="25"
        r="27"
        stroke="#22c55e"
        stroke-width="2"
        opacity="${
          selected ? "1" : "0"
        }"
        fill="none"
        style="
          transform-origin:
            36px 25px;
          animation:
            selectedHalo 1.8s
            ease-out infinite;
        "
      />

      <!-- PIN -->

      <path
        class="marker-pin"
        d="
          M36 4
          C24.4 4 15 13.4 15 25
          C15 40.5 36 64 36 64
          C36 64 57 40.5 57 25
          C57 13.4 47.6 4 36 4Z
        "
        fill="${color}"
      />

      <!-- WHITE AVATAR -->

      <circle
        cx="36"
        cy="25"
        r="17"
        fill="white"
      />

      ${
        imgSrc
          ? `
        <image
          class="marker-avatar"
          href="${imgSrc}"
          x="20"
          y="9"
          width="32"
          height="32"
          clip-path="url(#avatar-${emp.userId})"
          preserveAspectRatio="xMidYMid slice"
        />
      `
          : `
        <circle
          cx="36"
          cy="25"
          r="16"
          fill="${color}"
        />

        <text
          class="marker-initials"
          x="36"
          y="30"
          text-anchor="middle"
          fill="white"
          font-size="14"
          font-weight="900"
          font-family="system-ui, sans-serif"
        >
          ${initials}
        </text>
      `
      }

      <!-- ONLINE -->

      <circle
        cx="51"
        cy="11"
        r="6"
        fill="#22c55e"
        stroke="white"
        stroke-width="2"
      />

      <circle
        cx="51"
        cy="11"
        r="3"
        fill="#dcfce7"
        opacity=".9"
      />

    </svg>

    <style>
      @keyframes markerHalo {
        0% {
          transform: scale(.85);
          opacity: .65;
        }

        70% {
          transform: scale(1.2);
          opacity: 0;
        }

        100% {
          transform: scale(1.2);
          opacity: 0;
        }
      }

      @keyframes selectedHalo {
        0% {
          transform: scale(.9);
          opacity: .7;
        }

        70% {
          transform: scale(1.18);
          opacity: 0;
        }

        100% {
          transform: scale(1.18);
          opacity: 0;
        }
      }
    </style>
  `;

  // ─────────────────────────────────────
  // HOVER
  // ─────────────────────────────────────

  el.onmouseenter = () => {
    el.style.transform =
      "scale(1.12) translateY(-3px)";
  };

  el.onmouseleave = () => {
    el.style.transform =
      "scale(1)";
  };

  return el;
}
