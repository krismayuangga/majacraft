import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAdmin } from "@/lib/api-helpers";

// POST /api/admin/products/[id]/flashsale — toggle isFlashSale
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { isFlashSale: true } });
  if (!product) return err("Produk tidak ditemukan", 404);

  const updated = await prisma.product.update({
    where: { id },
    data: { isFlashSale: !product.isFlashSale },
    select: { id: true, isFlashSale: true },
  });

  return ok(updated);
}
