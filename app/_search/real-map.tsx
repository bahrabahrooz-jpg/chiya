"use client";

import { useCallback, useEffect, useRef } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Icon } from "@/components/ui/icon";
import type { SrpListing } from "./data";

const CITY_GEO: Record<string, { lat: number; lng: number; zoom?: number }> = {
  Erbil: { lat: 36.1911, lng: 43.993 },
  Sulaymaniyah: { lat: 35.5556, lng: 45.4329 },
  Duhok: { lat: 36.8669, lng: 42.9503 },
};
const KURDISTAN = { lat: 36.2, lng: 44.1, zoom: 7 };

export interface Marker {
  lat: number;
  lng: number;
  price: string;
  address?: string;
  active?: boolean;
}

/** Short price label for a map pin (e.g. "$1.2M", "$620k", "$2.8k"). */
export function shortPrice(l: SrpListing): string {
  if (l.deal === "rent") return "$" + (l.price >= 1000 ? (l.price / 1000).toFixed(l.price % 1000 ? 1 : 0) + "k" : l.price);
  if (l.price >= 1000000) return "$" + (l.price / 1000000).toFixed(l.price % 1000000 ? 1 : 0) + "M";
  return "$" + Math.round(l.price / 1000) + "k";
}

/** Deterministic golden-angle spread of a city's listings around its centre. */
export function buildMarkers(results: SrpListing[]): Marker[] {
  const seen: Record<string, number> = {};
  return results.slice(0, 40).map((l, i) => {
    const base = CITY_GEO[l.city] || CITY_GEO.Erbil;
    const n = (seen[l.city] = (seen[l.city] || 0) + 1) - 1;
    const ang = n * 2.39996;
    const r = 0.012 + 0.0065 * Math.sqrt(n);
    return {
      lat: base.lat + r * Math.sin(ang) * 0.72,
      lng: base.lng + r * Math.cos(ang),
      price: shortPrice(l),
      address: l.address,
      active: i === 0,
    };
  });
}

export interface RealMapProps {
  markers: Marker[];
  areaLabel: string;
  city: string | null;
}

/** RealMap — Leaflet/OSM map with price pins (loaded client-side only). */
export function RealMap({ markers, areaLabel, city }: RealMapProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);
  const layerRef = useRef<LayerGroup | null>(null);

  const renderMarkers = useCallback(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (layerRef.current) layerRef.current.remove();
    const group = L.layerGroup().addTo(map);
    layerRef.current = group;
    const latlngs: [number, number][] = [];
    markers.forEach((m) => {
      const html = '<span class="srp-mpin' + (m.active ? " is-active" : "") + '">' + m.price + "</span>";
      const icon = L.divIcon({ className: "srp-mpin-wrap", html, iconSize: null });
      L.marker([m.lat, m.lng], { icon, riseOnHover: true })
        .bindPopup("<b>" + m.price + "</b><br>" + (m.address || ""))
        .addTo(group);
      latlngs.push([m.lat, m.lng]);
    });
    if (latlngs.length) {
      map.fitBounds(L.latLngBounds(latlngs).pad(0.25), { animate: true, maxZoom: 14 });
    } else {
      const c = (city && CITY_GEO[city]) || KURDISTAN;
      map.setView([c.lat, c.lng], c.zoom || 12, { animate: true });
    }
  }, [markers, city]);

  // init once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !elRef.current || mapRef.current) return;
      LRef.current = L;
      const start = (city && CITY_GEO[city]) || KURDISTAN;
      const map = L.map(elRef.current, {
        center: [start.lat, start.lng],
        zoom: start.zoom || 12,
        scrollWheelZoom: false,
        zoomControl: false,
        attributionControl: false,
      });
      L.control.zoom({ position: "topright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      mapRef.current = map;
      renderMarkers();
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // re-render markers when results/city change
  useEffect(() => {
    renderMarkers();
  }, [renderMarkers]);

  return (
    <div className="srp-realmap">
      <div className="srp-realmap__canvas" ref={elRef} />
      <div className="srp-realmap__badge">
        <Icon name="map-pin" size={15} />
        <span>{areaLabel}</span>
      </div>
    </div>
  );
}
