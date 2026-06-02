import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabase, SPOTS_TABLE } from "@/lib/supabase";
import type { Spot } from "@/lib/types";
import { SERVING_LABELS, SERVICE_LABELS, SERVICE_ICONS } from "@/lib/types";
import { Stars, formatPrice } from "@/components/SpotCard";
import MapView from "@/components/MapView";
import ShareButtons from "@/components/ShareButtons";
import EditSpotButton from "@/components/EditSpotButton";
import DeleteSpotButton from "@/components/DeleteSpotButton";

export const dynamic = "force-dynamic";

async function getSpot(id: string): Promise<Spot | null> {
  const { data } = await supabase
    .from(SPOTS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Spot) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const spot = await getSpot(id);
  if (!spot) return { title: "Local não encontrado — Há Caracóis" };

  const imperial = formatPrice(spot.price_imperial);
  const bits = [
    `${spot.rating}/5 ★`,
    SERVICE_LABELS[spot.service_type],
    SERVING_LABELS[spot.serving_size],
    formatPrice(spot.price),
    imperial ? `imperial ${imperial}` : null,
    spot.address,
  ].filter(Boolean);
  const description = bits.join(" · ");

  return {
    title: `${spot.name} — Há Caracóis 🐌`,
    description,
    openGraph: {
      title: `${spot.name} — Há Caracóis 🐌`,
      description,
      type: "article",
    },
  };
}

export default async function SpotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const spot = await getSpot(id);
  if (!spot) notFound();

  const price = formatPrice(spot.price);
  const priceImperial = formatPrice(spot.price_imperial);
  const created = new Date(spot.created_at).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto min-h-dvh w-full max-w-2xl px-4 py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
      >
        ← Voltar ao mapa
      </Link>

      <article className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {/* Mini-mapa */}
        <div className="h-56 w-full">
          <MapView
            center={{ lat: spot.lat, lng: spot.lng }}
            zoom={15}
            spots={[spot]}
            interactive={false}
          />
        </div>

        <div className="p-5">
          <h1 className="text-2xl font-bold text-stone-900">{spot.name}</h1>
          {spot.address && (
            <p className="mt-1 text-sm text-stone-500">{spot.address}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-lg">
              <Stars value={spot.rating} />
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
              {SERVICE_ICONS[spot.service_type]}{" "}
              {SERVING_LABELS[spot.serving_size]}
            </span>
            {price && (
              <span className="text-lg font-semibold text-brand">
                🐌 {price}
              </span>
            )}
            {priceImperial && (
              <span className="text-lg font-semibold text-brand">
                🍺 {priceImperial}
              </span>
            )}
          </div>

          {spot.notes && (
            <p className="mt-4 whitespace-pre-wrap text-stone-700">
              {spot.notes}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-stone-400">Adicionado a {created}</p>
            <div className="flex items-center gap-2">
              <EditSpotButton spot={spot} />
              <DeleteSpotButton id={spot.id} />
            </div>
          </div>

          <hr className="my-5 border-stone-100" />

          <h2 className="mb-2 text-sm font-semibold text-stone-700">
            Partilhar este local
          </h2>
          <ShareButtons title={spot.name} />
        </div>
      </article>
    </div>
  );
}
