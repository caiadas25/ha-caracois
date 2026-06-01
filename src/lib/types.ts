export type ServingSize = "pires" | "prato" | "travessa";

export interface Spot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  price: number | null;
  serving_size: ServingSize;
  rating: number;
  notes: string | null;
  osm_id: string | null;
  created_at: string;
}

/** Dados necessários para criar um novo registo. */
export type NewSpot = Omit<Spot, "id" | "created_at">;

export const SERVING_SIZES: ServingSize[] = ["pires", "prato", "travessa"];

export const SERVING_LABELS: Record<ServingSize, string> = {
  pires: "Pires",
  prato: "Prato",
  travessa: "Travessa",
};

export const SERVING_DESCRIPTIONS: Record<ServingSize, string> = {
  pires: "Dose pequena, para petiscar",
  prato: "Dose individual",
  travessa: "Dose para partilhar",
};

/** Resultado de pesquisa de estabelecimentos (via OpenStreetMap / Nominatim). */
export interface PlaceResult {
  osm_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}
