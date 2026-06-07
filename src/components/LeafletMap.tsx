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

/** Captura cliques no mapa (ex.: colocar um pin manualmente). */
function ClickHandler({ onClick }: { onClick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

/** Quando um popup abre, recentra o mapa na posição do marker. */
function PopupCenterer({
  onCenter,
}: {
  onCenter?: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (!onCenter) return;
    function handlePopupOpen(e: { popup: L.Popup }) {
      const source = (e.popup as any)._source;
      if (source && typeof source.getLatLng === "function") {
        const ll = source.getLatLng();
        onCenter(ll.lat, ll.lng);
      }
    }
    map.on("popupopen", handlePopupOpen);
    return () => {
      map.off("popupopen", handlePopupOpen);
    };
  }, [map, onCenter]);
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
          <PopupCenterer onCenter={onSpotClick} />
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
