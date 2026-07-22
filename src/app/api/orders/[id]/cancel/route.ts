import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

// POST /api/orders/[id]/cancel — pembeli batalkan pesanan PENDING_PAYMENT
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const userId = session!.user!.id!;

  const order = await prisma.order.findUnique({
    where: { id, userId },
    include: { items: true },
  });
  if (!order) return err("Pesanan tidak ditemukan", 404);
  if (order.status !== "PENDING_PAYMENT") return err("Hanya pesanan belum dibayar yang bisa dibatalkan");

  // Cancel order + kembalikan stok
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id },
      data: { status: "CANCELLED", escrowStatus: "WAITING" },
    });
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.qty } },
      });
    }
  });

  return ok({ message: "Pesanan berhasil dibatalkan" });
}
