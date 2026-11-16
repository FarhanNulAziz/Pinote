import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  verifySessionToken,
} from "./session";

function hash(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function verifyPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD;

  if (!expected) {
    throw new Error("APP_PASSWORD belum diatur.");
  }

  return timingSafeEqual(hash(input), hash(expected));
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export async function createSessionCookieValue(): Promise<string> {
  return createSessionToken();
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  return token ? verifySessionToken(token) : false;
}

export async function requireSession(): Promise<void> {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
}
