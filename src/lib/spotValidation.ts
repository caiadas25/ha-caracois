import {
  SERVICE_TYPES,
  SERVING_SIZES_BY_SERVICE,
  type ServiceType,
  type ServingSize,
  type SpotPayload,
} from "@/lib/types";

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Pedido inválido.");
  }
  return value as JsonObject;
}

function text(value: unknown, label: string, max: number): string {
  if (typeof value !== "string") throw new Error(`${label} inválido.`);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) throw new Error(`${label} inválido.`);
  return trimmed;
}

function nullableText(value: unknown, label: string, max: number): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string") throw new Error(`${label} inválido.`);
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > max) throw new Error(`${label} inválido.`);
  return trimmed;
}

function numberValue(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} inválido.`);
  }
  return value;
}

function nullablePrice(value: unknown, label: string): number | null {
  if (value == null || value === "") return null;
  const price = numberValue(value, label);
  if (price < 0 || price > 999) throw new Error(`${label} inválido.`);
  return Math.round(price * 100) / 100;
}

export function parseSpotPayload(value: unknown): SpotPayload {
  const input = asObject(value);
  const serviceType = input.service_type;
  if (
    typeof serviceType !== "string" ||
    !SERVICE_TYPES.includes(serviceType as ServiceType)
  ) {
    throw new Error("Tipo de serviço inválido.");
  }

  const serving = input.serving_size;
  if (
    typeof serving !== "string" ||
    !SERVING_SIZES_BY_SERVICE[serviceType as ServiceType].includes(
      serving as ServingSize,
    )
  ) {
    throw new Error("Tamanho da dose inválido.");
  }

  const rating = input.rating;
  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 0 ||
    rating > 5
  ) {
    throw new Error("Avaliação inválida.");
  }

  const lat = numberValue(input.lat, "Latitude");
  const lng = numberValue(input.lng, "Longitude");
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error("Coordenadas inválidas.");
  }

  return {
    name: text(input.name, "Nome", 200),
    lat,
    lng,
    address: nullableText(input.address, "Morada", 1000),
    price: nullablePrice(input.price, "Preço"),
    price_imperial: nullablePrice(input.price_imperial, "Preço da imperial"),
    service_type: serviceType as ServiceType,
    serving_size: serving as ServingSize,
    rating,
    notes: nullableText(input.notes, "Notas", 2000),
    osm_id: nullableText(input.osm_id, "OpenStreetMap ID", 100),
  };
}
