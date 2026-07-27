import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, paginate, requireAuth } from "@/lib/api-helpers";

// Seeded shuffle — deterministic berdasarkan seed (misal: hari ini)
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = Math.imul(s ^ (s >>> 17), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 15), 0x119de1f3);
    s = (s ^ (s >>> 13)) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// GET /api/products?page=1&limit=20&kategori=batik-kain&search=&sort=terlaris
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit    = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const kategori = searchParams.get("kategori") ?? undefined;
  const search   = searchParams.get("search") ?? undefined;
  const sort     = searchParams.get("sort") ?? "terbaru";
  const featured = searchParams.get("featured") === "1";
  const cert     = searchParams.get("sertifikat") === "1";
  const flashSale = searchParams.get("flashSale") === "1";
  const hasDiscount = searchParams.get("hasDiscount") === "1";
  const dailyRotation = searchParams.get("dailyRotation") === "1";

  const slug     = searchParams.get("slug")      ?? undefined;
  const storeSlug = searchParams.get("storeSlug") ?? undefined;

  const where = {
    isActive: true,
    ...(slug && { slug }),
    ...(storeSlug && { store: { slug: storeSlug } }),
    ...(kategori && !slug && { category: { slug: kategori } }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
        { tags: { has: search.toLowerCase() } },
      ],
    }),
    ...(featured && { isFeatured: true }),
    ...(cert && { hasCertificate: true }),
    ...(flashSale && { isFlashSale: true }),
    ...(hasDiscount && { originalPrice: { not: null } }),
  };

  const orderBy = {
    terbaru:    { createdAt: "desc" as const },
    terlaris:   { soldCount: "desc" as const },
    "harga-asc":  { price: "asc" as const },
    "harga-desc": { price: "desc" as const },
    rating:     { rating: "desc" as const },
  }[sort] ?? { createdAt: "desc" as const };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where, orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        store: { select: { name: true, province: true, isVerified: true, rating: true } },
        category: { select: { name: true, slug: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  // Daily rotation: ambil semua flash sale, acak berdasarkan hari ini, return 10
  if (flashSale && dailyRotation) {
    const allFS = await prisma.product.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        store: { select: { name: true, province: true, isVerified: true, rating: true } },
        category: { select: { name: true, slug: true } },
      },
    });
    const daySeed = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    const shuffled = seededShuffle(allFS, daySeed).slice(0, 10);
    return paginate(shuffled, allFS.length, 1, 10);
  }

  return paginate(items, total, page, limit);
}

// POST /api/products — seller only
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  // Cek user punya store
  const store = await prisma.store.findUnique({
    where: { userId: session!.user!.id! },
  });
  if (!store) return err("Buka Studio Seniman terlebih dahulu", 403);

  const body = await req.json();
  const { name, description, price, originalPrice, stock, categoryId,
          material, dimensions, weight, origin, tags } = body;

  if (!name || !description || !price || !categoryId)
    return err("name, description, price, categoryId wajib diisi");

  // Generate slug unik
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const count = await prisma.product.count({ where: { slug: { startsWith: baseSlug } } });
  const slug  = count > 0 ? `${baseSlug}-${count + 1}` : baseSlug;

  const product = await prisma.product.create({
    data: {
      storeId: store.id, categoryId, name, slug, description,
      price: parseInt(price), originalPrice: originalPrice ? parseInt(originalPrice) : null,
      stock: parseInt(stock ?? 1),
      material, dimensions, weight: weight ? parseInt(weight) : null, origin,
      tags: tags ?? [],
      isActive: false, // perlu kurasi admin
    },
  });

  return ok(product, 201);
}
