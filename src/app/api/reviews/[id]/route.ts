import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

// PATCH /api/reviews/[id] — Mark review as helpful
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const review = await prisma.review.update({
    where: { id },
    data: {
      helpfulCount: { increment: 1 },
    },
  });

  return ok(review);
}

// DELETE /api/reviews/[id] — Delete own review
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;
  if (!session?.user?.id) return err("Unauthorized", 401);

  const { id } = await context.params;

  const review = await prisma.review.findUnique({
    where: { id },
    select: { userId: true, productId: true },
  });

  if (!review) return err("Review tidak ditemukan", 404);

  if (review.userId !== session.user.id) {
    return err("Anda tidak bisa menghapus review orang lain", 403);
  }

  await prisma.review.delete({ where: { id } });

  // Update product rating stats
  const stats = await prisma.review.aggregate({
    where: { productId: review.productId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.product.update({
    where: { id: review.productId },
    data: {
      rating: stats._avg.rating ?? 0,
      reviewCount: stats._count.rating,
    },
  });

  return ok({ message: "Review berhasil dihapus" });
}
