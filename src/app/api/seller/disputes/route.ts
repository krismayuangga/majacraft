import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

// GET /api/seller/disputes — list disputes for seller's store
export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const userId = session!.user!.id!;

  // Get seller's store
  const store = await prisma.store.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!store) return err("Toko tidak ditemukan", 404);

  const disputes = await prisma.dispute.findMany({
    where: { sellerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        select: {
          orderNumber: true,
          total: true,
        },
      },
      buyer: { select: { name: true, image: true } },
      _count: { select: { messages: true } },
    },
  });

  return ok(disputes);
}
