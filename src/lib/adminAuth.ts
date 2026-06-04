import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "ha-caracois-admin";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || "";
}

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && getSessionSecret());
}

function sign(value: string) {
  const secret = getSessionSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

export function createAdminSessionValue() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = String(expiresAt);
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSessionValue(value?: string) {
  if (!value || !isAdminConfigured()) return false;
  const [expiresAt, signature] = value.split(".");
  if (!expiresAt || !signature) return false;

  const expiresAtNumber = Number(expiresAt);
  if (!Number.isFinite(expiresAtNumber) || expiresAtNumber < Date.now() / 1000) {
    return false;
  }

  const expectedSignature = sign(expiresAt);
  return safeEqual(signature, expectedSignature);
}

export async function isAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminSessionValue(cookieStore.get(ADMIN_COOKIE)?.value);
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, createAdminSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export function isValidAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(password, expected);
}
