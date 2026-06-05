import { NextResponse } from "next/server";
import { createAdminSession, isAdminPassword } from "@/lib/adminAuth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const password =
    body && typeof body === "object" && "password" in body
      ? String((body as { password: unknown }).password)
      : "";

  if (!isAdminPassword(password)) {
    return NextResponse.json({ error: "Password inválida." }, { status: 401 });
  }

  try {
    await createAdminSession();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível criar a sessão.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
