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
  // Whitelist fields yang boleh diupdate (termasuk district & village)
  const { label, name, phone, address, city, province, district, village, zip, isDefault } = body;
  const updated = await prisma.address.update({
    where: { id },
    data: {
      ...(label     !== undefined && { label }),
      ...(name      !== undefined && { name }),
      ...(phone     !== undefined && { phone }),
      ...(address   !== undefined && { address }),
      ...(city      !== undefined && { city }),
      ...(province  !== undefined && { province }),
      ...(district  !== undefined && { district: district ?? null }),
      ...(village   !== undefined && { village:  village  ?? null }),
      ...(zip       !== undefined && { zip }),
      ...(isDefault !== undefined && { isDefault }),
    },
  });
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
