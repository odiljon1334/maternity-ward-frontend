/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { EmployeeMarker } from "@/app/dashboard/live-map/page";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface MapboxMapProps {
  markers: EmployeeMarker[];
  selectedUser: EmployeeMarker | null;
  onMarkerClick: (emp: EmployeeMarker) => void;
}

export default function MapboxMap({ markers, selectedUser, onMarkerClick }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  // Map initialize
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

    map.on("style.load", () => {
        map.on("style.load", () => {
        map.setConfigProperty("basemap", "lightPreset", "day");
        map.setConfigProperty("basemap", "show3dBuildings", true);
    });
});

    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Markerlarni yangilash
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set(markers.map((m) => m.userId));

    // Eski markerlarni o'chirish
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Yangi/mavjud markerlarni qo'shish/yangilash
    markers.forEach((emp) => {
      const existing = markersRef.current.get(emp.userId);

      if (existing) {
        existing.setLngLat([emp.longitude, emp.latitude]);
      } else {
        const el = createMarkerElement(emp, onMarkerClick);
        const marker = new mapboxgl.Marker(el)
          .setLngLat([emp.longitude, emp.latitude])
          .addTo(map);
        markersRef.current.set(emp.userId, marker);
      }
    });
  }, [markers, onMarkerClick]);

  // Tanlangan user ga flyTo
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedUser) return;

    map.flyTo({
      center: [selectedUser.longitude, selectedUser.latitude],
      zoom: 16,
      pitch: 60,
      bearing: -20,
      duration: 1500,
    });
  }, [selectedUser]);

  return (
    <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
  );
}

function createMarkerElement(emp: EmployeeMarker, onClick: (emp: EmployeeMarker) => void) {
  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', 
    '#10B981', '#EF4444', '#06B6D4', '#F97316'
  ];
  
  // UserId dan rang tanlash (har xodimga doimiy rang)
  const colorIndex = emp.userId.charCodeAt(0) % colors.length;
  const color = colors[colorIndex];
  
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "");
  const imgSrc = emp.photo ? `${apiBase}${emp.photo}` : null;
  const initials = emp.name?.charAt(0) ?? "?";

  const el = document.createElement("div");
  el.style.cssText = "cursor: pointer; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));";
  el.onclick = () => onClick(emp);

  el.innerHTML = `
    <svg width="56" height="72" viewBox="0 0 56 72" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <clipPath id="circle-${emp.userId}">
          <circle cx="28" cy="24" r="20"/>
        </clipPath>
        <pattern id="img-${emp.userId}" patternUnits="objectBoundingBox" width="1" height="1">
          ${imgSrc ? `<image href="${imgSrc}" width="40" height="40" preserveAspectRatio="xMidYMid slice"/>` : ''}
        </pattern>
      </defs>
      
      <!-- Pin shape -->
      <path d="M28 0C17.5 0 9 8.5 9 19C9 33 28 52 28 52C28 52 47 33 47 19C47 8.5 38.5 0 28 0Z" fill="${color}"/>
      
      <!-- White circle border -->
      <circle cx="28" cy="19" r="15" fill="white"/>
      
      <!-- Avatar -->
      ${imgSrc 
        ? `<image href="${imgSrc}" x="13" y="4" width="30" height="30" clip-path="url(#circle-clip-${emp.userId})" preserveAspectRatio="xMidYMid slice"/>
           <clipPath id="circle-clip-${emp.userId}"><circle cx="28" cy="19" r="14"/></clipPath>`
        : `<circle cx="28" cy="19" r="14" fill="${color}"/>
           <text x="28" y="24" text-anchor="middle" fill="white" font-size="13" font-weight="900" font-family="sans-serif">${initials}</text>`
      }
      
      <!-- Online dot -->
      <circle cx="42" cy="6" r="5" fill="#22c55e" stroke="white" stroke-width="2"/>
    </svg>
  `;

  el.onmouseenter = () => (el.style.transform = "scale(1.15)");
  el.onmouseleave = () => (el.style.transform = "scale(1)");

  return el;
}