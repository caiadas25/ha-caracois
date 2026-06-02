"use client";

import { useMemo, useState } from "react";
import type { Spot } from "@/lib/types";

interface Props {
  spots: Spot[];
  /** Chamado ao clicar num local — útil para recentrar o mapa. */
  onSelect?: (spot: Spot) => void;
}

const MEDALS = ["🥇", "🥈", "🥉"];

/** Widget com os 10 locais mais bem avaliados, com filtro por cidade. */
export default function Leaderboard({ spots, onSelect }: Props) {
  const [city, setCity] = useState("");
  const [open, setOpen] = useState(true);

  const top = useMemo(() => {
    const q = city.trim().toLowerCase();
    return spots
      .filter((s) => !q || (s.address ?? "").toLowerCase().includes(q))
      .slice()
      .sort(
        (a, b) =>
          b.rating - a.rating ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 10);
  }, [spots, city]);

  return (
    <div className="absolute bottom-6 left-6 z-[1000] w-72 max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl bg-white/95 shadow-xl backdrop-blur">
      {/* Cabeçalho / interruptor */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 font-bold text-stone-800">
          🏆 Melhores locais
        </span>
        <span className="text-stone-400">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="border-t border-stone-100">
          {/* Filtro por cidade */}
          <div className="p-3">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Filtrar por cidade…"
              className="w-full rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-800 outline-none focus:border-brand"
            />
          </div>

          {/* Lista */}
          {top.length === 0 ? (
            <p className="px-4 pb-4 text-sm text-stone-400">
              {city.trim()
                ? `Sem locais para «${city.trim()}».`
                : "Ainda não há locais."}
            </p>
          ) : (
            <ol className="max-h-72 overflow-y-auto pb-2">
              {top.map((spot, i) => (
                <li key={spot.id}>
                  <button
                    onClick={() => onSelect?.(spot)}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-stone-50"
                  >
                    <span className="w-6 shrink-0 text-center text-sm font-semibold text-stone-500">
                      {MEDALS[i] ?? i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-stone-800">
                        {spot.name}
                      </span>
                      {spot.address && (
                        <span className="block truncate text-xs text-stone-400">
                          {spot.address}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-amber-500">
                      ★ {spot.rating}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
