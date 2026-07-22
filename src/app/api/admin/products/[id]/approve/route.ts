import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAdmin } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return err("Produk tidak ditemukan", 404);

  const updated = await prisma.product.update({
    where: { id },
    data: { isActive: true, hasCertificate: true },
  });

  return ok({ message: "Produk disetujui", product: updated });
}
