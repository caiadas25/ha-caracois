import { NextResponse } from "next/server";
import { createAdminSession, isAdminPassword } from "@/lib/adminAuth";
import {
  rateLimitByIp,
  rejectCrossOriginRequest,
} from "@/lib/requestSecurity";

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOriginRequest(request);
  if (crossOrigin) return crossOrigin;

  const limited = rateLimitByIp(request, "admin:login", 5, 10 * 60 * 1000);
  if (limited) return limited;

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

  if (password.length > 1024) {
    return NextResponse.json({ error: "Password inválida." }, { status: 401 });
  }

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
