"use client";

import { useMemo, useState } from "react";
import type { Spot } from "@/lib/types";

interface Props {
  spots: Spot[];
  /** Chamado ao clicar num local — útil para recentrar o mapa. */
  onSelect?: (spot: Spot) => void;
  /** Abre o assistente para adicionar um novo local. */
  onAdd?: () => void;
  /** Chamado em qualquer interação com o leaderboard (para fechar popups). */
  onInteract?: () => void;
}

const MEDALS = ["🥇", "🥈", "🥉"];

/** Widget com os 10 locais mais bem avaliados, com filtro por cidade. */
export default function Leaderboard({ spots, onSelect, onAdd, onInteract }: Props) {
  const [city, setCity] = useState("");
  const [open, setOpen] = useState(false);

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
    <>
      <div
        className="mobile-leaderboard-sheet absolute inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+2.25rem)] z-[1000] flex max-h-[42dvh] flex-col overflow-hidden rounded-xl bg-white/95 shadow-2xl backdrop-blur sm:bottom-6 sm:left-6 sm:right-auto sm:max-h-none sm:w-72 sm:max-w-[calc(100vw-3rem)] sm:shadow-xl"
        onClick={onInteract}
      >
        {/* Cabeçalho / interruptor — todo o pill é clicável */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="mobile-leaderboard-header flex w-full items-center gap-2 px-4 py-3 text-left"
          aria-expanded={open}
          aria-label={
            open ? "Recolher melhores locais" : "Expandir melhores locais"
          }
        >
          <span className="min-w-0 flex-1 text-sm font-bold leading-tight text-stone-800 sm:text-base">
            Melhores Estabelecimentos
          </span>
          <svg
            aria-hidden
            className={`h-4 w-4 shrink-0 text-stone-500 ${open ? "" : "-rotate-90"}`}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.25"
            viewBox="0 0 24 24"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="mobile-leaderboard-add absolute z-[1001] flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-3 py-2 text-sm font-semibold text-white shadow-md transition active:scale-95 sm:hidden"
            aria-label="Adicionar local"
          >
            <span className="text-lg leading-none" aria-hidden>
              ＋
            </span>
            <span>Adicionar</span>
          </button>
        )}

        {open && (
          <div className="mobile-leaderboard-body flex min-h-0 flex-col border-t border-stone-100">
            {/* Filtro por cidade */}
            <div className="shrink-0 p-3">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Filtrar por cidade…"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-base text-stone-800 outline-none focus:border-brand sm:py-1.5 sm:text-sm"
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
              <ol className="min-h-0 overflow-y-auto pb-2 sm:max-h-72">
                {top.map((spot, i) => (
                  <li key={spot.id}>
                    <button
                      onClick={() => onSelect?.(spot)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-stone-50 sm:py-2"
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
    </>
  );
}
