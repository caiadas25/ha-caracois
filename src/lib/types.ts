export type ServingSize =
  | "pires"
  | "prato"
  | "travessa"
  | "pequena"
  | "media"
  | "grande";

/** Como o local serve os caracóis. */
export type ServiceType = "restaurante" | "takeaway";

export interface Spot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  price: number | null;
  /** Preço da imperial (cerveja), opcional. */
  price_imperial: number | null;
  service_type: ServiceType;
  serving_size: ServingSize;
  rating: number;
  notes: string | null;
  osm_id: string | null;
  created_at: string;
}

export type SpotPayload = Omit<Spot, "id" | "created_at">;

/** Dados necessários para criar um novo registo. */
export type NewSpot = SpotPayload;

export type SpotRequestType = "edit" | "delete";
export type SpotRequestStatus = "pending" | "resolved" | "dismissed";

export interface SpotRequest {
  id: string;
  spot_id: string | null;
  spot_name: string;
  spot_address: string | null;
  request_type: SpotRequestType;
  note: string;
  status: SpotRequestStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface AdminSpotRequest extends SpotRequest {
  spot: Spot | null;
}

export const SERVICE_TYPES: ServiceType[] = ["restaurante", "takeaway"];

export const SERVICE_LABELS: Record<ServiceType, string> = {
  restaurante: "No Restaurante",
  takeaway: "Take-away",
};

export const SERVICE_ICONS: Record<ServiceType, string> = {
  restaurante: "🍽️",
  takeaway: "🥡",
};

/** Tamanhos de dose disponíveis consoante o tipo de serviço. */
export const SERVING_SIZES_BY_SERVICE: Record<ServiceType, ServingSize[]> = {
  restaurante: ["pires", "prato", "travessa"],
  takeaway: ["pequena", "media", "grande"],
};

export const SERVING_LABELS: Record<ServingSize, string> = {
  pires: "Pires",
  prato: "Prato",
  travessa: "Travessa",
  pequena: "Embalagem pequena",
  media: "Embalagem média",
  grande: "Embalagem grande",
};

export const SERVING_DESCRIPTIONS: Record<ServingSize, string> = {
  pires: "Dose pequena, para petiscar",
  prato: "Dose individual",
  travessa: "Dose para partilhar",
  pequena: "Para uma pessoa",
  media: "Para duas pessoas",
  grande: "Para partilhar",
};

/** Resultado de pesquisa de estabelecimentos (via OpenStreetMap / Nominatim). */
export interface PlaceResult {
  osm_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}
