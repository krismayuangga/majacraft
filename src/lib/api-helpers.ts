import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function paginate<T>(items: T[], total: number, page: number, limit: number) {
  return ok({ items, total, page, limit, pages: Math.ceil(total / limit) });
}

/** Require authenticated session */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) return { session: null, error: err("Unauthorized", 401) };
  return { session, error: null };
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
