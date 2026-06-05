import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/adminSupabase";
import {
  rateLimitByIp,
  rejectCrossOriginRequest,
} from "@/lib/requestSecurity";
import { SPOTS_TABLE } from "@/lib/supabase";
import { parseSpotPayload } from "@/lib/spotValidation";
import type { Spot } from "@/lib/types";

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOriginRequest(request);
  if (crossOrigin) return crossOrigin;

  const limited = rateLimitByIp(request, "spots:create", 5, 60 * 60 * 1000);
  if (limited) return limited;

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
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ spot: data as Spot }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível guardar. Tenta de novo." },
      { status: 500 },
    );
  }
}
