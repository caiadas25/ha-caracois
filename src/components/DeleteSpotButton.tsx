"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, SPOTS_TABLE } from "@/lib/supabase";

/** Botão para apagar um local, com confirmação em dois passos. */
export default function DeleteSpotButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setDeleting(true);
    setError(null);
    const { error: deleteError } = await supabase
      .from(SPOTS_TABLE)
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }
    // Volta ao mapa e recarrega a lista de locais.
    router.push("/");
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        🗑️ Apagar
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-stone-500">Apagar mesmo?</span>
      <button
        onClick={remove}
        disabled={deleting}
        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {deleting ? "A apagar…" : "Sim"}
      </button>
      <button
        onClick={() => {
          setConfirming(false);
          setError(null);
        }}
        disabled={deleting}
        className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100"
      >
        Não
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
