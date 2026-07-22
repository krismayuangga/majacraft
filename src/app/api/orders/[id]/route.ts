import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

// GET /api/orders/[id] — detail satu pesanan
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const userId = session!.user!.id!;

  const order = await prisma.order.findUnique({
    where: { id, userId },
    include: {
      items: {
        include: {
          product: {
            include: { images: { where: { isPrimary: true }, take: 1 } },
          },
        },
      },
      address: true,
    },
  });

  if (!order) return err("Pesanan tidak ditemukan", 404);

  return ok(order);
}
