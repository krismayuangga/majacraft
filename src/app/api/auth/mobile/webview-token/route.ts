import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const MOBILE_JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";
const NEXTAUTH_SECRET   = process.env.NEXTAUTH_SECRET!;
const BASE_URL          = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://majacraft.id";

// NextAuth v5: cookie name = salt untuk encode/decode
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
 * Menukar mobile JWT → NextAuth session cookie (JWE format) agar WebView login.
 *
 * NextAuth v5 menggunakan JWE (encrypted token), bukan plain HS256.
 * encode() dari next-auth/jwt membuat token dalam format yang benar.
 * salt = nama cookie (penting untuk NextAuth v5 key derivation).
 *
 * Query params:
 *   token    — JWT dari /api/auth/mobile/login atau /google
 *   redirect — Path tujuan (default: /)
 *   debug    — "1" untuk return JSON (testing PowerShell/curl)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token        = searchParams.get("token");
  const redirectPath = safeRedirectPath(searchParams.get("redirect"));
  const debugMode    = searchParams.get("debug") === "1" ||
                       !req.headers.get("accept")?.includes("text/html");

  console.log(`[webview-token] debug=${debugMode} cookieName=${COOKIE_NAME} redirect=${redirectPath}`);

  if (!token) {
    console.log("[webview-token] ❌ No token");
    if (debugMode) return NextResponse.json({ verified: false, error: "Token tidak ada", cookieName: COOKIE_NAME });
    return redirectTo("/");
  }

  try {
    // 1. Verifikasi mobile JWT (HS256, dibuat oleh /login atau /google)
    const payload = jwt.verify(token, MOBILE_JWT_SECRET) as {
      sub?: string; userId?: string; email?: string; name?: string; role?: string;
    };

    // /login menggunakan field "userId", /google menggunakan "sub"
    const resolvedId = payload.sub || payload.userId;
    console.log("[webview-token] ✅ JWT verified sub/userId:", resolvedId);

    if (!resolvedId) {
      if (debugMode) return NextResponse.json({ verified: false, error: "sub or userId missing in payload", cookieName: COOKIE_NAME });
      return redirectTo("/");
    }

    // 2. Ambil data user terbaru dari DB
    const user = await prisma.user.findUnique({
      where: { id: resolvedId },
      select: { id: true, email: true, name: true, role: true, image: true, status: true },
    });

    if (!user || user.status === "BANNED" || user.status === "SUSPENDED") {
      console.log("[webview-token] ❌ User blocked/not found:", user?.status);
      if (debugMode) return NextResponse.json({ verified: false, error: `User blocked (${user?.status})`, userId: resolvedId, cookieName: COOKIE_NAME });
      return redirectTo("/");
    }

    // 3. Buat NextAuth session token — HARUS pakai encode() dari next-auth/jwt
    //    dengan salt = nama cookie agar format JWE benar dan NextAuth bisa decode
    const sessionToken = await encode({
      token: {
        sub:   user.id,
        id:    user.id,
        email: user.email ?? undefined,
        name:  user.name ?? undefined,
        image: user.image ?? undefined,
        role:  user.role,
      },
      secret: NEXTAUTH_SECRET,
      salt:   COOKIE_NAME,   // KRITIS: salt harus sama dengan nama cookie
      maxAge: 30 * 24 * 60 * 60,
    });

    console.log("[webview-token] ✅ Session encoded (JWE), cookieName:", COOKIE_NAME);

    if (debugMode) {
      return NextResponse.json({
        verified: true,
        userId:   user.id,
        email:    user.email,
        role:     user.role,
        redirect: redirectPath,
        cookieName: COOKIE_NAME,
        tokenFormat: "JWE (NextAuth v5 compatible)",
        tokenPreview: sessionToken.slice(0, 30) + "...",
      });
    }

    // 4. Redirect + set cookie
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
    console.error("[webview-token] ❌ Error:", msg);
    if (debugMode) return NextResponse.json({ verified: false, error: msg, cookieName: COOKIE_NAME });
    return redirectTo("/");
  }
}
