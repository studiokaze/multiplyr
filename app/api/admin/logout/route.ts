import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin";

export const runtime = "nodejs";

/** Sign out: drop the session cookie. POST so a crawled link can't do it. */
export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/admin", req.url), 303);
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
