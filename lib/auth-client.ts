import type { AccountDto } from "./types";

let refreshing: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (refreshing) return refreshing;
  const refresh = async () => {
    const current = await fetch("/api/auth/session", { cache: "no-store" });
    if (current.ok) return true;
    if (current.status !== 401) throw new Error("Unable to verify the session. Try again shortly.");
    const response = await fetch("/api/auth/refresh", { method: "POST" });
    if (!response.ok && response.status !== 401) throw new Error("Unable to refresh the session. Try again shortly.");
    return response.ok;
  };
  // Require a cross-tab lock before rotating a shared cookie. Unsupported browsers
  // must sign in again after expiry instead of risking refresh-token replay.
  const coordinated = async () => navigator.locks
    ? await navigator.locks.request("tasktrack-refresh", refresh)
    : false;
  refreshing = coordinated().finally(() => { refreshing = null; });
  return refreshing;
}

export async function loadSession(): Promise<AccountDto | null> {
  let response = await fetch("/api/auth/session", { cache: "no-store" });
  if (response.status === 401 && await refreshSession())
    response = await fetch("/api/auth/session", { cache: "no-store" });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Unable to verify the session. Try again shortly.");
  return response.json();
}

export async function protectedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  let response = await fetch(path, init);
  if (response.status === 401 && await refreshSession()) response = await fetch(path, init);
  if (response.status === 401) window.location.assign("/login");
  return response;
}
