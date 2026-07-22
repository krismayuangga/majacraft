import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAdmin } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const body = await req.json();

  const store = await prisma.store.findUnique({ where: { id } });
  if (!store) return err("Toko tidak ditemukan", 404);

  const updated = await prisma.store.update({
    where: { id },
    data: { isVerified: body.isVerified ?? store.isVerified, isActive: body.isActive ?? store.isActive },
  });

  return ok(updated);
}
