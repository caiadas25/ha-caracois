"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MapView from "@/components/MapView";
import type { LeafletMapHandle } from "@/components/LeafletMap";
import AddSpotWizard from "@/components/AddSpotWizard";
import Leaderboard from "@/components/Leaderboard";
import { supabase, SPOTS_TABLE } from "@/lib/supabase";
import type { Spot } from "@/lib/types";
import {
  useGeolocation,
  DEFAULT_CENTER,
  CITY_ZOOM,
  type LatLng,
} from "@/hooks/useGeolocation";

export default function Home() {
  const router = useRouter();
  const mapRef = useRef<LeafletMapHandle>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [center, setCenter] = useState<LatLng>(DEFAULT_CENTER);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const { position, denied, request } = useGeolocation();

  // Pede a localização ao carregar para centrar o mapa.
  useEffect(() => {
    request();
  }, [request]);

  useEffect(() => {
    if (position) setCenter(position);
  }, [position]);

  // Carrega os locais existentes.
  const loadSpots = useCallback(async () => {
    const { data } = await supabase
      .from(SPOTS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setSpots(data as Spot[]);
  }, []);

  useEffect(() => {
    loadSpots();
  }, [loadSpots]);

  function handleCreated(spot: Spot) {
    setSpots((prev) => [spot, ...prev]);
    setCenter({ lat: spot.lat, lng: spot.lng });
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      {/* Cabeçalho */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-[1001] flex justify-center px-3 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:p-3">
        <div className="pointer-events-auto flex h-12 max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full bg-white/95 px-4 shadow-lg backdrop-blur sm:h-auto sm:py-2">
          <span className="text-xl">🐌</span>
          <span className="truncate font-bold text-stone-800">Há Caracóis</span>
        </div>
      </header>

      {/* Mapa */}
      <div className="absolute inset-0">
        <MapView
          ref={mapRef}
          center={center}
          zoom={CITY_ZOOM}
          spots={spots}
          onSpotClick={(lat, lng) => setCenter({ lat, lng })}
        />
      </div>

      {/* Cartão de detalhe do local selecionado */}
      {selectedSpot && (
        <div
          className="absolute inset-0 z-[1002] flex items-center justify-center bg-black/40 px-4"
          onClick={() => setSelectedSpot(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedSpot(null)}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200"
              aria-label="Fechar"
            >
              ✕
            </button>
            <h3 className="pr-8 text-lg font-bold leading-tight text-stone-800">
              {selectedSpot.name}
            </h3>
            {selectedSpot.address && (
              <p className="mt-1 text-sm text-stone-500 line-clamp-2">
                {selectedSpot.address}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-amber-500">
                {"★".repeat(selectedSpot.rating)}
                <span className="text-stone-300">{"★".repeat(5 - selectedSpot.rating)}</span>
              </span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                {selectedSpot.serving_size}
              </span>
            </div>
            {selectedSpot.notes && (
              <p className="mt-2 text-sm text-stone-600 line-clamp-3">
                {selectedSpot.notes}
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                disabled={navigating}
                onClick={() => {
                  setNavigating(true);
                  router.push(`/spot/${selectedSpot.id}`);
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-70"
              >
                {navigating ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    A abrir…
                  </>
                ) : (
                  "Ver página →"
                )}
              </button>
              <button
                onClick={() => setSelectedSpot(null)}
                className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de classificação */}
      <Leaderboard
        spots={spots}
        onSelect={(spot) => {
          setCenter({ lat: spot.lat, lng: spot.lng });
          setSelectedSpot(spot);
        }}
        onAdd={() => setWizardOpen(true)}
        onInteract={() => mapRef.current?.closePopup()}
      />

      {/* Aviso de geolocalização recusada */}
      {denied && (
        <div className="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+4.75rem)] z-[1000] mx-auto w-fit max-w-[90%] rounded-full bg-stone-800/90 px-4 py-2 text-center text-xs text-white sm:bottom-24 sm:top-auto">
          Localização indisponível — a mostrar Lisboa.
        </div>
      )}

      {/* Botão de adicionar */}
      <button
        onClick={() => setWizardOpen(true)}
        className="absolute bottom-6 right-6 z-[1000] hidden items-center gap-2 rounded-full bg-brand px-5 py-3 font-semibold text-white shadow-xl transition hover:scale-105 active:scale-95 sm:flex"
      >
        <span className="text-lg leading-none">＋</span> Adicionar
      </button>

      <AddSpotWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        userPosition={position}
        onSaved={handleCreated}
      />
    </main>
  );
}
