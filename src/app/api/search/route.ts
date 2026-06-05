import { NextResponse } from "next/server";
import { rateLimitByIp } from "@/lib/requestSecurity";
import type { PlaceResult } from "@/lib/types";

// Tipagem parcial da resposta do Nominatim.
interface NominatimItem {
  osm_id: number;
  osm_type: string;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  error?: string;
}

const NOMINATIM_HEADERS = {
  "User-Agent": "HaCaracois/1.0 (https://github.com/caiadas25/ha-caracois)",
};

function parseLatLng(lat: string | null, lng: string | null) {
  if (!lat || !lng) return null;
  const la = parseFloat(lat);
  const ln = parseFloat(lng);
  if (
    !Number.isFinite(la) ||
    !Number.isFinite(ln) ||
    la < -90 ||
    la > 90 ||
    ln < -180 ||
    ln > 180
  ) {
    return null;
  }
  return { la, ln };
}

/** Geocodificação inversa: dado um ponto, devolve a morada mais próxima. */
async function reverseGeocode(la: number, ln: number) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(la));
  url.searchParams.set("lon", String(ln));
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "pt");

  const res = await fetch(url, {
    headers: NOMINATIM_HEADERS,
    next: { revalidate: 3600 },
  });
  if (!res.ok) return NextResponse.json<PlaceResult[]>([], { status: 200 });

  const item = (await res.json()) as NominatimItem;
  if (!item || item.error) return NextResponse.json<PlaceResult[]>([]);

  return NextResponse.json<PlaceResult[]>([
    {
      osm_id: `${item.osm_type}/${item.osm_id}`,
      name: item.name || item.display_name.split(",")[0],
      address: item.display_name,
      lat: la,
      lng: ln,
    },
  ]);
}

/**
 * Proxy de pesquisa de estabelecimentos via OpenStreetMap (Nominatim).
 * Feita no servidor para definir um User-Agent válido (exigido pela política
 * de utilização do Nominatim) e evitar problemas de CORS no browser.
 *
 * Com `q` faz pesquisa por texto; com `lat`/`lng` mas sem `q` faz
 * geocodificação inversa (para um pin colocado manualmente no mapa).
 */
export async function GET(request: Request) {
  const limited = rateLimitByIp(request, "search", 60, 60 * 1000);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  // Coordenadas opcionais para enviesar os resultados para perto do utilizador.
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (q && q.length > 120) {
    return NextResponse.json<PlaceResult[]>([], { status: 400 });
  }

  const coords = parseLatLng(lat, lng);
  const hasQuery = !!q && q.length >= 2;

  if (!hasQuery) {
    // Sem texto, mas com coordenadas → geocodificação inversa.
    if (coords) {
      try {
        return await reverseGeocode(coords.la, coords.ln);
      } catch {
        return NextResponse.json<PlaceResult[]>([], { status: 200 });
      }
    }
    return NextResponse.json<PlaceResult[]>([]);
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", q!);
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "pt");
  if (coords) {
    // Caixa de ~0.5° à volta do utilizador, sem excluir resultados de fora.
    url.searchParams.set(
      "viewbox",
      `${coords.ln - 0.5},${coords.la + 0.5},${coords.ln + 0.5},${
        coords.la - 0.5
      }`,
    );
    url.searchParams.set("bounded", "0");
  }

  try {
    const res = await fetch(url, {
      headers: NOMINATIM_HEADERS,
      // Resultados podem ser cacheados durante 1h.
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json<PlaceResult[]>([], { status: 200 });
    }

    const data = (await res.json()) as NominatimItem[];
    const results: PlaceResult[] = data.map((item) => ({
      osm_id: `${item.osm_type}/${item.osm_id}`,
      name: item.name || item.display_name.split(",")[0],
      address: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));

    return NextResponse.json(results);
  } catch {
    return NextResponse.json<PlaceResult[]>([], { status: 200 });
  }
}
