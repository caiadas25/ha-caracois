import type { Spot } from "@/lib/types";
import { SERVING_LABELS, SERVICE_ICONS } from "@/lib/types";
import SpotRequestButton from "@/components/SpotRequestButton";

export function Stars({ value }: { value: number }) {
  return (
    <span
      className="text-amber-500 tracking-tight"
      aria-label={`${value} de 5 estrelas`}
    >
      {"★".repeat(value)}
      <span className="text-stone-300">{"★".repeat(5 - value)}</span>
    </span>
  );
}

export function formatPrice(price: number | null): string | null {
  if (price == null) return null;
  return `${price.toFixed(2).replace(".", ",")} €`;
}

/** Cartão compacto mostrado no popup do mapa ao clicar num ponto. */
export default function SpotCard({ spot }: { spot: Spot }) {
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
      <a
        href={`/spot/${spot.id}`}
        className="mt-3 block rounded-lg bg-brand px-3 py-1.5 text-center text-sm font-semibold text-white hover:opacity-90"
      >
        Ver página →
      </a>
      <SpotRequestButton spot={spot} />
    </div>
  );
}
