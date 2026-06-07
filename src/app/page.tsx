"use client";

import { useCallback, useEffect, useState } from "react";
import MapView from "@/components/MapView";
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
  const [spots, setSpots] = useState<Spot[]>([]);
  const [center, setCenter] = useState<LatLng>(DEFAULT_CENTER);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
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
        <MapView center={center} zoom={CITY_ZOOM} spots={spots} selectedSpot={selectedSpot} />
      </div>

      {/* Tabela de classificação */}
      <Leaderboard
        spots={spots}
        onSelect={(spot) => {
          setCenter({ lat: spot.lat, lng: spot.lng });
          setSelectedSpot(spot);
        }}
        onAdd={() => setWizardOpen(true)}
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
