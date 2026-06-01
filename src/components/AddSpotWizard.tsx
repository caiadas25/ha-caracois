"use client";

import { useEffect, useState } from "react";
import { supabase, SPOTS_TABLE } from "@/lib/supabase";
import {
  SERVING_SIZES,
  SERVING_LABELS,
  SERVING_DESCRIPTIONS,
  type PlaceResult,
  type ServingSize,
  type Spot,
} from "@/lib/types";
import type { LatLng } from "@/hooks/useGeolocation";

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
  onCreated: (spot: Spot) => void;
}

const TOTAL_STEPS = 5;

export default function AddSpotWizard({
  open,
  onClose,
  userPosition,
  onCreated,
}: Props) {
  const [step, setStep] = useState(1);

  // Passo 1 — nome + localização
  const [name, setName] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [place, setPlace] = useState<ChosenPlace | null>(null);

  // Passos seguintes
  const [price, setPrice] = useState("");
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
    setPrice("");
    setServing(null);
    setRating(0);
    setNotes("");
    setError(null);
    setSubmitting(false);
  }

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

  const canAdvance =
    step === 1
      ? name.trim().length > 0 && !!place
      : step === 3
        ? !!serving
        : true;

  async function submit() {
    if (!place || !serving) return;
    setSubmitting(true);
    setError(null);

    const parsedPrice = price.trim()
      ? parseFloat(price.replace(",", "."))
      : null;

    const { data, error: insertError } = await supabase
      .from(SPOTS_TABLE)
      .insert({
        name: name.trim(),
        lat: place.lat,
        lng: place.lng,
        address: place.address,
        price:
          parsedPrice != null && Number.isFinite(parsedPrice)
            ? parsedPrice
            : null,
        serving_size: serving,
        rating,
        notes: notes.trim() || null,
        osm_id: place.osm_id,
      })
      .select()
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Não foi possível guardar. Tenta de novo.");
      setSubmitting(false);
      return;
    }

    onCreated(data as Spot);
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
              Adicionar local 🐌
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
                    {place.address ? `: ${place.address}` : " (a minha localização)"}
                    <button
                      onClick={() => setPlace(null)}
                      className="ml-2 underline"
                    >
                      alterar
                    </button>
                  </span>
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
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Preço da dose (opcional)
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
              <p className="text-sm font-medium text-stone-700">
                Tamanho da dose
              </p>
              <div className="mt-2 space-y-2">
                {SERVING_SIZES.map((s) => (
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

          {step === 4 && (
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

          {step === 5 && (
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
              {submitting ? "A guardar…" : "Guardar local"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
