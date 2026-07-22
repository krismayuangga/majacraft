import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

// GET /api/reviews?productId=xxx&sort=newest&rating=5&hasMedia=true
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const productId = searchParams.get("productId");
  const sort = searchParams.get("sort") ?? "newest"; // newest, oldest, highest, lowest, helpful
  const rating = searchParams.get("rating"); // 1-5 or null
  const hasMedia = searchParams.get("hasMedia") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "10"));

  if (!productId) return err("productId required");

  const where = {
    productId,
    ...(rating && { rating: parseInt(rating) }),
    ...(hasMedia && {
      OR: [
        { imageUrls: { isEmpty: false } },
        { videoUrl: { not: null } },
      ],
    }),
  };

  const orderBy = {
    newest: { createdAt: "desc" as const },
    oldest: { createdAt: "asc" as const },
    highest: { rating: "desc" as const },
    lowest: { rating: "asc" as const },
    helpful: { helpfulCount: "desc" as const },
  }[sort] ?? { createdAt: "desc" as const };

  const [reviews, total, stats] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    }),
    prisma.review.count({ where }),
    prisma.review.groupBy({
      by: ["rating"],
      where: { productId },
      _count: { rating: true },
    }),
  ]);

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    rating: star,
    count: stats.find((s) => s.rating === star)?._count.rating ?? 0,
  }));

  const totalReviews = stats.reduce((acc, s) => acc + s._count.rating, 0);
  const averageRating =
    totalReviews > 0
      ? stats.reduce((acc, s) => acc + s.rating * s._count.rating, 0) / totalReviews
      : 0;

  return ok({
    reviews,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    stats: {
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      ratingDistribution,
    },
  });
}

// POST /api/reviews — Create review (must have purchased)
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;
  if (!session?.user?.id) return err("Unauthorized", 401);

  const body = await req.json();
  const { orderId, productId, rating, comment, imageUrls, videoUrl } = body;

  if (!orderId || !productId || !rating) {
    return err("orderId, productId, dan rating wajib diisi");
  }

  if (rating < 1 || rating > 5) {
    return err("Rating harus antara 1-5");
  }

  // Verify user has purchased this product in this order
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: session.user.id,
      status: "COMPLETED",
      items: {
        some: { productId },
      },
    },
  });

  if (!order) {
    return err("Order tidak ditemukan atau belum selesai");
  }

  // Check if already reviewed
  const existing = await prisma.review.findUnique({
    where: {
      orderId_productId_userId: {
        orderId,
        productId,
        userId: session.user.id,
      },
    },
  });

  if (existing) {
    return err("Anda sudah memberikan review untuk produk ini");
  }

  // Create review
  const review = await prisma.review.create({
    data: {
      orderId,
      productId,
      userId: session.user.id,
      rating,
      comment: comment || null,
      imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
      videoUrl: videoUrl || null,
    },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  // Update product rating stats
  await updateProductRating(productId);

  return ok(review, 201);
}

// Helper: Update product rating stats
async function updateProductRating(productId: string) {
  const stats = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: stats._avg.rating ?? 0,
      reviewCount: stats._count.rating,
    },
  });
}
