import { cookies } from "next/headers";
import type { AccountDto, TokenResponseDto } from "./types";

const accessCookie = "tasktrack_access";
const refreshCookie = "tasktrack_refresh";

export function backendFetch(path: string, init: RequestInit = {}) {
  const origin = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5117";
  // Free Render instances can take about a minute to wake up.
  return fetch(new URL(path, origin), { ...init, cache: "no-store", signal: AbortSignal.timeout(90000) });
}

export async function readTokens() {
  const jar = await cookies();
  return { access: jar.get(accessCookie)?.value, refresh: jar.get(refreshCookie)?.value };
}

export async function writeTokens(tokens: TokenResponseDto) {
  const accessExpiry = new Date(tokens.accessTokenExpiresAt);
  const refreshExpiry = new Date(tokens.refreshTokenExpiresAt);
  if (!tokens.accessToken || !tokens.refreshToken || !tokens.account ||
      !Number.isFinite(accessExpiry.getTime()) || !Number.isFinite(refreshExpiry.getTime()))
    throw new Error("Invalid authentication response.");
  const jar = await cookies();
  const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
  jar.set(accessCookie, tokens.accessToken, { ...options, expires: accessExpiry });
  jar.set(refreshCookie, tokens.refreshToken, { ...options, expires: refreshExpiry });
}

export async function clearTokens() {
  const jar = await cookies();
  jar.delete(accessCookie);
  jar.delete(refreshCookie);
}

export async function serverAccount(): Promise<AccountDto | null> {
  const { access } = await readTokens();
  if (!access) return null;
  const response = await backendFetch("/api/auth/me", { headers: { Authorization: `Bearer ${access}` } });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Unable to verify the session. Try again shortly.");
  return response.json();
}
