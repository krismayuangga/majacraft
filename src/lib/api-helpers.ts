import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { headers } from "next/headers";

const MOBILE_JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function paginate<T>(items: T[], total: number, page: number, limit: number) {
  return ok({ items, total, page, limit, pages: Math.ceil(total / limit) });
}

/**
 * Require authenticated session.
 *
 * Mendukung dua cara autentikasi:
 * 1. NextAuth session cookie (web browser)
 * 2. Authorization: Bearer <jwt> (mobile app Flutter/React Native)
 *
 * Jika keduanya tidak ada → return 401.
 */
export async function requireAuth() {
  // 1. Coba NextAuth session terlebih dahulu (web)
  const session = await auth();
  if (session?.user?.id) return { session, error: null };

  // 2. Fallback: cek Authorization: Bearer header (mobile JWT)
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization") ?? headersList.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      const payload = jwt.verify(token, MOBILE_JWT_SECRET) as {
        sub?: string; userId?: string; email?: string; name?: string; role?: string;
      };

      const userId = payload.sub || payload.userId;
      if (!userId) return { session: null, error: err("Unauthorized", 401) };

      // Buat session-like object yang kompatibel dengan kode yang sudah ada
      const mobileSession = {
        user: {
          id:    userId,
          email: payload.email ?? "",
          name:  payload.name  ?? "",
          role:  payload.role  ?? "BUYER",
        },
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      return { session: mobileSession as any, error: null };
    }
  } catch {
    // JWT invalid atau expired → lanjut return 401
  }

  return { session: null, error: err("Unauthorized", 401) };
}

/** Require ADMIN role — cek dari DB langsung agar tidak terpengaruh JWT stale */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { session: null, error: err("Unauthorized", 401) };

  // Verifikasi role langsung dari DB (bukan dari JWT yang bisa stale)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") {
    return { session: null, error: err("Forbidden", 403) };
  }

  return { session, error: null };
}
