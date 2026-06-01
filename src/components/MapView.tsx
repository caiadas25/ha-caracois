"use client";

import dynamic from "next/dynamic";
import type { LeafletMapProps } from "./LeafletMap";

// O Leaflet acede ao `window`, por isso só pode correr no browser (ssr: false).
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-stone-100 text-stone-400">
      A carregar mapa…
    </div>
  ),
});

export default function MapView(props: LeafletMapProps) {
  return <LeafletMap {...props} />;
}
