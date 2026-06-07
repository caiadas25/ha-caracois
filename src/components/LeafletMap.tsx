"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Spot } from "@/lib/types";
import type { LatLng } from "@/hooks/useGeolocation";
import { useMapLayer } from "@/hooks/useMapLayer";
import SpotCard from "./SpotCard";
import LayerControl from "./LayerControl";

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

/** Captura cliques no mapa (ex.: colocar um pin manualmente). */
function ClickHandler({ onClick }: { onClick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
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
  /** Quando definido, clicar no mapa devolve as coordenadas. */
  onMapClick?: (p: LatLng) => void;
  /** Local selecionado — recentra e abre o popup. */
  selectedSpot?: Spot | null;
}

/** Abre o popup do marker correspondente ao local selecionado. */
function PopupOpener({ spot }: { spot: Spot | null }) {
  const map = useMap();
  useEffect(() => {
    if (!spot) return;
    map.eachLayer((layer) => {
      if (
        "getLatLng" in layer &&
        typeof layer.getLatLng === "function" &&
        "openPopup" in layer &&
        typeof layer.openPopup === "function"
      ) {
        const ll = layer.getLatLng();
        if (Math.abs(ll.lat - spot.lat) < 1e-6 && Math.abs(ll.lng - spot.lng) < 1e-6) {
          layer.openPopup();
        }
      }
    });
  }, [spot, map]);
  return null;
}

export default function LeafletMap({
  center,
  zoom,
  spots = [],
  pending = null,
  interactive = true,
  onMapClick,
  selectedSpot = null,
}: LeafletMapProps) {
  const { layer, layerId, select } = useMapLayer();
  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        className="h-full w-full"
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        doubleClickZoom={interactive}
        attributionControl
      >
        {/* `key` força a recriação da camada ao trocar de fornecedor. */}
        <TileLayer
          key={layer.id}
          attribution={layer.attribution}
          url={layer.url}
          maxZoom={layer.maxZoom}
        />
        <Recenter center={center} zoom={zoom} />
        <PopupOpener spot={selectedSpot} />
        {onMapClick && <ClickHandler onClick={onMapClick} />}
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
      {/* Seletor de camada — escondido em mini-mapas não interativos. */}
      {interactive && <LayerControl activeId={layerId} onSelect={select} />}
    </div>
  );
}
