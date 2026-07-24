import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";

const JWT_SECRET  = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";
const BASE_URL    = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://majacraft.id";
const COOKIE_NAME = process.env.NODE_ENV === "production"
  ? "__Secure-next-auth.session-token"
  : "next-auth.session-token";

function safeRedirectPath(raw: string | null): string {
  if (!raw || typeof raw !== "string") return "/";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return "/";
  if (trimmed.startsWith("//")) return "/";
  return trimmed || "/";
}

function redirectTo(path: string): NextResponse {
  const base = BASE_URL.replace(/\/$/, "");
  return NextResponse.redirect(`${base}${safeRedirectPath(path)}`, { status: 302 });
}

/**
 * GET /api/auth/mobile/webview-token
 *
 * Menukar JWT mobile menjadi NextAuth session cookie agar WebView terotentikasi.
 *
 * Query params:
 *   token    — JWT dari /api/auth/mobile/login atau /google
 *   redirect — Path tujuan setelah login (harus mulai dengan /, default: /)
 *   debug    — "1" untuk mendapatkan JSON response (testing PowerShell/curl)
 *
 * Jika Accept header bukan text/html ATAU ?debug=1:
 *   return JSON { verified, userId, redirect, secretSource }
 *
 * Untuk WebView: selalu redirect, tidak pernah return JSON error.
 * Token invalid / expired → redirect ke /
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token        = searchParams.get("token");
  const redirectPath = safeRedirectPath(searchParams.get("redirect"));
  const debugMode    = searchParams.get("debug") === "1" ||
                       !req.headers.get("accept")?.includes("text/html");

  const secretSource = process.env.JWT_SECRET
    ? "JWT_SECRET"
    : process.env.NEXTAUTH_SECRET
    ? "NEXTAUTH_SECRET"
    : "fallback";

  console.log(`[webview-token] debug=${debugMode} secretSource=${secretSource} redirect=${redirectPath}`);

  if (!token) {
    console.log("[webview-token] no token provided");
    if (debugMode) {
      return NextResponse.json({ verified: false, userId: null, redirect: redirectPath, error: "Token tidak ada", secretSource });
    }
    return redirectTo("/");
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub?: string; email?: string; name?: string };
    console.log("[webview-token] JWT verified, sub:", payload.sub);

    if (!payload?.sub) {
      if (debugMode) return NextResponse.json({ verified: false, userId: null, redirect: redirectPath, error: "sub missing in payload", secretSource });
      return redirectTo("/");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, status: true },
    });

    console.log("[webview-token] user found:", !!user, "status:", user?.status);

    if (!user || user.status === "BANNED" || user.status === "SUSPENDED") {
      if (debugMode) return NextResponse.json({ verified: false, userId: payload.sub, redirect: redirectPath, error: `User not found or blocked (status=${user?.status})`, secretSource });
      return redirectTo("/");
    }

    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const now       = Math.floor(Date.now() / 1000);

    const sessionToken = await new SignJWT({
      sub:   user.id,
      email: user.email,
      name:  user.name,
      iat:   now,
      exp:   now + 30 * 24 * 60 * 60,
    })
      .setProtectedHeader({ alg: "HS256" })
      .sign(secretKey);

    console.log("[webview-token] session token created, redirecting to:", redirectPath);

    if (debugMode) {
      return NextResponse.json({
        verified: true,
        userId: user.id,
        email: user.email,
        redirect: redirectPath,
        secretSource,
        cookieName: COOKIE_NAME,
        sessionTokenPreview: sessionToken.slice(0, 20) + "...",
      });
    }

    const response = redirectTo(redirectPath);
    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge:   30 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webview-token] JWT verify failed:", msg, "secretSource:", secretSource);
    if (debugMode) {
      return NextResponse.json({ verified: false, userId: null, redirect: redirectPath, error: msg, secretSource });
    }
    return redirectTo("/");
  }
}
