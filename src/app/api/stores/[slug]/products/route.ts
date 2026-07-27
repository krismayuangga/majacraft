import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api-helpers";

/**
 * GET /api/stores/[slug]/products
 * Public endpoint — produk aktif dari toko tertentu, dengan pagination & filter
 *
 * Query params:
 *   page        (default: 1)
 *   limit       (default: 20, max: 50)
 *   kategori    — slug kategori
 *   search      — cari di nama, deskripsi, tags
 *   sort        — terbaru | terlaris | harga-asc | harga-desc | rating
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { searchParams } = req.nextUrl;

  const page     = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit    = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  // Support both "kategori" (web) and "category" (mobile) param names
  const kategori = searchParams.get("kategori") ?? searchParams.get("category") ?? undefined;
  const search   = searchParams.get("search")   ?? undefined;
  const sort     = searchParams.get("sort")      ?? "terbaru";

  const store = await prisma.store.findUnique({
    where: { slug, isActive: true },
    select: { id: true },
  });
  if (!store) return err("Toko tidak ditemukan", 404);

  const where: Record<string, unknown> = {
    storeId:      store.id,
    isActive:     true,
    isModerated:  true,
    isSoldOffline: false,
    ...(kategori && { category: { slug: kategori } }),
    ...(search   && {
      OR: [
        { name:        { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search.toLowerCase() } },
      ],
    }),
  };

  const orderBy = {
    terbaru:      { createdAt: "desc" as const },
    terlaris:     { soldCount:  "desc" as const },
    "harga-asc":  { price:      "asc"  as const },
    "harga-desc": { price:      "desc" as const },
    rating:       { rating:     "desc" as const },
  }[sort] ?? { createdAt: "desc" as const };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip:  (page - 1) * limit,
      take:  limit,
      select: {
        id:           true,
        name:         true,
        slug:         true,
        price:        true,
        originalPrice: true,
        stock:        true,
        rating:       true,
        reviewCount:  true,
        soldCount:    true,
        hasCertificate: true,
        isFeatured:   true,
        images:   { where: { isPrimary: true }, select: { url: true }, take: 1 },
        category: { select: { name: true, slug: true } },
        store:    { select: { name: true, slug: true, province: true, isVerified: true, rating: true, logoUrl: true, totalSold: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return ok({
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
