import Link from "next/link";
import { isAdminConfigured, isAdminSession } from "@/lib/adminAuth";
import { SPOT_REQUESTS_TABLE } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { SpotRequest, SpotRequestType } from "@/lib/types";
import AdminLoginForm from "@/components/AdminLoginForm";
import AdminLogoutButton from "@/components/AdminLogoutButton";

export const dynamic = "force-dynamic";

type RequestRow = SpotRequest & {
  spot: {
    id: string;
    name: string;
    address: string | null;
  } | null;
};

const REQUEST_TYPE_LABELS: Record<SpotRequestType, string> = {
  edit: "Editar",
  delete: "Apagar",
};

async function getRequests() {
  if (!supabaseAdmin) {
    return {
      requests: [] as RequestRow[],
      error: "Configura SUPABASE_SERVICE_ROLE_KEY para listar pedidos de admin.",
    };
  }

  const { data, error } = await supabaseAdmin
    .from(SPOT_REQUESTS_TABLE)
    .select(
      `
        *,
        spot:caracois_spots(id, name, address)
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    return { requests: [] as RequestRow[], error: error.message };
  }

  return { requests: (data as RequestRow[]) ?? [], error: null };
}

export default async function AdminPage() {
  const configured = isAdminConfigured();
  const authed = await isAdminSession();

  if (!configured) {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-3xl px-4 py-6">
        <Link href="/" className="text-sm font-medium text-brand hover:underline">
          ← Voltar ao mapa
        </Link>
        <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
          <h1 className="text-xl font-bold">Admin não configurado</h1>
          <p className="mt-2 text-sm">
            Define ADMIN_PASSWORD e ADMIN_SESSION_SECRET nas variáveis de ambiente para ativar esta página.
          </p>
        </section>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-md px-4 py-6">
        <Link href="/" className="text-sm font-medium text-brand hover:underline">
          ← Voltar ao mapa
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-stone-900">Admin</h1>
        <p className="mt-2 text-sm text-stone-600">
          Entra para ver pedidos de edição ou remoção enviados pelos utilizadores.
        </p>
        <AdminLoginForm />
      </main>
    );
  }

  const { requests, error } = await getRequests();

  return (
    <main className="mx-auto min-h-dvh w-full max-w-4xl px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="text-sm font-medium text-brand hover:underline">
          ← Voltar ao mapa
        </Link>
        <AdminLogoutButton />
      </div>

      <header className="mt-6">
        <h1 className="text-3xl font-bold text-stone-900">Pedidos ao admin</h1>
        <p className="mt-2 text-sm text-stone-600">
          Sugestões de edição ou remoção enviadas a partir dos cartões dos locais.
        </p>
      </header>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && requests.length === 0 && (
        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 text-center text-stone-500 shadow-sm">
          Ainda não há pedidos.
        </div>
      )}

      <div className="mt-6 space-y-4">
        {requests.map((request) => {
          const created = new Date(request.created_at).toLocaleString("pt-PT", {
            dateStyle: "medium",
            timeStyle: "short",
          });

          return (
            <article key={request.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
                    {REQUEST_TYPE_LABELS[request.request_type]}
                  </span>
                  <h2 className="mt-3 text-xl font-bold text-stone-900">
                    {request.spot?.name ?? "Local apagado ou indisponível"}
                  </h2>
                  {request.spot?.address && (
                    <p className="mt-1 text-sm text-stone-500">{request.spot.address}</p>
                  )}
                </div>
                <p className="text-xs text-stone-400">{created}</p>
              </div>

              <p className="mt-4 whitespace-pre-wrap rounded-xl bg-stone-50 p-3 text-sm text-stone-700">
                {request.note}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {request.spot && (
                  <Link
                    href={`/spot/${request.spot.id}`}
                    className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Abrir local
                  </Link>
                )}
                <span className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600">
                  Estado: {request.status === "resolved" ? "resolvido" : "aberto"}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
