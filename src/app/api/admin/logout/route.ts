import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/adminAuth";
import { rejectCrossOriginRequest } from "@/lib/requestSecurity";

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOriginRequest(request);
  if (crossOrigin) return crossOrigin;

  await clearAdminSession();
  return NextResponse.json({ ok: true });
}
