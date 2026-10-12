import { NextRequest, NextResponse } from "next/server";
import { backendFetch, clearTokens, readTokens, serverAccount, writeTokens } from "@/lib/server-auth";
import type { TokenResponseDto } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ action: string }> };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(_request: NextRequest, context: Context) {
  if ((await context.params).action !== "session") return json({ message: "Not found." }, 404);
  try {
    const account = await serverAccount();
    return account ? json(account) : json({ message: "Please log in." }, 401);
  } catch {
    return json({ message: "Unable to reach the API. Try again shortly." }, 502);
  }
}

export async function POST(request: NextRequest, context: Context) {
  const { action } = await context.params;
  if (!["login", "register", "refresh", "logout", "profile", "password"].includes(action)) return json({ message: "Not found." }, 404);
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return json({ message: "Invalid request origin." }, 403);
  try {
    const selfUpdate = action === "profile" || action === "password";
    const { access } = selfUpdate ? await readTokens() : { access: undefined };
    if (selfUpdate && !access) return json({ message: "Please log in." }, 401);
    let body: string;
    if (action === "refresh" || action === "logout") {
      const { refresh } = await readTokens();
      if (!refresh) {
        await clearTokens();
        return action === "logout" ? new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } }) : json({ message: "Please log in." }, 401);
      }
      body = JSON.stringify({ refreshToken: refresh });
    } else {
      body = await request.text();
    }
    const response = await backendFetch(`/api/auth/${action}`, {
      method: selfUpdate ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", ...(access ? { Authorization: `Bearer ${access}` } : {}) }, body,
    });
    if ((action === "logout" || action === "password") && response.ok) {
      await clearTokens();
      return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
    }
    if (!response.ok) {
      if (action === "refresh" && response.status === 401) await clearTokens();
      const data = response.headers.get("content-type")?.includes("json") ? await response.json() : { message: "API request failed." };
      return json(data, response.status);
    }
    const data = await response.json();
    if (action === "login" || action === "refresh") {
      await writeTokens(data as TokenResponseDto);
      return json(data.account);
    }
    return json(data, response.status);
  } catch {
    return json({ message: "Unable to reach the API. Try again shortly." }, 502);
  }
}
