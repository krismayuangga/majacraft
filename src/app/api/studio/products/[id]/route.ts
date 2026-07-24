import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/studio/products/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const store = await prisma.store.findUnique({ where: { userId: session!.user!.id! } });
  if (!store) return err("Toko tidak ditemukan", 404);

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.storeId !== store.id) return err("Produk tidak ditemukan", 404);

  const body = await req.json();
  const {
    name, description, categoryId, price, originalPrice,
    stock, material, dimensions, weight, length, width, height,
    origin, tags, kondisi, imageUrls,
  } = body;

  // Jika seller update price/originalPrice, recalculate isFlashSale
  const newPrice = price ? parseInt(price) : product.price;
  const newOriginalPrice = originalPrice !== undefined
    ? (originalPrice ? parseInt(originalPrice) : null)
    : product.originalPrice;
  const autoFlashSale = price !== undefined || originalPrice !== undefined
    ? !!(newOriginalPrice && newOriginalPrice > newPrice)
    : undefined; // tidak diubah jika price tidak disentuh

  // Jika produk pernah dapat masukan admin, saat seller edit → clear reason → kembali ke antrian review
  const hadFeedback = !product.isModerated && !!product.rejectionReason;

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description && { description }),
      ...(categoryId && { category: { connect: { id: categoryId } } }),
      ...(price && { price: parseInt(price) }),
      ...(originalPrice !== undefined && { originalPrice: originalPrice ? parseInt(originalPrice) : null }),
      ...(stock && { stock: parseInt(stock) }),
      ...(material !== undefined && { material }),
      ...(dimensions !== undefined && { dimensions }),
      ...(weight !== undefined && { weight: weight ? parseInt(weight) : null }),
      ...(length !== undefined && { length: length ? parseInt(length) : null }),
      ...(width !== undefined && { width: width ? parseInt(width) : null }),
      ...(height !== undefined && { height: height ? parseInt(height) : null }),
      ...(origin && { origin }),
      ...(tags && { tags }),
      ...(imageUrls && { images: { deleteMany: {}, create: imageUrls.map((url: string, i: number) => ({ url, isPrimary: i === 0 })) } }),
      // Auto flash sale berdasarkan harga diskon
      ...(autoFlashSale !== undefined && { isFlashSale: autoFlashSale }),
      // Hapus alasan penolakan saat seller update → produk kembali ke antrian review admin
      ...(hadFeedback && { rejectionReason: null }),
    },
  });
  return ok(updated);
}

// DELETE /api/studio/products/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const store = await prisma.store.findUnique({ where: { userId: session!.user!.id! } });
  if (!store) return err("Toko tidak ditemukan", 404);

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.storeId !== store.id) return err("Produk tidak ditemukan", 404);

  await prisma.product.delete({ where: { id } });
  return ok({ deleted: true });
}
