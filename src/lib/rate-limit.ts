import { getSupabaseAdmin } from "./supabase";

const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_SECONDS = 60;
const BLOCK_SECONDS = 15 * 60;
const LOOKBACK_MS = (BLOCK_SECONDS + ATTEMPT_WINDOW_SECONDS) * 1000;

type LoginAttemptRow = {
  attempted_at: string;
};

export type LoginRateLimit = {
  blocked: boolean;
  retryAfterSeconds: number;
};

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const firstForwarded = forwarded?.split(",")[0]?.trim();
  const ip = firstForwarded || headers.get("x-real-ip")?.trim() || "unknown";

  return ip.slice(0, 100);
}

export async function checkLoginRateLimit(
  ip: string,
): Promise<LoginRateLimit> {
  const now = Date.now();
  const since = new Date(now - LOOKBACK_MS).toISOString();

  const { data, error } = await getSupabaseAdmin()
    .from("login_attempts")
    .select("attempted_at")
    .eq("ip", ip)
    .gte("attempted_at", since)
    .order("attempted_at", { ascending: true });

  if (error) {
    throw new Error("Gagal memeriksa percobaan login.");
  }

  const times = ((data ?? []) as LoginAttemptRow[])
    .map((row) => new Date(row.attempted_at).getTime())
    .filter((time) => Number.isFinite(time));

  let blockedUntil = 0;

  for (let index = 0; index + MAX_ATTEMPTS - 1 < times.length; index += 1) {
    const fifthAttempt = times[index + MAX_ATTEMPTS - 1];

    if (fifthAttempt - times[index] <= ATTEMPT_WINDOW_SECONDS * 1000) {
      blockedUntil = Math.max(blockedUntil, fifthAttempt + BLOCK_SECONDS * 1000);
    }
  }

  if (blockedUntil > now) {
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil((blockedUntil - now) / 1000),
    };
  }

  return { blocked: false, retryAfterSeconds: 0 };
}

export async function recordFailedLogin(ip: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("login_attempts")
    .insert({ ip });

  if (error) {
    throw new Error("Gagal mencatat percobaan login.");
  }
}

export async function clearLoginAttempts(ip: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("login_attempts")
    .delete()
    .eq("ip", ip);

  if (error) {
    throw new Error("Gagal membersihkan percobaan login.");
  }
}
