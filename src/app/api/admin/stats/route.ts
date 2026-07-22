import { prisma } from "@/lib/prisma";
import { ok, requireAdmin } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [totalUsers, totalSellers, totalProducts, totalOrders, totalRevenue, pendingProducts, pendingKyc] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "SELLER" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.aggregate({
      where: { status: "COMPLETED" },
      _sum: { platformFee: true },
    }),
    prisma.product.count({ where: { isActive: true, isCurated: false } }), // belum dikurasi
    prisma.user.count({ where: { kycStatus: "PENDING" } }),
  ]);

  // Kategori breakdown
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: { where: { isActive: true } } } } },
    orderBy: { sortOrder: "asc" },
  });

  // Pesanan per status
  const ordersByStatus = await prisma.order.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  return ok({
    totalUsers, totalSellers, totalProducts, totalOrders,
    platformFeeCollected: totalRevenue._sum.platformFee ?? 0,
    pendingProducts, pendingKyc,
    categories,
    ordersByStatus,
  });
}
