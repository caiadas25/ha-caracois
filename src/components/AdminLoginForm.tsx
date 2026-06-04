"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Não foi possível entrar.");
      setSubmitting(false);
      return;
    }

    setPassword("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <label htmlFor="admin-password" className="text-sm font-semibold text-stone-700">
        Password de admin
      </label>
      <input
        id="admin-password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-800 outline-none focus:border-brand"
        autoComplete="current-password"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !password}
        className="mt-4 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? "A entrar…" : "Entrar"}
      </button>
    </form>
  );
}
