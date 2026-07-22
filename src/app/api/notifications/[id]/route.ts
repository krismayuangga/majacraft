import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

// PATCH /api/notifications/[id] — tandai satu notifikasi dibaca
export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const notif = await prisma.notification.findUnique({ where: { id } });
  if (!notif || notif.userId !== session!.user!.id!) return err("Notifikasi tidak ditemukan", 404);

  await prisma.notification.update({ where: { id }, data: { isRead: true } });
  return ok({ success: true });
}
