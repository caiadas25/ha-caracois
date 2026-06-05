"use client";

import { useState, type SyntheticEvent } from "react";
import type { Spot, SpotRequestType } from "@/lib/types";

export default function SpotRequestButton({ spot }: { spot: Spot }) {
  const [open, setOpen] = useState(false);
  const [requestType, setRequestType] = useState<SpotRequestType>("edit");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function stopPopupEvent(event: SyntheticEvent) {
    event.stopPropagation();
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/spot-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spot_id: spot.id,
          request_type: requestType,
          note,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Não foi possível enviar.");
      setNote("");
      setMessage("Pedido enviado.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível enviar.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onPointerDown={stopPopupEvent}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
          setMessage(null);
          setError(null);
        }}
        className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
      >
        Sugerir alteração
      </button>
    );
  }

  return (
    <div
      onPointerDown={stopPopupEvent}
      onClick={stopPopupEvent}
      className="mt-2 rounded-lg border border-stone-200 p-2"
    >
      <div className="grid grid-cols-2 gap-1">
        {(["edit", "delete"] as SpotRequestType[]).map((type) => (
          <button
            key={type}
            onClick={() => setRequestType(type)}
            className={`rounded-md px-2 py-1 text-xs font-semibold ${
              requestType === type
                ? "bg-brand text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {type === "edit" ? "Editar" : "Apagar"}
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value.slice(0, 1000))}
        rows={3}
        placeholder="Nota para o admin"
        className="mt-2 w-full resize-none rounded-md border border-stone-200 px-2 py-1.5 text-xs text-stone-800 outline-none focus:border-brand"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={submitting}
          className="rounded-md px-2 py-1 text-xs font-medium text-stone-500 hover:bg-stone-100 disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          onClick={submit}
          disabled={submitting || note.trim().length < 5}
          className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? "A enviar..." : "Enviar"}
        </button>
      </div>
      {message && <p className="mt-2 text-xs text-emerald-700">{message}</p>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
