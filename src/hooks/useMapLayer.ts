"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_LAYER_ID,
  MAP_LAYERS,
  getLayer,
  type MapLayer,
} from "@/lib/mapLayers";

const STORAGE_KEY = "ha-caracois:map-layer";

/**
 * Gere a camada de mapa escolhida, guardando a preferência em localStorage.
 * Começa sempre na camada por omissão para evitar diferenças de SSR.
 */
export function useMapLayer(): {
  layer: MapLayer;
  layerId: string;
  select: (id: string) => void;
} {
  const [layerId, setLayerId] = useState<string>(DEFAULT_LAYER_ID);

  // Lê a preferência guardada depois da montagem (só existe no browser).
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && MAP_LAYERS.some((l) => l.id === saved)) {
      setLayerId(saved);
    }
  }, []);

  const select = useCallback((id: string) => {
    setLayerId(id);
    window.localStorage.setItem(STORAGE_KEY, id);
  }, []);

  return { layer: getLayer(layerId), layerId, select };
}
