"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Spot } from "@/lib/types";
import type { LatLng } from "@/hooks/useGeolocation";
import SpotCard from "./SpotCard";

const snailIcon = L.divIcon({
  html: "🐌",
  className: "snail-marker",
  iconSize: [32, 32],
  iconAnchor: [16, 30],
  popupAnchor: [0, -28],
});

const pendingIcon = L.divIcon({
  html: "📍",
  className: "snail-marker",
  iconSize: [32, 32],
  iconAnchor: [16, 30],
});

/** Recentra o mapa sempre que o centro muda. */
function Recenter({ center, zoom }: { center: LatLng; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom, { animate: true });
  }, [center.lat, center.lng, zoom, map]);
  return null;
}

export interface LeafletMapProps {
  center: LatLng;
  zoom: number;
  spots?: Spot[];
  /** Marcador temporário (ex.: local a adicionar). */
  pending?: LatLng | null;
  /** Desativa interação — útil para mini-mapas. */
  interactive?: boolean;
}

export default function LeafletMap({
  center,
  zoom,
  spots = [],
  pending = null,
  interactive = true,
}: LeafletMapProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      className="h-full w-full"
      scrollWheelZoom={interactive}
      dragging={interactive}
      zoomControl={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      keyboard={interactive}
      boxZoom={interactive}
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} zoom={zoom} />
      {spots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lng]}
          icon={snailIcon}
        >
          <Popup>
            <SpotCard spot={spot} />
          </Popup>
        </Marker>
      ))}
      {pending && (
        <Marker position={[pending.lat, pending.lng]} icon={pendingIcon} />
      )}
    </MapContainer>
  );
}
