import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "pinote_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET belum diatur dengan benar.");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE)
    .sign(getSessionSecret());
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSessionSecret(), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}
