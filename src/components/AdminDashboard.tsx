"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AddSpotWizard from "@/components/AddSpotWizard";
import type {
  AdminSpotRequest,
  Spot,
  SpotPayload,
  SpotRequestStatus,
} from "@/lib/types";

function requestLabel(type: AdminSpotRequest["request_type"]) {
  return type === "edit" ? "Editar" : "Apagar";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function readError(res: Response, fallback: string) {
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return data.error ?? fallback;
}

export default function AdminDashboard({
  requests,
}: {
  requests: AdminSpotRequest[];
}) {
  const router = useRouter();
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  async function updateRequest(
    id: string,
    status: SpotRequestStatus,
    adminNote: string,
  ) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, admin_note: adminNote }),
      });
      if (!res.ok) throw new Error(await readError(res, "Falha ao atualizar."));
      router.refresh();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Falha ao atualizar.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteSpot(request: AdminSpotRequest) {
    if (!request.spot) return;
    const confirmed = window.confirm(`Apagar "${request.spot.name}"?`);
    if (!confirmed) return;

    setBusyId(request.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/spots/${request.spot.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await readError(res, "Falha ao apagar."));
      await updateRequest(request.id, "resolved", "Local apagado.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Falha ao apagar.",
      );
      setBusyId(null);
    }
  }

  async function saveSpot(payload: SpotPayload, spot: Spot | null) {
    if (!spot) throw new Error("Local indisponível.");
    const res = await fetch(`/api/admin/spots/${spot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { spot?: Spot; error?: string };
    if (!res.ok || !data.spot) {
      throw new Error(data.error ?? "Falha ao guardar.");
    }

    if (editingRequestId) {
      await updateRequest(editingRequestId, "resolved", "Alteração aplicada.");
    }

    return data.spot;
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Admin</h1>
          <p className="mt-1 text-sm text-stone-500">
            {requests.length} pedido{requests.length === 1 ? "" : "s"} pendente
            {requests.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          onClick={logout}
          className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Sair
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {requests.length === 0 ? (
        <div className="mt-6 rounded-lg border border-stone-200 bg-white p-5 text-sm text-stone-500">
          Sem pedidos pendentes.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {requests.map((request) => (
            <article
              key={request.id}
              className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        request.request_type === "delete"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {requestLabel(request.request_type)}
                    </span>
                    <span className="text-xs text-stone-400">
                      {formatDate(request.created_at)}
                    </span>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-stone-900">
                    {request.spot?.name ?? request.spot_name}
                  </h2>
                  {(request.spot?.address ?? request.spot_address) && (
                    <p className="mt-0.5 text-sm text-stone-500">
                      {request.spot?.address ?? request.spot_address}
                    </p>
                  )}
                </div>
                {!request.spot && (
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500">
                    Local removido
                  </span>
                )}
              </div>

              <p className="mt-4 whitespace-pre-wrap rounded-lg bg-stone-50 p-3 text-sm text-stone-700">
                {request.note}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {request.spot && (
                  <>
                    <button
                      onClick={() => {
                        setEditingSpot(request.spot);
                        setEditingRequestId(request.id);
                      }}
                      disabled={busyId === request.id}
                      className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      Editar local
                    </button>
                    <button
                      onClick={() => deleteSpot(request)}
                      disabled={busyId === request.id}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Apagar local
                    </button>
                  </>
                )}
                <button
                  onClick={() =>
                    updateRequest(request.id, "resolved", "Revisto pelo admin.")
                  }
                  disabled={busyId === request.id}
                  className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                >
                  Resolver
                </button>
                <button
                  onClick={() =>
                    updateRequest(request.id, "dismissed", "Ignorado pelo admin.")
                  }
                  disabled={busyId === request.id}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-stone-500 hover:bg-stone-100 disabled:opacity-50"
                >
                  Ignorar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <AddSpotWizard
        open={!!editingSpot}
        spot={editingSpot}
        userPosition={null}
        saveSpot={saveSpot}
        onClose={() => {
          setEditingSpot(null);
          setEditingRequestId(null);
        }}
        onSaved={() => {
          setEditingSpot(null);
          setEditingRequestId(null);
          router.refresh();
        }}
      />
    </>
  );
}
