import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * CORS for the agent API. The desktop app runs on a loopback origin and
 * calls the hosted API cross-origin — without these headers every call
 * dies as "Failed to fetch". Open origin is fine here: the keys live
 * server-side, callers send no credentials, and the routes are the product.
 */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function middleware(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS });
  }
  const res = NextResponse.next();
  for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
  return res;
}

export const config = { matcher: "/api/agents/:path*" };
