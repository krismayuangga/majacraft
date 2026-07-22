import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAdmin } from "@/lib/api-helpers";

// DELETE /api/admin/products/[id] — hapus produk (admin only)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!product) return err("Produk tidak ditemukan", 404);

  // Jika ada order aktif, tolak hapus
  if (product._count.orderItems > 0) {
    return err("Produk tidak bisa dihapus karena memiliki riwayat pesanan. Nonaktifkan saja.", 409);
  }

  // Hapus relasi dulu (yang tidak punya onDelete cascade)
  await prisma.productImage.deleteMany({ where: { productId: id } });
  await prisma.cartItem.deleteMany({ where: { productId: id } });
  await prisma.wishlist.deleteMany({ where: { productId: id } });

  // Hapus produk
  await prisma.product.delete({ where: { id } });

  return ok({ message: "Produk berhasil dihapus" });
}
