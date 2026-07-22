import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

// DELETE /api/wishlist/[productId] — hapus dari wishlist
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { productId } = await params;
  const userId = session!.user!.id!;

  await prisma.wishlist.deleteMany({ where: { userId, productId } });
  return ok({ removed: true });
}

// GET /api/wishlist/[productId] — cek apakah produk di wishlist
export async function GET(_req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { session, error } = await requireAuth();
  if (error) return ok({ wishlisted: false });

  const { productId } = await params;
  const found = await prisma.wishlist.findFirst({
    where: { userId: session!.user!.id!, productId },
  });
  return ok({ wishlisted: !!found });
}
