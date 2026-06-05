"use client";

import { useEffect, useRef, useState } from "react";
import { MAP_LAYERS, getLayer } from "@/lib/mapLayers";

interface LayerControlProps {
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * Botão flutuante que abre um menu para escolher a camada do mapa.
 * Renderizado fora do MapContainer, por isso não interfere com o Leaflet.
 */
export default function LayerControl({ activeId, onSelect }: LayerControlProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = getLayer(activeId);

  // Fecha o menu ao clicar fora.
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div
      ref={ref}
      className="absolute right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[1000] sm:top-3"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Escolher camada do mapa"
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-xl shadow-lg backdrop-blur transition hover:scale-105 active:scale-95"
      >
        {active.icon}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl bg-white/95 shadow-xl backdrop-blur">
          <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-stone-400">
            Camada do mapa
          </p>
          {MAP_LAYERS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                onSelect(l.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${
                activeId === l.id
                  ? "bg-amber-50 font-medium text-brand"
                  : "text-stone-700 hover:bg-stone-50"
              }`}
            >
              <span className="text-base leading-none">{l.icon}</span>
              <span className="flex-1">{l.label}</span>
              {activeId === l.id && <span aria-hidden>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
