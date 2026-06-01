/** Camadas de mapa disponíveis (todas baseadas em OpenStreetMap). */
export interface MapLayer {
  id: string;
  /** Nome apresentado ao utilizador. */
  label: string;
  /** Emoji ilustrativo para o seletor. */
  icon: string;
  url: string;
  attribution: string;
  /** Zoom máximo suportado pelo fornecedor (opcional). */
  maxZoom?: number;
}

export const MAP_LAYERS: MapLayer[] = [
  {
    id: "standard",
    label: "Padrão",
    icon: "🗺️",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  {
    id: "humanitarian",
    label: "Humanitário",
    icon: "🚑",
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles cortesia de <a href="https://www.hotosm.org/">HOT</a>',
    maxZoom: 19,
  },
  {
    id: "topo",
    label: "Topográfico",
    icon: "⛰️",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      'Dados: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | Visualização: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
  {
    id: "light",
    label: "Claro",
    icon: "☀️",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  {
    id: "dark",
    label: "Escuro",
    icon: "🌙",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  {
    id: "satellite",
    label: "Satélite",
    icon: "🛰️",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    maxZoom: 19,
  },
];

export const DEFAULT_LAYER_ID = "standard";

export function getLayer(id: string | null | undefined): MapLayer {
  return MAP_LAYERS.find((l) => l.id === id) ?? MAP_LAYERS[0];
}
