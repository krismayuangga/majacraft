import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";

/**
 * GET /api/auth/mobile/webview-token
 *
 * Mobile app mengirim JWT Bearer token → endpoint ini validasi → redirect ke
 * /api/auth/callback/credentials (NextAuth) agar WebView mendapat session cookie.
 *
 * Query params:
 *   token   — JWT dari mobile login
 *   redirect — URL tujuan setelah login (default: /)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token    = searchParams.get("token");
  const redirect = searchParams.get("redirect") ?? "/";

  if (!token) {
    return NextResponse.json({ error: "Token wajib diisi" }, { status: 400 });
  }

  try {
    // 1. Verifikasi JWT
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };

    // 2. Ambil data user dari DB
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    if (user.status === "BANNED") {
      return NextResponse.json({ error: "Akun diblokir" }, { status: 403 });
    }

    // 3. Buat NextAuth session via signIn credentials
    // Karena kita di server-side, kita bisa set cookie session langsung
    // menggunakan encode dari next-auth/jwt
    const { encode } = await import("next-auth/jwt");
    // next-auth v5 encode expects salt instead of secret in some configs
    // Use jose directly to stay compatible across versions
    const { SignJWT } = await import("jose");
    const secretKey = new TextEncoder().encode(JWT_SECRET);

    const sessionToken = await new SignJWT({
      sub: user.id, email: user.email, name: user.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    })
      .setProtectedHeader({ alg: "HS256" })
      .sign(secretKey);

    // 4. Set cookie dan redirect ke halaman tujuan
    const response = NextResponse.redirect(
      new URL(redirect, req.url),
      { status: 302 },
    );

    const cookieName = process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge:   30 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    console.error("[webview-token]", err);
    return NextResponse.json({ error: "Token tidak valid atau kadaluarsa" }, { status: 401 });
  }
}
