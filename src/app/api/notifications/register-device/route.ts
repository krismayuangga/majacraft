import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

// POST /api/notifications/register-device
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const token = String(body.token ?? "").trim();
  const platform = String(body.platform ?? "").trim() || null;

  if (!token) return err("Token wajib diisi", 400);

  const device = await prisma.pushDevice.upsert({
    where: { token },
    update: {
      userId: session!.user!.id!,
      platform,
      isActive: true,
      lastUsedAt: new Date(),
    },
    create: {
      userId: session!.user!.id!,
      token,
      platform,
      isActive: true,
      lastUsedAt: new Date(),
    },
  });

  return ok({ id: device.id, token: device.token });
}

// DELETE /api/notifications/register-device
export async function DELETE(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const token = String(body.token ?? "").trim();

  if (!token) return err("Token wajib diisi", 400);

  await prisma.pushDevice.updateMany({
    where: { userId: session!.user!.id!, token },
    data: { isActive: false },
  });

  return ok({ success: true });
}
