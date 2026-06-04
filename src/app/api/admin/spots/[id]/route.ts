import { isAdminSession } from "@/lib/adminAuth";
import { SPOTS_TABLE } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function forbiddenResponse() {
  return Response.json({ error: "Acesso de admin necessário." }, { status: 403 });
}

function unavailableResponse() {
  return Response.json(
    { error: "Configura SUPABASE_SERVICE_ROLE_KEY para operações de admin." },
    { status: 500 },
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminSession())) return forbiddenResponse();
  if (!supabaseAdmin) return unavailableResponse();

  const { id } = await params;
  const payload = await request.json();
  const { data, error } = await supabaseAdmin
    .from(SPOTS_TABLE)
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ spot: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminSession())) return forbiddenResponse();
  if (!supabaseAdmin) return unavailableResponse();

  const { id } = await params;
  const { error } = await supabaseAdmin.from(SPOTS_TABLE).delete().eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
