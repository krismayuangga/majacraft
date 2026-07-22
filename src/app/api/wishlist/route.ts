import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth } from "@/lib/api-helpers";

// GET /api/wishlist — ambil semua wishlist user
export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const wishlists = await prisma.wishlist.findMany({
    where: { userId: session!.user!.id! },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          store: { select: { name: true, province: true, isVerified: true } },
          category: { select: { slug: true } },
        },
      },
    },
  });

  return ok(wishlists);
}

// POST /api/wishlist — tambah ke wishlist
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { productId } = await req.json();
  if (!productId) return err("productId wajib diisi");

  const userId = session!.user!.id!;

  // Cek sudah ada
  const existing = await prisma.wishlist.findFirst({ where: { userId, productId } });
  if (existing) return ok({ id: existing.id, exists: true });

  const wishlist = await prisma.wishlist.create({ data: { userId, productId } });
  return ok({ id: wishlist.id, exists: false }, 201);
}
