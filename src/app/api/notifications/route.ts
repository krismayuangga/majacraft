import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, requireAuth } from "@/lib/api-helpers";

// GET /api/notifications — ambil notifikasi user
export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const userId = session!.user!.id!;
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "20");

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return ok({ notifications, unreadCount });
}

// PATCH /api/notifications — tandai semua sebagai dibaca
export async function PATCH() {
  const { session, error } = await requireAuth();
  if (error) return error;

  await prisma.notification.updateMany({
    where: { userId: session!.user!.id!, isRead: false },
    data: { isRead: true },
  });

  return ok({ message: "Semua notifikasi ditandai dibaca" });
}
