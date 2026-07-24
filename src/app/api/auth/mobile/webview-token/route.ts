import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";

const JWT_SECRET  = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";
const BASE_URL    = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://majacraft.id";
const COOKIE_NAME = process.env.NODE_ENV === "production"
  ? "__Secure-next-auth.session-token"
  : "next-auth.session-token";

/** Sanitasi redirect: harus berupa path relatif yang valid, default ke "/" */
function safeRedirectPath(raw: string | null): string {
  if (!raw || typeof raw !== "string") return "/";
  const trimmed = raw.trim();
  // Hanya izinkan path relatif (mulai dengan /)
  if (!trimmed.startsWith("/")) return "/";
  // Tolak double-slash atau protocol injection
  if (trimmed.startsWith("//")) return "/";
  return trimmed || "/";
}

/** Selalu redirect — tidak pernah kembalikan JSON error agar WebView tidak menampilkan teks mentah */
function redirectTo(path: string, req: NextRequest): NextResponse {
  const base = BASE_URL.replace(/\/$/, "");
  const safePath = safeRedirectPath(path);
  return NextResponse.redirect(`${base}${safePath}`, { status: 302 });
}

/**
 * GET /api/auth/mobile/webview-token
 *
 * Menukar JWT mobile → NextAuth session cookie agar WebView terotentikasi.
 *
 * Query params:
 *   token    — JWT dari /api/auth/mobile/login atau /google
 *   redirect — Path tujuan setelah login (harus mulai dengan /, default: /)
 *
 * Selalu redirect (tidak pernah return JSON) sehingga WebView tidak crash.
 * Token invalid / expired → redirect ke /
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token        = searchParams.get("token");
  const redirectPath = safeRedirectPath(searchParams.get("redirect"));

  // Tidak ada token → redirect ke home
  if (!token) {
    return redirectTo("/", req);
  }

  try {
    // 1. Verifikasi JWT
    const payload = jwt.verify(token, JWT_SECRET) as { sub?: string };

    if (!payload?.sub) {
      return redirectTo("/", req);
    }

    // 2. Ambil data user
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, status: true },
    });

    if (!user || user.status === "BANNED" || user.status === "SUSPENDED") {
      return redirectTo("/", req);
    }

    // 3. Buat NextAuth session token via jose (kompatibel semua versi next-auth)
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const now       = Math.floor(Date.now() / 1000);

    const sessionToken = await new SignJWT({
      sub:   user.id,
      email: user.email,
      name:  user.name,
      iat:   now,
      exp:   now + 30 * 24 * 60 * 60, // 30 hari
    })
      .setProtectedHeader({ alg: "HS256" })
      .sign(secretKey);

    // 4. Set cookie dan redirect ke tujuan
    const response = redirectTo(redirectPath, req);

    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge:   30 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    // JWT expired, invalid signature, dsb → redirect ke home (tidak tampilkan error ke WebView)
    console.error("[webview-token]", err instanceof Error ? err.message : err);
    return redirectTo("/", req);
  }
}

