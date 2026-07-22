"use client";

import { useEffect, useRef, useState } from "react";

interface MapPickerProps {
  lat: number;
  lng: number;
  onMove: (lat: number, lng: number) => void;
}

export default function MapPicker({ lat, lng, onMove }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<{
    map: { setView: (p: [number, number], z: number) => void; remove: () => void; on: (e: string, fn: (e: unknown) => void) => void };
    marker: { setLatLng: (p: [number, number]) => void; getLatLng: () => { lat: number; lng: number }; on: (e: string, fn: () => void) => void };
  } | null>(null);
  const [ready, setReady] = useState(false);

  // Init map sekali saja
  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return;

    import("leaflet").then((L) => {
      // Fix icon
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Load CSS jika belum
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const map = L.map(mapRef.current!).setView([lat, lng], 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org">OpenStreetMap</a>',
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onMove(pos.lat, pos.lng);
      });

      map.on("click", (e: unknown) => {
        const ev = e as { latlng: { lat: number; lng: number } };
        marker.setLatLng([ev.latlng.lat, ev.latlng.lng]);
        onMove(ev.latlng.lat, ev.latlng.lng);
      });

      instanceRef.current = { map, marker } as unknown as typeof instanceRef.current;
      setReady(true);
    });

    return () => {
      if (instanceRef.current) {
        instanceRef.current.map.remove();
        instanceRef.current = null;
      }
    };
  }, []); // eslint-disable-line

  // Update posisi saat lat/lng berubah dari luar (geocode result)
  useEffect(() => {
    if (!ready || !instanceRef.current) return;
    instanceRef.current.marker.setLatLng([lat, lng]);
    instanceRef.current.map.setView([lat, lng], 15);
  }, [lat, lng, ready]);

  return <div ref={mapRef} className="h-52 rounded-xl overflow-hidden border border-border" style={{ zIndex: 0 }} />;
}
