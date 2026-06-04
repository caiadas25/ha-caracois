import { isValidAdminPassword, setAdminSession } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const { password } = (await request.json().catch(() => ({}))) as {
    password?: string;
  };

  if (!password || !isValidAdminPassword(password)) {
    return Response.json({ error: "Password inválida." }, { status: 401 });
  }

  await setAdminSession();
  return Response.json({ ok: true });
}
