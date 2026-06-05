import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "ha_caracois_admin";
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET;
}

function sign(payload: string) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET não está configurado.");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function buildSession() {
  const expiresAt = Date.now() + SESSION_MS;
  const payload = Buffer.from(JSON.stringify({ role: "admin", expiresAt }))
    .toString("base64url");
  return {
    expiresAt,
    value: `${payload}.${sign(payload)}`,
  };
}

function verifySession(value: string | undefined) {
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;

  try {
    if (!safeEqual(signature, sign(payload))) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      role?: string;
      expiresAt?: number;
    };
    return data.role === "admin" && !!data.expiresAt && data.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export function isAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(password, expected);
}

export async function createAdminSession() {
  const session = buildSession();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiresAt),
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return verifySession(cookieStore.get(ADMIN_COOKIE)?.value);
}
