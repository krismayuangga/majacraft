import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

// GET /api/studio/orders
export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const store = await prisma.store.findUnique({ where: { userId: session!.user!.id! } });
  if (!store) return err("Toko tidak ditemukan", 404);

  const status = req.nextUrl.searchParams.get("status") ?? undefined;

  // Auto-complete pesanan SHIPPED > 3 hari (berlaku global, bukan hanya toko ini)
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  await prisma.order.updateMany({
    where: { status: "SHIPPED", shippedAt: { lt: threeDaysAgo } },
    data: { status: "COMPLETED", escrowStatus: "RELEASING", deliveredAt: new Date() },
  });

  // Auto-cancel pesanan PENDING_PAYMENT yang melewati deadline
  const expiredOrders = await prisma.order.findMany({
    where: {
      status: "PENDING_PAYMENT",
      paymentDeadline: { lt: new Date() },
      items: { some: { product: { storeId: store.id } } },
    },
    include: { items: true },
  });
  for (const order of expiredOrders) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.qty } },
      }).catch(() => {});
    }
  }

  const orders = await prisma.order.findMany({
    where: {
      items: { some: { product: { storeId: store.id } } },
      ...(status ? { status: status as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        where: { product: { storeId: store.id } },
        include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } },
      },
      address: { select: { city: true, province: true } },
    },
  });

  return ok(orders);
}

// Helper: auto-complete pesanan SHIPPED > 3 hari (dipanggil dari berbagai endpoint)
export async function autoCompleteShipped() {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  await prisma.order.updateMany({
    where: { status: "SHIPPED", shippedAt: { lt: threeDaysAgo } },
    data: { status: "COMPLETED", escrowStatus: "RELEASING", deliveredAt: new Date() },
  });
}
