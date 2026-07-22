import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

// POST /api/studio/products/[id]/sold-offline — tandai terjual di luar platform
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const store = await prisma.store.findUnique({ where: { userId: session!.user!.id! } });
  if (!store) return err("Toko tidak ditemukan", 404);

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.storeId !== store.id) return err("Produk tidak ditemukan", 404);

  await prisma.product.update({
    where: { id },
    data: {
      isSoldOffline: true,
      soldOfflineAt: new Date(),
      stock: 0,
    },
  });

  // Hapus dari semua keranjang
  await prisma.cartItem.deleteMany({ where: { productId: id } });

  return ok({ message: "Produk ditandai terjual di luar platform" });
}

// DELETE — batalkan tandai terjual offline (jika salah tandai)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const store = await prisma.store.findUnique({ where: { userId: session!.user!.id! } });
  if (!store) return err("Toko tidak ditemukan", 404);

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.storeId !== store.id) return err("Produk tidak ditemukan", 404);

  await prisma.product.update({
    where: { id },
    data: { isSoldOffline: false, soldOfflineAt: null },
  });

  return ok({ message: "Status terjual offline dibatalkan" });
}
