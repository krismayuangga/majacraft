import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/addresses/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;
  const userId = session!.user!.id!;
  const addr = await prisma.address.findUnique({ where: { id } });
  if (!addr || addr.userId !== userId) return err("Alamat tidak ditemukan", 404);
  const body = await req.json();
  if (body.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }
  const updated = await prisma.address.update({ where: { id }, data: body });
  return ok(updated);
}

// DELETE /api/addresses/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;
  const userId = session!.user!.id!;
  const addr = await prisma.address.findUnique({ where: { id } });
  if (!addr || addr.userId !== userId) return err("Alamat tidak ditemukan", 404);
  await prisma.address.delete({ where: { id } });
  return ok({ deleted: true });
}
