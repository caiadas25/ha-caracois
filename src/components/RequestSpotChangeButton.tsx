"use client";

import { useState } from "react";
import { SPOT_REQUESTS_TABLE, supabase } from "@/lib/supabase";
import type { SpotRequestType } from "@/lib/types";

export default function RequestSpotChangeButton({ spotId }: { spotId: string }) {
  const [open, setOpen] = useState(false);
  const [requestType, setRequestType] = useState<SpotRequestType>("edit");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const trimmedNote = note.trim();
    if (!trimmedNote) {
      setError("Escreve uma pequena nota para o admin.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    const { error: insertError } = await supabase
      .from(SPOT_REQUESTS_TABLE)
      .insert({
        spot_id: spotId,
        request_type: requestType,
        note: trimmedNote,
      });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setNote("");
    setMessage("Pedido enviado ao admin. Obrigado!");
    setSubmitting(false);
    setOpen(false);
  }

  if (!open) {
    return (
      <div className="mt-2">
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setMessage(null);
            setError(null);
          }}
          className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50"
        >
          Sugerir edição/apagar
        </button>
        {message && <p className="mt-1 text-xs text-green-700">{message}</p>}
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-stone-200 bg-stone-50 p-2">
      <label className="text-xs font-semibold text-stone-700" htmlFor={`request-type-${spotId}`}>
        Pedido ao admin
      </label>
      <select
        id={`request-type-${spotId}`}
        value={requestType}
        onChange={(event) => setRequestType(event.target.value as SpotRequestType)}
        className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700"
      >
        <option value="edit">Editar informação</option>
        <option value="delete">Apagar local</option>
      </select>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={2}
        maxLength={600}
        placeholder="O que deve ser corrigido?"
        className="mt-2 w-full resize-none rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700 placeholder:text-stone-400"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="flex-1 rounded-lg bg-brand px-2 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "A enviar…" : "Enviar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={submitting}
          className="rounded-lg px-2 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-100 disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
