"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function logout() {
    setSubmitting(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={submitting}
      className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60"
    >
      {submitting ? "A sair…" : "Sair"}
    </button>
  );
}
