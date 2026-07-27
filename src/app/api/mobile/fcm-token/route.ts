import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

/**
 * POST /api/mobile/fcm-token
 * Flutter mobile app mendaftarkan FCM token setelah login.
 *
 * Body: { fcmToken: string, platform?: "android" | "ios" }
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const fcmToken = String(body.fcmToken ?? body.token ?? "").trim();
  const platform = String(body.platform ?? "android").trim();

  if (!fcmToken) return err("fcmToken wajib diisi", 400);
  if (fcmToken.length < 20) return err("fcmToken tidak valid", 400);

  const userId = session!.user!.id!;

  await prisma.pushDevice.upsert({
    where: { token: fcmToken },
    update: {
      userId,
      platform,
      isActive: true,
      lastUsedAt: new Date(),
    },
    create: {
      userId,
      token: fcmToken,
      platform,
      isActive: true,
      lastUsedAt: new Date(),
    },
  });

  return ok({ message: "FCM token berhasil didaftarkan" });
}

/**
 * DELETE /api/mobile/fcm-token
 * Hapus FCM token saat logout.
 *
 * Body: { fcmToken: string }
 */
export async function DELETE(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const fcmToken = String(body.fcmToken ?? body.token ?? "").trim();
  if (!fcmToken) return err("fcmToken wajib diisi", 400);

  await prisma.pushDevice.updateMany({
    where: { token: fcmToken, userId: session!.user!.id! },
    data: { isActive: false },
  });

  return ok({ message: "FCM token dihapus" });
}
