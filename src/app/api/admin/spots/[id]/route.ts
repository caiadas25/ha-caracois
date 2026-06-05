import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getAdminSupabase } from "@/lib/adminSupabase";
import { isUuid, rejectCrossOriginRequest } from "@/lib/requestSecurity";
import { SPOTS_TABLE } from "@/lib/supabase";
import { parseSpotPayload } from "@/lib/spotValidation";
import type { Spot } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const crossOrigin = rejectCrossOriginRequest(request);
  if (crossOrigin) return crossOrigin;

  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Local inválido." }, { status: 400 });
  }

  let payload;
  try {
    payload = parseSpotPayload(await request.json());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Pedido inválido." },
      { status: 400 },
    );
  }

  try {
    const adminSupabase = getAdminSupabase();
    const { data, error } = await adminSupabase
      .from(SPOTS_TABLE)
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ spot: data as Spot });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar o local.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const crossOrigin = rejectCrossOriginRequest(request);
  if (crossOrigin) return crossOrigin;

  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Local inválido." }, { status: 400 });
  }

  try {
    const adminSupabase = getAdminSupabase();
    const { error } = await adminSupabase.from(SPOTS_TABLE).delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível apagar o local.",
      },
      { status: 500 },
    );
  }
}
