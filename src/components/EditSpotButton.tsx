"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AddSpotWizard from "./AddSpotWizard";
import type { Spot } from "@/lib/types";

/** Botão que abre o assistente em modo de edição para um local existente. */
export default function EditSpotButton({ spot }: { spot: Spot }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
      >
        ✏️ Editar
      </button>
      <AddSpotWizard
        open={open}
        spot={spot}
        userPosition={null}
        onClose={() => setOpen(false)}
        onSaved={() => {
          setOpen(false);
          // Recarrega os dados do servidor para refletir as alterações.
          router.refresh();
        }}
      />
    </>
  );
}
