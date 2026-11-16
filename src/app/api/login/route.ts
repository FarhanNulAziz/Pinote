import { NextResponse } from "next/server";
import {
  createSessionCookieValue,
  getSessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import {
  checkLoginRateLimit,
  clearLoginAttempts,
  getClientIp,
  recordFailedLogin,
} from "@/lib/rate-limit";
import { SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

function readPassword(body: unknown): string {
  if (!body || typeof body !== "object") {
    return "";
  }

  const value = (body as Record<string, unknown>).password;
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);

  try {
    const rateLimit = await checkLoginRateLimit(ip);

    if (rateLimit.blocked) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan, coba lagi nanti" },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const body = await request.json().catch(() => null);
    const password = readPassword(body);
    const passwordIsValid = password.length > 0 && password.length <= 256;

    if (!passwordIsValid || !verifyPassword(password)) {
      await recordFailedLogin(ip);
      return NextResponse.json({ error: "Sandi salah" }, { status: 401 });
    }

    await clearLoginAttempts(ip);

    const token = await createSessionCookieValue();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      SESSION_COOKIE,
      token,
      getSessionCookieOptions(),
    );

    return response;
  } catch {
    return NextResponse.json(
      { error: "Terjadi kesalahan. Coba lagi." },
      { status: 500 },
    );
  }
}
