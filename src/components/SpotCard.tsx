"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Spot } from "@/lib/types";
import { SERVING_LABELS, SERVICE_ICONS } from "@/lib/types";
import SpotRequestButton from "@/components/SpotRequestButton";

export function Stars({ value }: { value: number }) {
  const safeValue =
    Number.isInteger(value) && value >= 0 && value <= 5 ? value : 0;

  return (
    <span
      className="text-amber-500 tracking-tight"
      aria-label={`${safeValue} de 5 estrelas`}
    >
      {"★".repeat(safeValue)}
      <span className="text-stone-300">{"★".repeat(5 - safeValue)}</span>
    </span>
  );
}

export function formatPrice(price: number | null): string | null {
  if (price == null) return null;
  return `${price.toFixed(2).replace(".", ",")} €`;
}

/** Cartão compacto mostrado no popup do mapa ao clicar num ponto. */
export default function SpotCard({ spot }: { spot: Spot }) {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const price = formatPrice(spot.price);
  const priceImperial = formatPrice(spot.price_imperial);
  return (
    <div className="w-60 p-3 text-stone-800">
      <h3 className="text-base font-semibold leading-tight">{spot.name}</h3>
      {spot.address && (
        <p className="mt-0.5 text-xs text-stone-500 line-clamp-2">
          {spot.address}
        </p>
      )}
      <div className="mt-2 flex items-center gap-2 text-sm">
        <Stars value={spot.rating} />
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
          {SERVICE_ICONS[spot.service_type]} {SERVING_LABELS[spot.serving_size]}
        </span>
      </div>
      {(price || priceImperial) && (
        <p className="mt-1 flex flex-wrap gap-x-3 text-sm font-medium text-brand">
          {price && <span>🐌 {price}</span>}
          {priceImperial && <span>🍺 {priceImperial}</span>}
        </p>
      )}
      {spot.notes && (
        <p className="mt-1 text-xs text-stone-600 line-clamp-3">{spot.notes}</p>
      )}
      <button
        disabled={navigating}
        onClick={() => {
          setNavigating(true);
          router.push(`/spot/${spot.id}`);
        }}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-70"
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
      <SpotRequestButton spot={spot} />
    </div>
  );
}
