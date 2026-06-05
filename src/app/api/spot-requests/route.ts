import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/adminSupabase";
import { SPOT_REQUESTS_TABLE, SPOTS_TABLE } from "@/lib/supabase";
import type { Spot, SpotRequestType } from "@/lib/types";

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const input = body as {
    spot_id?: unknown;
    request_type?: unknown;
    note?: unknown;
  };
  const note = typeof input.note === "string" ? input.note.trim() : "";
  const requestType = input.request_type;

  if (!isUuid(input.spot_id)) {
    return NextResponse.json({ error: "Local inválido." }, { status: 400 });
  }
  if (requestType !== "edit" && requestType !== "delete") {
    return NextResponse.json({ error: "Tipo de pedido inválido." }, { status: 400 });
  }
  if (note.length < 5 || note.length > 1000) {
    return NextResponse.json(
      { error: "Deixa uma nota entre 5 e 1000 caracteres." },
      { status: 400 },
    );
  }

  try {
    const adminSupabase = getAdminSupabase();
    const { data: spot, error: spotError } = await adminSupabase
      .from(SPOTS_TABLE)
      .select("id,name,address")
      .eq("id", input.spot_id)
      .maybeSingle();

    if (spotError) throw spotError;
    if (!spot) {
      return NextResponse.json({ error: "Local não encontrado." }, { status: 404 });
    }

    const typedSpot = spot as Pick<Spot, "id" | "name" | "address">;
    const { error: insertError } = await adminSupabase
      .from(SPOT_REQUESTS_TABLE)
      .insert({
        spot_id: typedSpot.id,
        spot_name: typedSpot.name,
        spot_address: typedSpot.address,
        request_type: requestType as SpotRequestType,
        note,
      });

    if (insertError) throw insertError;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível enviar o pedido." },
      { status: 500 },
    );
  }
}
