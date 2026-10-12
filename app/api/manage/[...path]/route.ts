import { NextRequest, NextResponse } from "next/server";
import { backendFetch, readTokens } from "@/lib/server-auth";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
const error = (message: string, status: number) => NextResponse.json({ message }, { status, headers: { "Cache-Control": "no-store" } });

async function forward(request: NextRequest, context: Context) {
  const path = (await context.params).path.join("/");
  if (!/^(departments|projects|tasks|tags|accounts)(\/\d+)?$/.test(path) ||
      (request.method === "GET" && !path.startsWith("accounts")) ||
      (request.method === "POST" && (path.includes("/") || path === "accounts")))
    return error("Not found.", 404);
  if (request.method !== "GET" && request.headers.get("origin") !== new URL(request.url).origin)
    return error("Invalid request origin.", 403);
  const { access } = await readTokens();
  if (!access) return error("Please log in.", 401);
  try {
    const response = await backendFetch(`/api/${path}`, {
      method: request.method,
      headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
      body: ["POST", "PUT"].includes(request.method) ? await request.text() : undefined,
    });
    const content = response.status === 204 ? null : await response.text();
    if (response.status !== 204 && !content)
      return error(response.status === 403 ? "Access denied." : "API request failed.", response.ok ? 502 : response.status);
    return new NextResponse(content, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "text/plain", "Cache-Control": "no-store" },
    });
  } catch {
    return error("Unable to reach the API. Try again shortly.", 502);
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const DELETE = forward;
