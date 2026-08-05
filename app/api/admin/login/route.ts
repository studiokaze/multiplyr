import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, checkKey, sessionValue } from "@/lib/admin";

export const runtime = "nodejs";

/**
 * Exchanges the admin key for an httpOnly session cookie. The cookie holds a
 * hash of the key, never the key, and every response is a redirect so the
 * secret is never reflected back.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const key = form.get("key");

  const to = (path: string) => NextResponse.redirect(new URL(path, req.url), 303);

  if (typeof key !== "string" || !checkKey(key)) {
    return to("/admin?denied=1");
  }

  const res = to("/admin");
  res.cookies.set(ADMIN_COOKIE, sessionValue()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
