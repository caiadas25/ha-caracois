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
      <header className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex justify-center p-3">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 shadow-lg backdrop-blur">
          <span className="text-xl">🐌</span>
          <span className="font-bold text-stone-800">Há Caracóis</span>
        </div>
      </header>

      {/* Mapa */}
      <div className="absolute inset-0">
        <MapView center={center} zoom={CITY_ZOOM} spots={spots} />
      </div>

      {/* Tabela de classificação */}
      <Leaderboard
        spots={spots}
        onSelect={(spot) => setCenter({ lat: spot.lat, lng: spot.lng })}
      />

      {/* Aviso de geolocalização recusada */}
      {denied && (
        <div className="absolute inset-x-0 bottom-24 z-[1000] mx-auto w-fit max-w-[90%] rounded-full bg-stone-800/90 px-4 py-2 text-center text-xs text-white">
          Localização indisponível — a mostrar Lisboa.
        </div>
      )}

      {/* Botão de adicionar */}
      <button
        onClick={() => setWizardOpen(true)}
        className="absolute bottom-6 right-6 z-[1000] flex items-center gap-2 rounded-full bg-brand px-5 py-3 font-semibold text-white shadow-xl transition hover:scale-105 active:scale-95"
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
