/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import type { EmployeeMarker } from "@/app/dashboard/live-map/page";
import {
  buildLiveMapMarkerLayout,
  getEmployeePositionLabel,
  getLiveTrackingStatus,
} from "@/lib/live-map-layout";
import type { LiveMapMarkerLayout } from "@/lib/live-map-layout";

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

    const markerLayout = buildLiveMapMarkerLayout(markers);

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
        const layout = markerLayout.get(emp.userId);
        existing.marker.setOffset(
          layout?.offset ?? [0, 0]
        );
        existing.element.onclick = () => clickHandlerRef.current(emp);
        existing.element.onkeydown = (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            clickHandlerRef.current(emp);
          }
        };
        updateMarkerLayoutElement(existing.element, layout);

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

      updateMarkerElement(
        element,
        emp,
        selectedUserRef.current?.userId === emp.userId
      );
      updateMarkerLayoutElement(element, markerLayout.get(emp.userId));

      element.onclick = () => {
        clickHandlerRef.current(
          emp
        );
      };
      element.onkeydown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          clickHandlerRef.current(emp);
        }
      };

      const marker =
        new mapboxgl.Marker({
          element,
          anchor: "bottom",
          offset: markerLayout.get(emp.userId)?.offset ?? [0, 0],
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
  element.style.zIndex = selected ? "1000" : "1";
  element.dataset.selected = selected ? "true" : "false";
  const trackingStatus = getLiveTrackingStatus(emp);
  element.dataset.trackingStatus = trackingStatus;
  element.setAttribute("aria-pressed", selected ? "true" : "false");
  element.setAttribute("aria-label", `${emp.name} joylashuvini ko‘rish`);
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
    trackingStatus === "OUTSIDE"
      ? "#EF4444"
      : trackingStatus === "SIGNAL_LOST"
        ? "#F59E0B"
        : colors[colorIndex];

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
        ? trackingStatus === "OUTSIDE"
          ? "#EF4444"
          : trackingStatus === "SIGNAL_LOST"
            ? "#F59E0B"
            : "#22c55e"
        : color
    );

    halo.setAttribute(
      "opacity",
      selected || trackingStatus !== "ONLINE"
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

  updateMarkerInfoLabel(element, emp);
}

function updateMarkerInfoLabel(element: HTMLDivElement, emp: EmployeeMarker) {
  let label = element.querySelector(".live-map-marker-label") as HTMLDivElement | null;
  if (!label) {
    label = document.createElement("div");
    label.className = "live-map-marker-label";

    const name = document.createElement("span");
    name.className = "live-map-marker-name";
    label.appendChild(name);

    const position = document.createElement("span");
    position.className = "live-map-marker-position";
    label.appendChild(position);

    element.appendChild(label);
  }

  const name = label.querySelector(".live-map-marker-name");
  const position = label.querySelector(".live-map-marker-position");
  if (name) name.textContent = emp.name;
  if (position) position.textContent = getEmployeePositionLabel(emp);
}

function updateMarkerLayoutElement(
  element: HTMLDivElement,
  layout?: LiveMapMarkerLayout,
) {
  const existingBadge = element.querySelector(".marker-overlap-badge") as HTMLSpanElement | null;
  const existingLeg = element.querySelector(".marker-spider-leg") as HTMLSpanElement | null;

  if (!layout || layout.groupSize <= 1) {
    existingBadge?.remove();
    existingLeg?.remove();
    element.removeAttribute("data-overlap-count");
    return;
  }

  const [offsetX, offsetY] = layout.offset;
  const leg = existingLeg ?? document.createElement("span");
  const legLength = Math.hypot(offsetX, offsetY);
  const legAngle = Math.atan2(-offsetY, -offsetX);
  leg.className = "marker-spider-leg";
  leg.style.cssText = `
    position: absolute;
    left: 36px;
    top: 86px;
    width: ${legLength}px;
    height: 2px;
    transform: rotate(${legAngle}rad);
    transform-origin: 0 50%;
    border-radius: 999px;
    background: rgba(79, 70, 229, .65);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, .55);
    pointer-events: none;
  `;
  if (!existingLeg) element.prepend(leg);

  const badge = existingBadge ?? document.createElement("span");
  badge.className = "marker-overlap-badge";
  badge.textContent = `${layout.groupIndex + 1}/${layout.groupSize}`;
  badge.style.cssText = `
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 28px;
    height: 20px;
    padding: 0 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 2px solid white;
    background: #4f46e5;
    color: white;
    font: 700 10px/1 system-ui, sans-serif;
    box-shadow: 0 4px 12px rgba(15, 23, 42, .3);
    pointer-events: none;
  `;

  if (!existingBadge) element.appendChild(badge);
  element.setAttribute("data-overlap-count", String(layout.groupSize));
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

  el.className = "live-map-marker";
  el.setAttribute("role", "button");
  el.setAttribute("tabindex", "0");
  el.setAttribute("aria-label", `${emp.name} joylashuvini ko‘rish`);

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
  `;

  el.innerHTML = `
    <svg
      class="marker-graphic"
      width="72"
      height="86"
      viewBox="0 0 72 86"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style="overflow: visible; transform-origin: 36px 64px; transition: transform .2s cubic-bezier(.22,1,.36,1);"
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
    const graphic = el.querySelector(".marker-graphic") as SVGSVGElement | null;
    if (graphic) graphic.style.transform = "scale(1.12) translateY(-3px)";
  };

  el.onmouseleave = () => {
    const graphic = el.querySelector(".marker-graphic") as SVGSVGElement | null;
    if (graphic) graphic.style.transform = "scale(1)";
  };

  return el;
}
