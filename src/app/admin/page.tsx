import Link from "next/link";
import AdminDashboard from "@/components/AdminDashboard";
import AdminLoginForm from "@/components/AdminLoginForm";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getPendingSpotRequests } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-md px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
        >
          ← Voltar ao mapa
        </Link>
        <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold text-stone-900">Admin</h1>
          <AdminLoginForm />
        </section>
      </main>
    );
  }

  try {
    const requests = await getPendingSpotRequests();
    return (
      <main className="mx-auto min-h-dvh w-full max-w-3xl px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
        >
          ← Voltar ao mapa
        </Link>
        <section className="mt-6">
          <AdminDashboard requests={requests} />
        </section>
      </main>
    );
  } catch (error) {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-stone-900">Admin</h1>
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error instanceof Error
            ? error.message
            : "Não foi possível carregar os pedidos."}
        </p>
      </main>
    );
  }
}
