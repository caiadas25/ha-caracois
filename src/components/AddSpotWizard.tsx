"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, SPOTS_TABLE } from "@/lib/supabase";
import MapView from "@/components/MapView";
import {
  SERVICE_TYPES,
  SERVICE_LABELS,
  SERVING_SIZES_BY_SERVICE,
  SERVING_LABELS,
  SERVING_DESCRIPTIONS,
  type PlaceResult,
  type ServiceType,
  type ServingSize,
  type Spot,
} from "@/lib/types";
import { DEFAULT_CENTER, type LatLng } from "@/hooks/useGeolocation";

interface ChosenPlace {
  lat: number;
  lng: number;
  address: string | null;
  osm_id: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  userPosition: LatLng | null;
  onSaved: (spot: Spot) => void;
  /** Quando presente, o assistente abre em modo de edição. */
  spot?: Spot | null;
}

const TOTAL_STEPS = 6;

/** Converte o texto de um preço (com vírgula ou ponto) num número ou null. */
function parsePrice(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = parseFloat(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

/** Apresenta um número como texto editável (vírgula decimal). */
function priceToInput(value: number | null): string {
  return value != null ? String(value).replace(".", ",") : "";
}

export default function AddSpotWizard({
  open,
  onClose,
  userPosition,
  onSaved,
  spot = null,
}: Props) {
  const editing = !!spot;
  const [step, setStep] = useState(1);

  // Passo 1 — nome + localização
  const [name, setName] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [place, setPlace] = useState<ChosenPlace | null>(null);

  // Colocação manual de um pin no mapa.
  const [picking, setPicking] = useState(false);
  const [pinned, setPinned] = useState<LatLng | null>(null);
  const [pinAddress, setPinAddress] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const pinReqId = useRef(0);

  // Passos seguintes
  const [price, setPrice] = useState("");
  const [priceImperial, setPriceImperial] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("restaurante");
  const [serving, setServing] = useState<ServingSize | null>(null);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setStep(1);
    setName("");
    setResults([]);
    setPlace(null);
    setPicking(false);
    setPinned(null);
    setPinAddress(null);
    setPinLoading(false);
    setPrice("");
    setPriceImperial("");
    setServiceType("restaurante");
    setServing(null);
    setRating(0);
    setNotes("");
    setError(null);
    setSubmitting(false);
  }

  // Ao abrir, preenche os campos a partir do local em edição (ou limpa).
  useEffect(() => {
    if (!open) return;
    if (spot) {
      setStep(1);
      setName(spot.name);
      setResults([]);
      setPlace({
        lat: spot.lat,
        lng: spot.lng,
        address: spot.address,
        osm_id: spot.osm_id,
      });
      setPrice(priceToInput(spot.price));
      setPriceImperial(priceToInput(spot.price_imperial));
      setServiceType(spot.service_type);
      setServing(spot.serving_size);
      setRating(spot.rating);
      setNotes(spot.notes ?? "");
      setError(null);
      setSubmitting(false);
    } else {
      reset();
    }
    // Reinicializa apenas quando (re)abre ou muda o local em edição.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, spot]);

  function close() {
    reset();
    onClose();
  }

  // Pesquisa de estabelecimentos (Nominatim), com debounce.
  useEffect(() => {
    const q = name.trim();
    if (q.length < 2 || place) {
      setResults([]);
      return;
    }
    setSearching(true);
    const id = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q });
        if (userPosition) {
          params.set("lat", String(userPosition.lat));
          params.set("lng", String(userPosition.lng));
        }
        const res = await fetch(`/api/search?${params}`);
        setResults(await res.json());
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => clearTimeout(id);
  }, [name, place, userPosition]);

  if (!open) return null;

  function pickResult(r: PlaceResult) {
    setName(r.name);
    setPlace({ lat: r.lat, lng: r.lng, address: r.address, osm_id: r.osm_id });
    setResults([]);
  }

  function useMyLocation() {
    if (!userPosition) return;
    setPlace({
      lat: userPosition.lat,
      lng: userPosition.lng,
      address: null,
      osm_id: null,
    });
    setResults([]);
  }

  function startPicking() {
    setResults([]);
    setPinned(null);
    setPinAddress(null);
    setPicking(true);
  }

  // Coloca/move o pin e tenta obter a morada por geocodificação inversa.
  async function handleMapPick(p: LatLng) {
    const reqId = ++pinReqId.current;
    setPinned(p);
    setPinAddress(null);
    setPinLoading(true);
    try {
      const params = new URLSearchParams({
        lat: String(p.lat),
        lng: String(p.lng),
      });
      const res = await fetch(`/api/search?${params}`);
      const data = (await res.json()) as PlaceResult[];
      // Ignora se entretanto foi colocado um pin mais recente.
      if (reqId === pinReqId.current) setPinAddress(data[0]?.address ?? null);
    } catch {
      if (reqId === pinReqId.current) setPinAddress(null);
    } finally {
      if (reqId === pinReqId.current) setPinLoading(false);
    }
  }

  // Troca o tipo de serviço e limpa a dose se já não for válida.
  function chooseServiceType(t: ServiceType) {
    setServiceType(t);
    setServing((prev) =>
      prev && SERVING_SIZES_BY_SERVICE[t].includes(prev) ? prev : null,
    );
  }

  function confirmPin() {
    if (!pinned) return;
    setPlace({
      lat: pinned.lat,
      lng: pinned.lng,
      address: pinAddress,
      osm_id: null,
    });
    setPicking(false);
    setPinned(null);
    setPinAddress(null);
  }

  const canAdvance =
    step === 1
      ? name.trim().length > 0 && !!place
      : step === 4
        ? !!serving
        : true;

  async function submit() {
    if (!place || !serving) return;
    setSubmitting(true);
    setError(null);

    const payload = {
      name: name.trim(),
      lat: place.lat,
      lng: place.lng,
      address: place.address,
      price: parsePrice(price),
      price_imperial: parsePrice(priceImperial),
      service_type: serviceType,
      serving_size: serving,
      rating,
      notes: notes.trim() || null,
      osm_id: place.osm_id,
    };

    const query = editing
      ? supabase.from(SPOTS_TABLE).update(payload).eq("id", spot!.id)
      : supabase.from(SPOTS_TABLE).insert(payload);

    const { data, error: saveError } = await query.select().single();

    if (saveError || !data) {
      setError(saveError?.message ?? "Não foi possível guardar. Tenta de novo.");
      setSubmitting(false);
      return;
    }

    onSaved(data as Spot);
    close();
  }

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/40 sm:items-center"
      onClick={close}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
          <div>
            <h2 className="text-lg font-bold text-stone-800">
              {editing ? "Editar local 🐌" : "Adicionar local 🐌"}
            </h2>
            <p className="text-xs text-stone-400">
              Passo {step} de {TOTAL_STEPS}
            </p>
          </div>
          <button
            onClick={close}
            className="rounded-full p-1 text-stone-400 hover:bg-stone-100"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Barra de progresso */}
        <div className="h-1 w-full bg-stone-100">
          <div
            className="h-full bg-brand transition-all"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Nome do estabelecimento
              </label>
              <input
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setPlace(null);
                }}
                placeholder="Ex.: Cervejaria O Caracol"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-800 outline-none focus:border-brand"
              />

              {place ? (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                  <span>✓</span>
                  <span>
                    Localização escolhida
                    {place.address ? `: ${place.address}` : ""}
                    <button
                      onClick={() => setPlace(null)}
                      className="ml-2 underline"
                    >
                      alterar
                    </button>
                  </span>
                </div>
              ) : picking ? (
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-stone-500">
                      Toca no mapa para colocar o pin.
                    </p>
                    <button
                      onClick={() => {
                        setPicking(false);
                        setPinned(null);
                        setPinAddress(null);
                      }}
                      className="text-xs text-stone-500 underline"
                    >
                      cancelar
                    </button>
                  </div>
                  <div className="mt-2 h-64 overflow-hidden rounded-lg border border-stone-200">
                    <MapView
                      center={userPosition ?? DEFAULT_CENTER}
                      zoom={15}
                      pending={pinned}
                      onMapClick={handleMapPick}
                    />
                  </div>
                  {pinned && (
                    <div className="mt-2 flex items-center gap-3 rounded-lg bg-stone-50 p-3">
                      <span className="min-w-0 flex-1 text-xs text-stone-500">
                        {pinLoading
                          ? "A obter morada…"
                          : pinAddress ?? "Ponto sem morada conhecida"}
                      </span>
                      <button
                        onClick={confirmPin}
                        className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
                      >
                        Usar este ponto
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {searching && (
                    <p className="mt-2 text-xs text-stone-400">A procurar…</p>
                  )}
                  {results.length > 0 && (
                    <ul className="mt-2 divide-y divide-stone-100 overflow-hidden rounded-lg border border-stone-200">
                      {results.map((r) => (
                        <li key={r.osm_id}>
                          <button
                            onClick={() => pickResult(r)}
                            className="block w-full px-3 py-2 text-left hover:bg-stone-50"
                          >
                            <span className="block text-sm font-medium text-stone-800">
                              {r.name}
                            </span>
                            <span className="block text-xs text-stone-500 line-clamp-1">
                              {r.address}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    onClick={useMyLocation}
                    disabled={!userPosition}
                    className="mt-3 w-full rounded-lg border border-dashed border-stone-300 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-50"
                  >
                    📍 Não encontras? Usar a minha localização atual
                  </button>
                  <button
                    onClick={startPicking}
                    className="mt-2 w-full rounded-lg border border-dashed border-stone-300 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
                  >
                    🗺️ Escolher um ponto no mapa
                  </button>
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Preço da dose de caracóis (opcional)
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  autoFocus
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex.: 6,50"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-800 outline-none focus:border-brand"
                />
                <span className="text-lg text-stone-500">€</span>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Preço da imperial 🍺 (opcional)
              </label>
              <p className="mt-0.5 text-xs text-stone-400">
                O acompanhamento obrigatório. Deixa em branco se não souberes.
              </p>
              <div className="mt-1 flex items-center gap-2">
                <input
                  autoFocus
                  inputMode="decimal"
                  value={priceImperial}
                  onChange={(e) => setPriceImperial(e.target.value)}
                  placeholder="Ex.: 1,20"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-800 outline-none focus:border-brand"
                />
                <span className="text-lg text-stone-500">€</span>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="text-sm font-medium text-stone-700">
                Onde vais comer?
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {SERVICE_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => chooseServiceType(t)}
                    className={`rounded-lg border px-4 py-3 text-center text-sm font-medium ${
                      serviceType === t
                        ? "border-brand bg-amber-50 text-stone-800"
                        : "border-stone-200 text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    {SERVICE_LABELS[t]}
                  </button>
                ))}
              </div>

              <p className="mt-4 text-sm font-medium text-stone-700">
                {serviceType === "takeaway"
                  ? "Tamanho da embalagem"
                  : "Tamanho da dose"}
              </p>
              <div className="mt-2 space-y-2">
                {SERVING_SIZES_BY_SERVICE[serviceType].map((s) => (
                  <button
                    key={s}
                    onClick={() => setServing(s)}
                    className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left ${
                      serving === s
                        ? "border-brand bg-amber-50"
                        : "border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <span>
                      <span className="block font-medium text-stone-800">
                        {SERVING_LABELS[s]}
                      </span>
                      <span className="block text-xs text-stone-500">
                        {SERVING_DESCRIPTIONS[s]}
                      </span>
                    </span>
                    {serving === s && <span className="text-brand">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <p className="text-sm font-medium text-stone-700">Avaliação</p>
              <div className="mt-2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(n === rating ? 0 : n)}
                    className="text-4xl leading-none"
                    aria-label={`${n} estrelas`}
                  >
                    <span
                      className={n <= rating ? "text-amber-500" : "text-stone-300"}
                    >
                      ★
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-stone-400">
                {rating === 0 ? "Sem avaliação" : `${rating} de 5`}
              </p>
            </div>
          )}

          {step === 6 && (
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Notas (opcional)
              </label>
              <textarea
                autoFocus
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 2000))}
                rows={5}
                placeholder="Como estavam? Molho, ambiente, dicas…"
                className="mt-1 w-full resize-none rounded-lg border border-stone-300 px-3 py-2 text-stone-800 outline-none focus:border-brand"
              />
              <p className="mt-1 text-right text-xs text-stone-400">
                {notes.length}/2000
              </p>
            </div>
          )}

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between gap-3 border-t border-stone-100 px-5 py-3">
          <button
            onClick={() => (step === 1 ? close() : setStep(step - 1))}
            className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100"
          >
            {step === 1 ? "Cancelar" : "Voltar"}
          </button>
          {step < TOTAL_STEPS ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canAdvance}
              className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
            >
              Seguinte
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {submitting
                ? "A guardar…"
                : editing
                  ? "Guardar alterações"
                  : "Guardar local"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
