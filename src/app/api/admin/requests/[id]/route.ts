import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getAdminSupabase } from "@/lib/adminSupabase";
import { SPOT_REQUESTS_TABLE } from "@/lib/supabase";
import type { SpotRequestStatus } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const input = body as { status?: unknown; admin_note?: unknown };
  const status = input.status;
  if (status !== "pending" && status !== "resolved" && status !== "dismissed") {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  const adminNote =
    typeof input.admin_note === "string" && input.admin_note.trim()
      ? input.admin_note.trim().slice(0, 1000)
      : null;

  try {
    const adminSupabase = getAdminSupabase();
    const { error } = await adminSupabase
      .from(SPOT_REQUESTS_TABLE)
      .update({
        status: status as SpotRequestStatus,
        admin_note: adminNote,
        resolved_at: status === "pending" ? null : new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar o pedido.",
      },
      { status: 500 },
    );
  }
}
