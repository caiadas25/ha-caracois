"use client";

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
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

export interface LeafletMapHandle {
  closePopup: () => void;
}

/** Recentra o mapa sempre que o centro muda. */
function Recenter({ center, zoom }: { center: LatLng; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom, { animate: true });
  }, [center.lat, center.lng, zoom, map]);
  return null;
}

/**
 * Detecta cliques perto de markers e abre o popup + centra o mapa.
 * Funciona em mobile e desktop — não depende de eventHandlers no Marker.
 */
function SpotClickHandler({
  spots,
  onCenter,
}: {
  spots: Spot[];
  onCenter?: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  useMapEvents({
    click(e) {
      // Encontra o marker mais próximo do clique (raio ~30px em graus, varia com zoom)
      const zoom = map.getZoom();
      const threshold = 60 / Math.pow(2, zoom); // ~60m no zoom 15
      let closest: Spot | null = null;
      let minDist = Infinity;
      for (const spot of spots) {
        const dLat = Math.abs(spot.lat - e.latlng.lat);
        const dLng = Math.abs(spot.lng - e.latlng.lng);
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        if (dist < threshold && dist < minDist) {
          minDist = dist;
          closest = spot;
        }
      }
      if (closest && onCenter) {
        onCenter(closest.lat, closest.lng);
      }
    },
  });
  return null;
}

/** Expõe a instância do mapa ao componente pai via ref. */
function MapRef({ mapRef }: { mapRef: React.RefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    return () => {
      mapRef.current = null;
    };
  }, [map, mapRef]);
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
  /** Chamado ao clicar num caracol — useful para recentrar. */
  onSpotClick?: (lat: number, lng: number) => void;
}

const LeafletMap = forwardRef<LeafletMapHandle, LeafletMapProps>(
  function LeafletMap(
    {
      center,
      zoom,
      spots = [],
      pending = null,
      interactive = true,
      onMapClick,
      onSpotClick,
    },
    ref,
  ) {
    const { layer, layerId, select } = useMapLayer();
    const mapInstanceRef = useRef<L.Map | null>(null);

    useImperativeHandle(ref, () => ({
      closePopup: () => {
        mapInstanceRef.current?.closePopup();
      },
    }));

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
          <MapRef mapRef={mapInstanceRef} />
          {/* `key` força a recriação da camada ao trocar de fornecedor. */}
          <TileLayer
            key={layer.id}
            attribution={layer.attribution}
            url={layer.url}
            maxZoom={layer.maxZoom}
          />
          <Recenter center={center} zoom={zoom} />
          <SpotClickHandler spots={spots} onCenter={onSpotClick} />
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
  },
);

export default LeafletMap;
